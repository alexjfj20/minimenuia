import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { name, description, type, icon } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }

    const { data: moduleItem, error } = await supabaseAdmin
      .from('modules')
      .insert({
        name,
        description: description || null,
        type: type || 'addon',
        icon: icon || 'zap',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Modules API] Error creating module:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear módulo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: moduleItem,
      message: 'Módulo creado exitosamente'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Modules API] Error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
