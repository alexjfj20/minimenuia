import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPPORTED_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440'
] as const;

type ImageSize = typeof SUPPORTED_SIZES[number];

// ============================================================================
// INTERFACES
// ============================================================================

interface GenerateImageRequest {
  prompt: string;
  size?: ImageSize;
}

interface GenerateImageResponse {
  success: boolean;
  image?: string;
  error?: string;
  attempts?: number;
}

interface ZAIImageResponse {
  data?: Array<{
    base64?: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildProductImagePrompt(productName: string, description: string): string {
  const components: string[] = [
    `Professional food photography of ${productName}`,
    description ? description : '',
    'appetizing presentation',
    'restaurant quality',
    'clean white plate or serving dish',
    'soft natural lighting',
    'shallow depth of field',
    'high quality',
    'detailed',
    '4k resolution'
  ];

  return components.filter(Boolean).join(', ');
}

function isErrorRetryable(errorMessage: string): boolean {
  const retryablePatterns = [
    'timeout',
    'Timeout',
    'UND_ERR_CONNECT_TIMEOUT',
    'fetch failed',
    'network',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT'
  ];
  
  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number
): Promise<{ result: T; attempts: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const shouldRetry = isErrorRetryable(lastError.message);
      
      if (!shouldRetry || attempt >= maxRetries) {
        throw lastError;
      }
      
      console.log(`[Generate Image] Attempt ${attempt}/${maxRetries} failed, retrying in ${baseDelayMs * attempt}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * attempt));
    }
  }
  
  throw lastError ?? new Error('Unknown error after retries');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<GenerateImageResponse>> {
  const requestId = `req_${Date.now()}`;
  
  try {
    // Parse request body
    let body: GenerateImageRequest;
    try {
      body = await request.json();
    } catch {
      console.error(`[${requestId}] Invalid JSON in request body`);
      return NextResponse.json({
        success: false,
        error: 'Invalid request body'
      }, { status: 400 });
    }
    
    const { prompt, size = '1024x1024' } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El prompt es requerido'
      }, { status: 400 });
    }

    // Validate size
    if (!SUPPORTED_SIZES.includes(size)) {
      return NextResponse.json({
        success: false,
        error: `Tamaño inválido. Tamaños soportados: ${SUPPORTED_SIZES.join(', ')}`
      }, { status: 400 });
    }

    console.log(`[${requestId}] Starting image generation`);
    console.log(`[${requestId}] Prompt: ${prompt.substring(0, 80)}...`);
    console.log(`[${requestId}] Size: ${size}`);

    // Initialize ZAI SDK
    let zai: Awaited<ReturnType<typeof ZAI.create>>;
    try {
      zai = await ZAI.create();
    } catch (initError) {
      console.error(`[${requestId}] Failed to initialize SDK:`, initError);
      return NextResponse.json({
        success: false,
        error: 'No se pudo inicializar el servicio de generación de imágenes'
      }, { status: 503 });
    }

    // Generate image with retry logic
    let response: ZAIImageResponse;
    let attempts: number;
    
    try {
      const retryResult = await retryWithBackoff(
        async () => {
          return await zai.images.generations.create({
            prompt: prompt,
            size: size
          });
        },
        3,
        3000
      );
      response = retryResult.result;
      attempts = retryResult.attempts;
    } catch (generationError) {
      const errorMsg = generationError instanceof Error 
        ? generationError.message 
        : String(generationError);
      
      console.error(`[${requestId}] Image generation failed after retries:`, errorMsg);
      
      // Determine user-friendly error message
      let userMessage = 'Error al generar la imagen';
      
      if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
        userMessage = 'El servicio está tardando demasiado. Por favor intenta más tarde.';
      } else if (errorMsg.includes('fetch failed') || errorMsg.includes('network')) {
        userMessage = 'No se puede conectar al servicio. Verifica tu conexión.';
      } else if (errorMsg.includes('502') || errorMsg.includes('503') || errorMsg.includes('504')) {
        userMessage = 'El servidor de imágenes está temporalmente no disponible. Intenta en unos momentos.';
      }
      
      return NextResponse.json({
        success: false,
        error: userMessage
      }, { status: 503 });
    }

    // Validate response structure
    if (!response?.data?.[0]?.base64) {
      console.error(`[${requestId}] Invalid response structure`);
      return NextResponse.json({
        success: false,
        error: 'Respuesta inválida del servicio de generación'
      }, { status: 500 });
    }

    const imageBase64 = response.data[0].base64;
    const dataUri = `data:image/png;base64,${imageBase64}`;

    console.log(`[${requestId}] Image generated successfully`);
    console.log(`[${requestId}] Base64 length: ${imageBase64.length}`);
    console.log(`[${requestId}] Attempts: ${attempts}`);

    return NextResponse.json({
      success: true,
      image: dataUri,
      attempts: attempts
    });

  } catch (unexpectedError) {
    console.error(`[${requestId}] Unexpected error:`, unexpectedError);
    
    return NextResponse.json({
      success: false,
      error: 'Error inesperado. Por favor intenta de nuevo.'
    }, { status: 500 });
  }
}

export { buildProductImagePrompt };
