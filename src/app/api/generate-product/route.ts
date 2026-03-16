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

interface AIProductData {
  name: string;
  description: string;
  price: number;
  category: 'Platos Principales' | 'Entradas' | 'Postres' | 'Bebidas';
}

interface GenerateProductRequestBody {
  prompt: string;
}

interface GenerateProductSuccessResponse {
  success: true;
  product: AIProductData;
  provider?: string;
  attempts?: number;
}

interface GenerateProductErrorResponse {
  success: false;
  error: string;
}

type GenerateProductResponse =
  | GenerateProductSuccessResponse
  | GenerateProductErrorResponse;

interface FallbackResult<T> {
  data: T;
  provider: string;
  attemptCount: number;
}

// ============================================================
// HELPER — Obtener TODOS los modelos activos para texto
// ============================================================

const getActiveTextModels = async (): Promise<AIModel[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .select('id, provider, model, api_key, base_url, auth_type, use_case, priority')
      .eq('active', true)
      .in('use_case', ['text', 'both'])
      .order('priority', { ascending: true });

    if (error) {
      console.error('[generate-product] Error obteniendo modelos activos:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[generate-product] No hay modelos activos para texto');
      return [];
    }

    console.log('[generate-product] Modelos activos encontrados:', data.length);

    return data as AIModel[];
  } catch (error) {
    console.error('[generate-product] Error inesperado obteniendo modelos:', error);
    return [];
  }
};

// ============================================================
// HELPER — Generar producto fallback
// ============================================================

const generateFallbackProduct = (
  userPrompt: string
): AIProductData => {
  const lowerPrompt = userPrompt.toLowerCase();
  let category: AIProductData['category'] = 'Platos Principales';
  
  if (lowerPrompt.includes('bebida') || lowerPrompt.includes('jugo') || lowerPrompt.includes('gaseosa') || lowerPrompt.includes('limonada') || lowerPrompt.includes('café') || lowerPrompt.includes('té')) {
    category = 'Bebidas';
  } else if (lowerPrompt.includes('postre') || lowerPrompt.includes('dulce') || lowerPrompt.includes('torta') || lowerPrompt.includes('pastel') || lowerPrompt.includes('helado') || lowerPrompt.includes('flan')) {
    category = 'Postres';
  } else if (lowerPrompt.includes('entrada') || lowerPrompt.includes('aperitivo') || lowerPrompt.includes('empanada') || lowerPrompt.includes('arepa') || lowerPrompt.includes('tequeño')) {
    category = 'Entradas';
  }

  const priceMatch = userPrompt.match(/(\d+)\s*(mil|pesos|cop)?/i);
  const extractedPrice = priceMatch ? parseInt(priceMatch[1]) * (priceMatch[2]?.toLowerCase() === 'mil' ? 1000 : 1) : 25000;

  const words = userPrompt.split(' ').filter(w => w.length > 3).slice(0, 4);
  const generatedName = words.length > 0
    ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : 'Nuevo Producto';

  return {
    name: generatedName,
    description: `Delicioso ${generatedName.toLowerCase()} preparado con ingredientes frescos y de alta calidad.`,
    price: extractedPrice,
    category: category
  };
};

// ============================================================
// HELPER — Llamar a API de Google Gemini
// ============================================================

const callGeminiAPI = async (
  apiKey: string,
  model: string,
  prompt: string
): Promise<AIProductData> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Crea un producto de menú para restaurante colombiano basado en: "${prompt}".
Responde SOLO con JSON válido sin markdown:
{
  "name": "nombre del plato",
  "description": "descripción atractiva en 1 oración",
  "price": 25000,
  "category": "Platos Principales"
}
Categorías válidas: "Platos Principales", "Entradas", "Postres", "Bebidas".
El precio debe ser un número entero en pesos colombianos.`
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }> };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini no respondió con texto');
  }

  const parsed: unknown = JSON.parse(text.trim());
  
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('name' in parsed) ||
    !('description' in parsed) ||
    !('price' in parsed) ||
    !('category' in parsed)
  ) {
    throw new Error('Estructura inválida de respuesta de Gemini');
  }

  const product = parsed as AIProductData;

  if (
    typeof product.name !== 'string' ||
    typeof product.description !== 'string' ||
    typeof product.price !== 'number' ||
    typeof product.category !== 'string'
  ) {
    throw new Error('Tipos de datos inválidos en respuesta de Gemini');
  }

  return product;
};

// ============================================================
// HELPER — Llamar a API de OpenAI GPT
// ============================================================

const callOpenAIAPI = async (
  apiKey: string,
  model: string,
  prompt: string
): Promise<AIProductData> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente para restaurantes colombianos. Responde SOLO con JSON válido, sin markdown, sin texto adicional.'
        },
        {
          role: 'user',
          content: `Crea un producto de menú basado en: "${prompt}".
Responde SOLO con este JSON exacto:
{
  "name": "nombre del plato",
  "description": "descripción atractiva en 1 oración",
  "price": 25000,
  "category": "Platos Principales"
}
Categorías válidas: "Platos Principales", "Entradas", "Postres", "Bebidas".
El precio debe ser un número entero en pesos colombianos.`
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI no respondió con contenido');
  }

  const parsed: unknown = JSON.parse(content.trim());
  
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('name' in parsed) ||
    !('description' in parsed) ||
    !('price' in parsed) ||
    !('category' in parsed)
  ) {
    throw new Error('Estructura inválida de respuesta de OpenAI');
  }

  const product = parsed as AIProductData;

  if (
    typeof product.name !== 'string' ||
    typeof product.description !== 'string' ||
    typeof product.price !== 'number' ||
    typeof product.category !== 'string'
  ) {
    throw new Error('Tipos de datos inválidos en respuesta de OpenAI');
  }

  return product;
};

// ============================================================
// HELPER — Llamar a API de Groq
// ============================================================

const callGroqAPI = async (
  apiKey: string,
  model: string,
  prompt: string
): Promise<AIProductData> => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente para restaurantes colombianos. Responde SOLO con JSON válido, sin markdown, sin texto adicional.'
        },
        {
          role: 'user',
          content: `Crea un producto de menú basado en: "${prompt}".
Responde SOLO con este JSON exacto:
{
  "name": "nombre del plato",
  "description": "descripción atractiva en 1 oración",
  "price": 25000,
  "category": "Platos Principales"
}
Categorías válidas: "Platos Principales", "Entradas", "Postres", "Bebidas".
El precio debe ser un número entero en pesos colombianos.`
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Groq no respondió con contenido');
  }

  const parsed: unknown = JSON.parse(content.trim());

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('name' in parsed) ||
    !('description' in parsed) ||
    !('price' in parsed) ||
    !('category' in parsed)
  ) {
    throw new Error('Estructura inválida de respuesta de Groq');
  }

  const product = parsed as AIProductData;

  if (
    typeof product.name !== 'string' ||
    typeof product.description !== 'string' ||
    typeof product.price !== 'number' ||
    typeof product.category !== 'string'
  ) {
    throw new Error('Tipos de datos inválidos en respuesta de Groq');
  }

  return product;
};

// ============================================================
// HELPER — Llamar a Custom API
// ============================================================

const callCustomAPI = async (
  apiKey: string,
  baseUrl: string,
  model: string,
  prompt: string
): Promise<AIProductData> => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente para restaurantes colombianos. Responde SOLO con JSON válido, sin markdown, sin texto adicional.'
        },
        {
          role: 'user',
          content: `Crea un producto de menú basado en: "${prompt}".
Responde SOLO con este JSON exacto:
{
  "name": "nombre del plato",
  "description": "descripción atractiva en 1 oración",
  "price": 25000,
  "category": "Platos Principales"
}
Categorías válidas: "Platos Principales", "Entradas", "Postres", "Bebidas".
El precio debe ser un número entero en pesos colombianos.`
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Custom API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Custom API no respondió con contenido');
  }

  const parsed: unknown = JSON.parse(content.trim());

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('name' in parsed) ||
    !('description' in parsed) ||
    !('price' in parsed) ||
    !('category' in parsed)
  ) {
    throw new Error('Estructura inválida de respuesta de Custom API');
  }

  const product = parsed as AIProductData;

  if (
    typeof product.name !== 'string' ||
    typeof product.description !== 'string' ||
    typeof product.price !== 'number' ||
    typeof product.category !== 'string'
  ) {
    throw new Error('Tipos de datos inválidos en respuesta de Custom API');
  }

  return product;
};

// ============================================================
// FALLBACK — Intentar con todos los proveedores
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

const tryCallProvider = async (
  model: AIModel,
  prompt: string
): Promise<AIProductData> => {
  const provider = model.provider;
  const apiKey = model.api_key;
  const model_name = model.model;
  const baseUrl = model.base_url;

  if (provider.includes('Google Gemini')) {
    return await callGeminiAPI(apiKey, model_name, prompt);
  } else if (provider.includes('OpenAI GPT')) {
    return await callOpenAIAPI(apiKey, model_name, prompt);
  } else if (provider.includes('Groq')) {
    return await callGroqAPI(apiKey, model_name, prompt);
  } else if (provider.includes('Custom API') && baseUrl) {
    return await callCustomAPI(apiKey, baseUrl, model_name, prompt);
  } else {
    throw new Error(`Proveedor no soportado: ${provider}`);
  }
};

const tryProvidersForText = async (
  models: AIModel[],
  prompt: string
): Promise<FallbackResult<AIProductData>> => {
  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const attemptNumber = i + 1;

    console.log(`[fallback] Intentando proveedor ${attemptNumber}/${models.length}: ${model.provider}`);

    try {
      const product = await tryCallProvider(model, prompt);
      
      console.log(`[fallback] Éxito con proveedor: ${model.provider} (intento ${attemptNumber} de ${models.length})`);
      
      return {
        data: product,
        provider: model.provider,
        attemptCount: attemptNumber
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      lastError = error instanceof Error ? error : new Error(message);

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
): Promise<NextResponse<GenerateProductResponse>> {
  let body: GenerateProductRequestBody;

  try {
    body = (await request.json()) as GenerateProductRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Cuerpo de solicitud inválido' },
      { status: 400 }
    );
  }

  const { prompt } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'El prompt es requerido' },
      { status: 400 }
    );
  }

  // Obtener TODOS los modelos activos ordenados por prioridad
  const models = await getActiveTextModels();

  if (models.length === 0) {
    console.warn('[generate-product] No hay modelos activos, usando fallback');
    const fallbackProduct = generateFallbackProduct(prompt);
    return NextResponse.json({
      success: true,
      product: fallbackProduct
    });
  }

  try {
    // Intentar con todos los proveedores en orden de prioridad
    const result = await tryProvidersForText(models, prompt);

    return NextResponse.json({
      success: true,
      product: result.data,
      provider: result.provider,
      attempts: result.attemptCount
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[generate-product] Error después de fallback:', message);
    
    // Si todos los proveedores fallan, usar fallback local
    console.warn('[generate-product] Usando fallback local después de agotar proveedores');
    const fallbackProduct = generateFallbackProduct(prompt);
    
    return NextResponse.json({
      success: true,
      product: fallbackProduct,
      provider: 'fallback',
      attempts: models.length + 1
    });
  }
}
