import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { name, description, price, currency, billingType } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .insert({
        name,
        description: description || null,
        price: price || 0,
        currency: currency || 'COP',
        billing_type: billingType || 'monthly',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Services API] Error creating service:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Servicio creado exitosamente'
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
