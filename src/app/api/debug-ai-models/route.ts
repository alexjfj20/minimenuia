import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Ver TODOS los modelos
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mostrar solo info relevante (NUNCA mostrar API Key completa)
    const sanitized = data?.map(m => ({
      id: m.id,
      provider: m.provider,
      model: m.model,
      active: m.active,
      use_case: m.use_case,
      api_key_length: m.api_key?.length || 0,
      api_key_start: m.api_key ? m.api_key.substring(0, 10) : 'SIN KEY',
      api_key_end: m.api_key ? m.api_key.substring(m.api_key.length - 5) : 'SIN KEY',
      created_at: m.created_at,
      updated_at: m.updated_at
    }));

    return NextResponse.json({
      success: true,
      count: sanitized?.length || 0,
      models: sanitized
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
