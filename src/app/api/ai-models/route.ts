import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ============================================================
// INTERFACES
// ============================================================

interface AIModelBody {
  provider: string;
  name: string;
  model: string;
  api_key: string;
  base_url?: string | null;
  auth_type?: string;
  use_case?: string;
  active?: boolean;
}

interface AIModelResponse {
  id: string;
  provider: string;
  name: string;
  model: string;
  active: boolean;
  api_key: string;
  base_url: string | null;
  auth_type: string;
  use_case: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// GET - Obtener todos los modelos
// ============================================================

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .select('id, provider, name, model, active, api_key, base_url, auth_type, use_case, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AI Models API] Error fetching:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[AI Models API] Error inesperado:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Crear nuevo modelo
// ============================================================

export async function POST(request: NextRequest) {
  let body: AIModelBody;

  try {
    body = (await request.json()) as AIModelBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Cuerpo de solicitud inválido' },
      { status: 400 }
    );
  }

  console.log('[AI Models API] POST - Datos recibidos:', {
    provider: body.provider,
    name: body.name,
    model: body.model,
    api_key_length: body.api_key?.length || 0,
    api_key_preview: body.api_key ? `${body.api_key.substring(0, 10)}...` : 'SIN API KEY',
    use_case: body.use_case,
    active: body.active
  });

  // Validaciones básicas
  if (!body.provider || !body.name || !body.model || !body.api_key) {
    return NextResponse.json(
      { success: false, error: 'Proveedor, nombre, modelo y API Key son requeridos' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .insert({
        provider: body.provider,
        name: body.name,
        model: body.model,
        api_key: body.api_key,
        base_url: body.base_url ?? null,
        auth_type: body.auth_type ?? 'bearer',
        use_case: body.use_case ?? 'both',
        active: body.active ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[AI Models API] Error creating:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('[AI Models API] Modelo creado exitosamente:', {
      id: data.id,
      provider: data.provider,
      api_key_stored: data.api_key ? `${data.api_key.substring(0, 10)}...` : 'SIN API KEY'
    });

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Modelo creado exitosamente'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[AI Models API] Error inesperado:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Actualizar modelo existente
// ============================================================

export async function PUT(request: NextRequest) {
  let body: AIModelBody & { id: string };

  try {
    body = (await request.json()) as AIModelBody & { id: string };
  } catch {
    return NextResponse.json(
      { success: false, error: 'Cuerpo de solicitud inválido' },
      { status: 400 }
    );
  }

  console.log('[AI Models API] PUT - Datos recibidos:', {
    id: body.id,
    provider: body.provider,
    api_key_preview: body.api_key ? `${body.api_key.substring(0, 10)}...` : 'SIN API KEY'
  });

  if (!body.id) {
    return NextResponse.json(
      { success: false, error: 'ID requerido' },
      { status: 400 }
    );
  }

  try {
    const updateData: Record<string, unknown> = {
      provider: body.provider,
      name: body.name,
      model: body.model,
      api_key: body.api_key,
      base_url: body.base_url ?? null,
      auth_type: body.auth_type ?? 'bearer',
      use_case: body.use_case ?? 'both',
      active: body.active ?? false,
      updated_at: new Date().toISOString()
    };

    console.log('[AI Models API] Actualizando modelo:', body.id);

    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[AI Models API] Error updating:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('[AI Models API] Modelo actualizado exitosamente:', {
      id: data.id,
      api_key_stored: data.api_key ? `${data.api_key.substring(0, 10)}...` : 'SIN API KEY'
    });

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Modelo actualizado exitosamente'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[AI Models API] Error inesperado:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Eliminar modelo
// ============================================================

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID requerido' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabaseAdmin
      .from('ai_models')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[AI Models API] Error deleting:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Modelo eliminado exitosamente'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[AI Models API] Error inesperado:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
