import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface BusinessService {
  id: string;
  business_id: string;
  service_id: string;
  status: 'active' | 'inactive' | 'suspended';
  ai_credits_used?: number;
  ai_credits_limit?: number;
  ai_credits_reset_date?: string;
  created_at: string;
  updated_at: string;
}

interface BusinessServiceResponse {
  success: boolean;
  data?: BusinessService | BusinessService[] | any;
  error?: string;
}

interface CreateBusinessServiceRequest {
  businessId: string;
  serviceId: string;
  status?: 'active' | 'inactive' | 'suspended';
  aiCreditsUsed?: number;
  aiCreditsLimit?: number;
  aiCreditsResetDate?: string;
}

// ============================================================================
// GET - Obtener servicios de un negocio o todos los vínculos
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<BusinessServiceResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const serviceId = searchParams.get('serviceId');

    console.log('[Business Services API] GET request:', { businessId, serviceId });

    let query = supabaseAdmin.from('business_services').select('*');

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[Business Services API] Error fetching:', error);
      
      // Si la tabla no existe, retornar array vacío
      if (error.message.includes('Could not find the table') || error.message.includes('relation does not exist')) {
        console.warn('[Business Services API] Tabla business_services no existe');
        return NextResponse.json({
          success: true,
          data: []
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Error al leer los servicios: ' + error.message
      }, { status: 500 });
    }

    console.log(`[Business Services API] Found ${data?.length || 0} business services`);

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('[Business Services API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al leer los servicios'
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear o actualizar vínculo negocio-servicio
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<BusinessServiceResponse>> {
  try {
    const body: CreateBusinessServiceRequest = await request.json();
    const { businessId, serviceId, status = 'active', aiCreditsUsed = 0, aiCreditsLimit, aiCreditsResetDate } = body;

    console.log('[Business Services API] POST request:', body);

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'businessId es requerido'
      }, { status: 400 });
    }

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: 'serviceId es requerido'
      }, { status: 400 });
    }

    // Verificar que el negocio existe
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, status')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) {
      console.error('[Business Services API] Error checking business:', businessError);
    }

    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Negocio no encontrado'
      }, { status: 404 });
    }

    // Verificar que el servicio existe
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id, name, status')
      .eq('id', serviceId)
      .maybeSingle();

    if (serviceError) {
      console.error('[Business Services API] Error checking service:', serviceError);
    }

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Servicio no encontrado'
      }, { status: 404 });
    }

    // Insertar o actualizar usando ON CONFLICT
    const { data, error: insertError } = await supabaseAdmin
      .from('business_services')
      .upsert({
        business_id: businessId,
        service_id: serviceId,
        status,
        ai_credits_used: aiCreditsUsed,
        ai_credits_limit: aiCreditsLimit || null,
        ai_credits_reset_date: aiCreditsResetDate || null
      }, {
        onConflict: 'business_id,service_id'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Business Services API] Error creating/updating business service:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Error al crear/actualizar el servicio: ' + insertError.message
      }, { status: 500 });
    }

    console.log('[Business Services API] Business service created/updated:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Business Services API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al crear/actualizar el servicio'
    }, { status: 500 });
  }
}

// ============================================================================
// PUT - Actualizar vínculo negocio-servicio
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<BusinessServiceResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    console.log('[Business Services API] PUT request:', { id, body });

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID es requerido'
      }, { status: 400 });
    }

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.aiCreditsUsed !== undefined) updateData.ai_credits_used = body.aiCreditsUsed;
    if (body.aiCreditsLimit !== undefined) updateData.ai_credits_limit = body.aiCreditsLimit;
    if (body.aiCreditsResetDate !== undefined) updateData.ai_credits_reset_date = body.aiCreditsResetDate;

    const { data, error: updateError } = await supabaseAdmin
      .from('business_services')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Business Services API] Error updating business service:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el servicio: ' + updateError.message
      }, { status: 500 });
    }

    console.log('[Business Services API] Business service updated:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Business Services API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el servicio'
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Eliminar vínculo negocio-servicio
// ============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse<BusinessServiceResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const businessId = searchParams.get('businessId');
    const serviceId = searchParams.get('serviceId');

    console.log('[Business Services API] DELETE request:', { id, businessId, serviceId });

    let query = supabaseAdmin.from('business_services').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (businessId && serviceId) {
      query = query.eq('business_id', businessId).eq('service_id', serviceId);
    } else {
      return NextResponse.json({
        success: false,
        error: 'ID o combinación businessId+serviceId es requerida'
      }, { status: 400 });
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error('[Business Services API] Error deleting business service:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el servicio: ' + deleteError.message
      }, { status: 500 });
    }

    console.log('[Business Services API] Business service deleted:', { id, businessId, serviceId });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('[Business Services API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar el servicio'
    }, { status: 500 });
  }
}
