import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const dynamic = 'force-dynamic';

interface GenerateProductRequest {
  prompt: string;
  type: 'text' | 'voice';
}

interface GenerateProductResponse {
  success: boolean;
  product?: {
    name: string;
    description: string;
    price: number;
    category: string;
    suggestedImage: string;
  };
  error?: string;
}

const SYSTEM_PROMPT = `Eres un asistente especializado en crear productos para menús de restaurantes colombianos.
Tu tarea es generar información estructurada de productos basándote en la descripción del usuario.

Reglas importantes:
1. El nombre debe ser corto, atractivo y profesional (máximo 5 palabras)
2. La descripción debe ser apetitosa y realista (2-3 oraciones)
3. El precio debe ser razonable para Colombia (en COP, entre 5,000 y 100,000)
4. La categoría debe ser una de: Entradas, Platos Principales, Bebidas, Postres, Acompañamientos, Especiales

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "name": "Nombre del producto",
  "description": "Descripción apetitosa del producto",
  "price": 25000,
  "category": "Platos Principales",
  "suggestedImage": "breve descripción de la imagen para generar"
}

No agregues texto adicional, solo el JSON.`;

export async function POST(request: NextRequest): Promise<NextResponse<GenerateProductResponse>> {
  const requestId = `req_${Date.now()}`;
  
  try {
    const body: GenerateProductRequest = await request.json();
    const { prompt, type } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'La descripción es requerida'
      }, { status: 400 });
    }

    console.log(`[${requestId}] Starting product generation from ${type}`);
    console.log(`[${requestId}] Prompt: ${prompt.substring(0, 100)}...`);

    // Initialize ZAI SDK
    let zai: Awaited<ReturnType<typeof ZAI.create>>;
    try {
      zai = await ZAI.create();
    } catch (initError) {
      console.error(`[${requestId}] Failed to initialize SDK:`, initError);
      return NextResponse.json({
        success: false,
        error: 'No se pudo inicializar el servicio de IA'
      }, { status: 503 });
    }

    // Generate product with LLM
    let response: { choices?: Array<{ message?: { content?: string } }> };
    
    try {
      response = await zai.llm.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: 'glm-4-flash',
        temperature: 0.7,
        max_tokens: 500
      });
    } catch (llmError) {
      console.error(`[${requestId}] LLM error:`, llmError);
      return NextResponse.json({
        success: false,
        error: 'Error al procesar con IA. Por favor intenta de nuevo.'
      }, { status: 503 });
    }

    // Parse LLM response
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error(`[${requestId}] Empty response from LLM`);
      return NextResponse.json({
        success: false,
        error: 'No se pudo generar el producto. Intenta con otra descripción.'
      }, { status: 500 });
    }

    console.log(`[${requestId}] LLM Response: ${content.substring(0, 200)}...`);

    // Extract JSON from response
    let productData: {
      name: string;
      description: string;
      price: number;
      category: string;
      suggestedImage: string;
    };

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      
      // Fallback: Create product from the prompt directly
      const words = prompt.split(' ').filter((w: string) => w.length > 3).slice(0, 4);
      const generatedName = words.length > 0 
        ? words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : 'Nuevo Producto';

      // Extract price if mentioned
      const priceMatch = prompt.match(/(\d+)\s*(mil|pesos|cop)?/i);
      const extractedPrice = priceMatch ? parseInt(priceMatch[1]) * 1000 : 25000;

      // Determine category
      let category = 'Platos Principales';
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes('bebida') || lowerPrompt.includes('jugo') || lowerPrompt.includes('gaseosa')) {
        category = 'Bebidas';
      } else if (lowerPrompt.includes('postre') || lowerPrompt.includes('dulce')) {
        category = 'Postres';
      } else if (lowerPrompt.includes('entrada') || lowerPrompt.includes('aperitivo')) {
        category = 'Entradas';
      }

      productData = {
        name: generatedName,
        description: prompt,
        price: extractedPrice,
        category: category,
        suggestedImage: prompt
      };
    }

    // Validate product data
    if (!productData.name || !productData.price) {
      return NextResponse.json({
        success: false,
        error: 'Los datos del producto son inválidos'
      }, { status: 500 });
    }

    console.log(`[${requestId}] Product generated: ${productData.name} - $${productData.price}`);

    return NextResponse.json({
      success: true,
      product: {
        name: productData.name,
        description: productData.description || prompt,
        price: productData.price,
        category: productData.category || 'Platos Principales',
        suggestedImage: productData.suggestedImage || productData.name
      }
    });

  } catch (unexpectedError) {
    console.error('[Generate Product] Unexpected error:', unexpectedError);
    
    return NextResponse.json({
      success: false,
      error: 'Error inesperado. Por favor intenta de nuevo.'
    }, { status: 500 });
  }
}
