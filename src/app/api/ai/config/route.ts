import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { data: config, error } = await supabaseAdmin
      .from('ai_config')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[AI Config API] Error fetching config:', error);
      // Return default enabled config if table doesn't exist
      return NextResponse.json({ 
        success: true,
        data: { 
          enabled: true,
          systemPrompt: 'Eres un asistente virtual de MINIMENU.',
          models: [],
          temperature: 0.7,
          maxTokens: 1000,
          knowledgeSources: [],
          activeModelId: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: config || { 
        enabled: true,
        systemPrompt: 'Eres un asistente virtual de MINIMENU.',
        models: [],
        temperature: 0.7,
        maxTokens: 1000,
        knowledgeSources: [],
        activeModelId: null
      }
    });
  } catch (error: any) {
    console.error('[AI Config API] Error:', error);
    // Return default enabled config on error
    return NextResponse.json({ 
      success: true, 
      data: { 
        enabled: true,
        systemPrompt: 'Eres un asistente virtual de MINIMENU.',
        models: [],
        temperature: 0.7,
        maxTokens: 1000,
        knowledgeSources: [],
        activeModelId: null
      }
    }, { status: 200 });
  }
}
