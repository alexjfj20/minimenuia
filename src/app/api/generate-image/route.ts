import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ============================================================
// INTERFACES
// ============================================================

interface AIModel {
  id: string;
  provider: string;
  model: string;
  api_key: string;
  base_url: string | null;
  auth_type: string;
  use_case: string;
  priority: number;
}

interface GenerateImageRequestBody {
  prompt: string;
  size?: '1024x1024';
}

interface OpenAIImageData {
  b64_json: string;
}

interface OpenAIImageResponse {
  data: OpenAIImageData[];
}

interface GenerateImageSuccessResponse {
  success: true;
  image: string;
  attempts?: number;
  fallback?: boolean;
  provider?: string;
}

interface GenerateImageErrorResponse {
  success: false;
  error: string;
}

type GenerateImageResponse =
  | GenerateImageSuccessResponse
  | GenerateImageErrorResponse;

interface FallbackResult<T> {
  data: T;
  provider: string;
  attemptCount: number;
}

// ============================================================
// HELPER — Obtener TODOS los modelos activos para imagen
// ============================================================

const getActiveImageModels = async (): Promise<AIModel[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .select('id, provider, model, api_key, base_url, auth_type, use_case, priority')
      .eq('active', true)
      .in('use_case', ['image', 'both'])
      .order('priority', { ascending: true });

    if (error) {
      console.error('[generate-image] Error obteniendo modelos activos:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[generate-image] No hay modelos activos para imagen');
      return [];
    }

    console.log('[generate-image] Modelos activos encontrados:', data.length);

    return data as AIModel[];
  } catch (error) {
    console.error('[generate-image] Error inesperado obteniendo modelos:', error);
    return [];
  }
};

// ============================================================
// HELPER - Generate SVG Placeholder for Food
// ============================================================

function generateFoodPlaceholderSVG(prompt: string): string {
  const words = prompt.split(' ').filter(w => w.length > 3);
  const initials = words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || 'NP';
  
  const hue = prompt.toLowerCase().includes('bebida') || prompt.toLowerCase().includes('jugo')
    ? 200
    : prompt.toLowerCase().includes('postre') || prompt.toLowerCase().includes('dulce')
      ? 340
      : prompt.toLowerCase().includes('entrada')
        ? 60
        : 30;
  
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 85%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue + 30}, 80%, 75%);stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
        </filter>
      </defs>
      <rect width="1024" height="1024" fill="url(#grad)"/>
      <ellipse cx="512" cy="580" rx="280" ry="80" fill="rgba(255,255,255,0.4)" transform="rotate(-10 512 580)"/>
      <ellipse cx="512" cy="560" rx="260" ry="260" fill="rgba(255,255,255,0.9)" filter="url(#shadow)"/>
      <circle cx="450" cy="520" r="40" fill="hsl(${hue}, 60%, 60%)" opacity="0.8"/>
      <circle cx="520" cy="500" r="50" fill="hsl(${hue}, 70%, 55%)" opacity="0.9"/>
      <circle cx="590" cy="530" r="45" fill="hsl(${hue}, 65%, 58%)" opacity="0.85"/>
      <circle cx="500" cy="580" r="35" fill="hsl(${hue}, 75%, 52%)" opacity="0.75"/>
      <path d="M 480 470 Q 500 450 520 470" stroke="hsl(${hue + 20}, 80%, 45%)" stroke-width="4" fill="none" opacity="0.6"/>
      <text x="512" y="720" font-family="Arial, sans-serif" font-size="72" font-weight="bold" 
            fill="hsl(${hue}, 50%, 35%)" text-anchor="middle" opacity="0.6">
        ${initials}
      </text>
      <rect x="20" y="20" width="984" height="984" fill="none" 
            stroke="hsl(${hue}, 40%, 70%)" stroke-width="8" rx="20"/>
    </svg>
  `.trim();
  
  return svg;
}

function svgToBase64DataUri(svg: string): string {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(svg);
  const binary = Array.from(uint8Array).map(b => String.fromCharCode(b)).join('');
  const base64 = btoa(binary);
  return `data:image/svg+xml;base64,${base64}`;
}

// ============================================================
// FALLBACK — Intentar con todos los proveedores para imagen
// ============================================================

const isRetryableError = (message: string): boolean => {
  const retryablePatterns = [
    '429', 'rate limit', 'quota',
    '400', 'billing_hard_limit',
    '401', 'invalid_api_key', 'Incorrect API key',
    '403', 'forbidden',
    '500', '502', '503', '504',
    'network', 'fetch failed', 'timeout',
    'AbortError'
  ];
  
  return retryablePatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()));
};

const tryCallProviderForImage = async (
  model: AIModel,
  prompt: string,
  size: '1024x1024'
): Promise<string> => {
  const provider = model.provider;
  const apiKey = model.api_key;
  const baseUrl = model.base_url;
  const safePrompt = `Professional food photography, ${prompt.trim()}, appetizing presentation, restaurant quality, clean white plate, soft natural lighting, NO TEXT, NO WORDS, NO LABELS`;

  // Groq → Saltar siempre (no soporta imágenes)
  if (provider.includes('Groq')) {
    throw new Error('Groq no soporta imágenes');
  }

  // OpenAI GPT → DALL-E 3
  if (provider.includes('OpenAI GPT')) {
    const openaiRes = await fetch(
      `${baseUrl || 'https://api.openai.com/v1'}/images/generations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: safePrompt,
          n: 1,
          size,
          response_format: 'b64_json'
        })
      }
    );

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      throw new Error(`OpenAI error ${openaiRes.status}: ${errorText}`);
    }

    const data = (await openaiRes.json()) as OpenAIImageResponse;
    const base64 = data?.data?.[0]?.b64_json;

    if (!base64 || typeof base64 !== 'string') {
      throw new Error('OpenAI no devolvió imagen base64');
    }

    return `data:image/png;base64,${base64}`;
  }

  // Google Gemini → Imagen API (fallback por ahora)
  if (provider.includes('Google Gemini')) {
    throw new Error('Gemini Image API no disponible aún');
  }

  // Custom API
  if (provider.includes('Custom API') && baseUrl) {
    const customRes = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: safePrompt,
        n: 1,
        size,
        response_format: 'b64_json'
      })
    });

    if (!customRes.ok) {
      const errorText = await customRes.text();
      throw new Error(`Custom API error ${customRes.status}: ${errorText}`);
    }

    const data = (await customRes.json()) as OpenAIImageResponse;
    const base64 = data?.data?.[0]?.b64_json;

    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Custom API no devolvió imagen base64');
    }

    return `data:image/png;base64,${base64}`;
  }

  throw new Error(`Proveedor no soportado para imágenes: ${provider}`);
};

const tryProvidersForImage = async (
  models: AIModel[],
  prompt: string,
  size: '1024x1024'
): Promise<FallbackResult<string>> => {
  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const attemptNumber = i + 1;

    console.log(`[fallback] Intentando proveedor ${attemptNumber}/${models.length}: ${model.provider}`);

    try {
      const image = await tryCallProviderForImage(model, prompt, size);
      
      console.log(`[fallback] Éxito con proveedor: ${model.provider} (intento ${attemptNumber} de ${models.length})`);
      
      return {
        data: image,
        provider: model.provider,
        attemptCount: attemptNumber
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      lastError = error instanceof Error ? error : new Error(message);

      // Groq nunca se reintenta
      if (model.provider.includes('Groq')) {
        console.warn(`[fallback] ${model.provider} saltado (no soporta imágenes)`);
        continue;
      }

      if (isRetryableError(message)) {
        console.warn(`[fallback] ${model.provider} falló (${message.split(':')[0]}), intentando siguiente...`);
        continue;
      } else {
        console.error(`[fallback] ${model.provider} falló con error no retryable: ${message}`);
        throw lastError;
      }
    }
  }

  console.error('[fallback] Todos los proveedores fallaron');
  throw lastError || new Error('Todos los proveedores fallaron');
};

// ============================================================
// MAIN HANDLER
// ============================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateImageResponse>> {
  let body: GenerateImageRequestBody;

  try {
    body = (await request.json()) as GenerateImageRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Cuerpo de solicitud inválido' },
      { status: 400 }
    );
  }

  const { prompt, size = '1024x1024' } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'El prompt es requerido' },
      { status: 400 }
    );
  }

  // Obtener TODOS los modelos activos ordenados por prioridad
  const models = await getActiveImageModels();

  if (models.length === 0) {
    console.warn('[generate-image] No hay modelos activos, usando fallback SVG');
    const svgPlaceholder = generateFoodPlaceholderSVG(prompt);
    const fallbackImage = svgToBase64DataUri(svgPlaceholder);
    return NextResponse.json({
      success: true,
      image: fallbackImage,
      fallback: true,
      provider: 'none',
      attempts: 0
    });
  }

  try {
    // Intentar con todos los proveedores en orden de prioridad
    const result = await tryProvidersForImage(models, prompt, size);

    return NextResponse.json({
      success: true,
      image: result.data,
      provider: result.provider,
      attempts: result.attemptCount
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[generate-image] Error después de fallback:', message);
    
    // Si todos los proveedores fallan, usar fallback SVG local
    console.warn('[generate-image] Usando fallback SVG local después de agotar proveedores');
    const svgPlaceholder = generateFoodPlaceholderSVG(prompt);
    const fallbackImage = svgToBase64DataUri(svgPlaceholder);
    
    return NextResponse.json({
      success: true,
      image: fallbackImage,
      fallback: true,
      provider: 'fallback',
      attempts: models.length + 1
    });
  }
}
