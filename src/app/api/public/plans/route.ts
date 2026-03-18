import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  period: string;
  features: string;
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
  order: number;
  icon: string;
  color: string;
  maxUsers: number;
  maxProducts: number;
  maxCategories: number;
  hotmartUrl: string | null;
}

interface PlansResponse {
  success: boolean;
  data?: Plan[];
  error?: string;
}

// ============================================================================
// GET - Obtener todos los planes públicos activos
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<PlansResponse>> {
  try {
    console.log('[Plans API] Fetching active public plans...');

    // 1. Obtener planes activos y públicos de Supabase
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('isActive', true)
      .eq('isPublic', true)
      .order('order', { ascending: true });

    if (plansError) {
      console.error('[Plans API] Error fetching plans:', plansError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener los planes: ' + plansError.message 
      }, { status: 500 });
    }

    // 2. Obtener configuración global de Hotmart como fallback
    const { data: paymentData } = await supabaseAdmin
      .from('payment_gateway')
      .select('hotmart_url_gratis, hotmart_url_basico, hotmart_url_profesional, hotmart_url_empresarial')
      .single();

    const globalHotmartUrls: Record<string, string | null> = {
      'gratis': paymentData?.hotmart_url_gratis || null,
      'basico': paymentData?.hotmart_url_basico || null,
      'profesional': paymentData?.hotmart_url_profesional || null,
      'empresarial': paymentData?.hotmart_url_empresarial || null
    };

    console.log(`[Plans API] Found ${plans?.length || 0} active plans`);

    // 3. Transformar los planes para el frontend, aplicando fallback de Hotmart
    const transformedPlans = (plans || []).map(plan => {
      // Intentar obtener el link específico del plan, si no, usar el global basado en slug
      const hotmartUrl = plan.hotmart_url || globalHotmartUrls[plan.slug.toLowerCase()] || null;

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        period: plan.period,
        features: plan.features || '',
        isActive: plan.isActive,
        isPublic: plan.isPublic,
        isPopular: plan.isPopular,
        order: plan.order,
        icon: plan.icon,
        color: plan.color,
        maxUsers: plan.maxUsers,
        maxProducts: plan.maxProducts,
        maxCategories: plan.maxCategories,
        hotmartUrl: hotmartUrl
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedPlans
    });

  } catch (error) {
    console.error('[Plans API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
