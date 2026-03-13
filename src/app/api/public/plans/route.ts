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

    // Obtener planes activos y públicos de Supabase
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('isActive', true)
      .eq('isPublic', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('[Plans API] Error fetching plans:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener los planes: ' + error.message 
      }, { status: 500 });
    }

    console.log(`[Plans API] Found ${plans?.length || 0} active plans`);

    // Transformar los planes para el frontend
    const transformedPlans = (plans || []).map(plan => ({
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
      maxCategories: plan.maxCategories
    }));

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
