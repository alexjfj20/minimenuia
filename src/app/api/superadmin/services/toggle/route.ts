import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    // Obtener estado actual
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('services')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      console.error('[Services API] Error fetching service:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Cambiar estado
    const newStatus = current.status === 'active' ? 'inactive' : 'active';

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('services')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Services API] Error updating service:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Servicio ${newStatus === 'active' ? 'activado' : 'desactivado'}`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Services API] Error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
