import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { InvoiceSettingsType } from '@/types/invoice';

// =============================================
// MINIMENU - Invoice Settings API
// =============================================

/**
 * GET - Obtener la configuración de factura para un negocio
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('invoice_settings_business')
      .select('settings')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      console.error('[Invoice Settings API] Error fetching settings:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.settings || null
    });
  } catch (error) {
    console.error('[Invoice Settings API] Unexpected error in GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Guardar o actualizar la configuración de factura
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, settings } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'settings es requerido' },
        { status: 400 }
      );
    }

    // Upsert logic using businessId (unique constraint in DB)
    const { error } = await supabaseAdmin
      .from('invoice_settings_business')
      .upsert({
        business_id: businessId,
        settings: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'business_id' });

    if (error) {
      console.error('[Invoice Settings API] Error saving settings:', error);
      return NextResponse.json(
        { success: false, error: 'Error al guardar configuración: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente'
    });
  } catch (error) {
    console.error('[Invoice Settings API] Unexpected error in POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
