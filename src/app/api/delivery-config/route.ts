import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface DeliveryConfig {
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
  deliveryEnabled: boolean;
  deliveryRadius: number | null;
}

interface DeliveryConfigResponse {
  success: boolean;
  data?: DeliveryConfig;
  error?: string;
}

interface UpdateDeliveryConfigRequest {
  businessId: string;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedTime?: string;
  deliveryEnabled?: boolean;
  deliveryRadius?: number | null;
}

// ============================================================================
// GET - Obtener configuración de domicilio
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<DeliveryConfigResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ 
        success: false, 
        error: 'businessId es requerido' 
      }, { status: 400 });
    }

    // Obtener configuración de Supabase
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('deliveryFee, minimumOrder, estimatedTime, deliveryEnabled, deliveryRadius')
      .eq('id', businessId)
      .maybeSingle();

    if (error) {
      console.error('[Delivery Config API] Error fetching config:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener la configuración: ' + error.message 
      }, { status: 500 });
    }

    if (!business) {
      return NextResponse.json({ 
        success: false, 
        error: 'Negocio no encontrado' 
      }, { status: 404 });
    }

    const config: DeliveryConfig = {
      deliveryFee: business.deliveryFee ?? 3000,
      minimumOrder: business.minimumOrder ?? 0,
      estimatedTime: business.estimatedTime || '30-45 min',
      deliveryEnabled: business.deliveryEnabled ?? true,
      deliveryRadius: business.deliveryRadius ?? null
    };

    console.log('[Delivery Config API] Config loaded for business:', businessId);

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('[Delivery Config API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al obtener la configuración' 
    }, { status: 500 });
  }
}

// ============================================================================
// PUT - Actualizar configuración de domicilio
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<DeliveryConfigResponse>> {
  try {
    const body: UpdateDeliveryConfigRequest = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ 
        success: false, 
        error: 'businessId es requerido' 
      }, { status: 400 });
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: any = {};

    if (body.deliveryFee !== undefined) updateData.deliveryFee = body.deliveryFee;
    if (body.minimumOrder !== undefined) updateData.minimumOrder = body.minimumOrder;
    if (body.estimatedTime !== undefined) updateData.estimatedTime = body.estimatedTime;
    if (body.deliveryEnabled !== undefined) updateData.deliveryEnabled = body.deliveryEnabled;
    if (body.deliveryRadius !== undefined) updateData.deliveryRadius = body.deliveryRadius;

    console.log('[Delivery Config API] Updating fields:', Object.keys(updateData));

    // Actualizar en Supabase
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', businessId);

    if (updateError) {
      console.error('[Delivery Config API] Update error:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al actualizar: ' + updateError.message 
      }, { status: 500 });
    }

    // Obtener configuración actualizada
    const { data: updatedBusiness } = await supabaseAdmin
      .from('businesses')
      .select('deliveryFee, minimumOrder, estimatedTime, deliveryEnabled, deliveryRadius')
      .eq('id', businessId)
      .maybeSingle();

    if (!updatedBusiness) {
      return NextResponse.json({ 
        success: false, 
        error: 'Negocio no encontrado después de actualizar' 
      }, { status: 404 });
    }

    const config: DeliveryConfig = {
      deliveryFee: updatedBusiness.deliveryFee ?? 3000,
      minimumOrder: updatedBusiness.minimumOrder ?? 0,
      estimatedTime: updatedBusiness.estimatedTime || '30-45 min',
      deliveryEnabled: updatedBusiness.deliveryEnabled ?? true,
      deliveryRadius: updatedBusiness.deliveryRadius ?? null
    };

    console.log('[Delivery Config API] Config updated successfully');

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('[Delivery Config API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al actualizar la configuración' 
    }, { status: 500 });
  }
}
