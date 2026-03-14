import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Mensaje requerido'
      }, { status: 400 });
    }

    // ORDEN ESTRICTO DE FUENTES DE INFORMACIÓN:
    // 1) Configuración del Chatbot y Motor de IA
    // 2) Fuentes de Conocimiento
    // 3) Librería de Contenido
    // 4) LA IA (Gemini)

    // PASO 1: Obtener configuración del Chatbot
    const { data: config, error: configError } = await supabaseAdmin
      .from('ai_config')
      .select('*')
      .maybeSingle();

    if (configError || !config) {
      console.error('[AI Chat] Error loading config:', configError);
      return NextResponse.json({
        success: false,
        error: 'Configuración de IA no disponible'
      }, { status: 500 });
    }

    // PASO 2: Buscar en Fuentes de Conocimiento (FAQs)
    const keywords = message.toLowerCase().split(' ').filter(w => w.length > 3);
    
    if (keywords.length > 0) {
      const { data: faqs } = await supabaseAdmin
        .from('chatbot_faqs')
        .select('*')
        .eq('enabled', true)
        .order('usage_count', { ascending: false })
        .limit(3);

      if (faqs && faqs.length > 0) {
        // Buscar coincidencia con keywords
        const matchedFaq = faqs.find(faq => 
          faq.keywords?.some((keyword: string) => 
            message.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (matchedFaq) {
          // Incrementar contador de uso
          await supabaseAdmin
            .from('chatbot_faqs')
            .update({ usage_count: (matchedFaq.usage_count || 0) + 1 })
            .eq('id', matchedFaq.id);

          console.log('[AI Chat] Response from FAQ:', matchedFaq.question);
          
          return NextResponse.json({
            success: true,
            data: { 
              response: matchedFaq.answer,
              source: 'faq'
            }
          });
        }
      }
    }

    // PASO 3: Buscar en Librería de Contenido
    const { data: libraryItems } = await supabaseAdmin
      .from('library_items')
      .select('*')
      .eq('enabled', true)
      .limit(5);

    let libraryContext = '';
    if (libraryItems && libraryItems.length > 0) {
      const matchedItems = libraryItems.filter(item =>
        item.keywords?.some((keyword: string) =>
          message.toLowerCase().includes(keyword.toLowerCase())
        ) ||
        item.description?.toLowerCase().includes(message.toLowerCase())
      );

      if (matchedItems.length > 0) {
        libraryContext = '\n\nInformación de la librería:\n' + 
          matchedItems.map(item => `- ${item.name}: ${item.description}`).join('\n');
      }
    }

    // PASO 4: Usar IA (Gemini) si no se encontró en fuentes locales
    const activeModel = config.models?.find((m: any) => m.active);

    if (!activeModel || activeModel.provider !== 'Google Gemini') {
      return NextResponse.json({
        success: false,
        error: 'Proveedor de IA no configurado. Por favor configura Gemini en el panel.'
      }, { status: 500 });
    }

    const apiKey = activeModel.apiKey;
    const modelName = activeModel.model || 'gemini-pro';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key de Gemini no configurada'
      }, { status: 500 });
    }

    // Construir prompt con contexto
    const systemPrompt = config.systemPrompt || 'Eres un asistente virtual de MINIMENU.';
    
    const fullPrompt = `${systemPrompt}

${libraryContext ? libraryContext : ''}

Instrucciones:
- Responde de manera clara y concisa
- Usa formato markdown para negritas (**texto**) y listas
- Sé amable y profesional
- Si no sabes la respuesta, di que no estás seguro

Pregunta del usuario: ${message}`;

    // Llamar a API de Google Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxTokens || 1000,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('[AI Chat] Gemini API error:', errorData);
      throw new Error(errorData.error?.message || 'Error en API de Gemini');
    }

    const geminiData = await geminiResponse.json();
    
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                       'Lo siento, no pude generar una respuesta en este momento.';

    console.log('[AI Chat] Response from Gemini AI');

    return NextResponse.json({
      success: true,
      data: { 
        response: aiResponse,
        source: 'ai',
        model: modelName
      }
    });

  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
