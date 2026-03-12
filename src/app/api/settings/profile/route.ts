// ============================================================================
// Settings Profile API - v4.0 (Aislamiento SaaS Total - DB + Store Aislado)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getBusinessProfileAsync,
  updateBusinessProfileAsync,
  type BusinessProfile
} from '@/lib/business-store';

// ============================================================================
// INTERFACES
// ============================================================================

interface ProfileResponse {
  success: boolean;
  data?: BusinessProfile;
  error?: string;
}

interface UpdateProfileRequest {
  businessId: string;
  name?: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string | null;
  iva?: number;
  empaque?: number;
  valorEmpaqueUnitario?: number;
  domicilio?: number;
  impoconsumo?: number;
  avatar?: string | null;
  banner?: string | null;
  bannerEnabled?: boolean;
  heroImageUrl?: string | null;
  showHeroBanner?: boolean;
  favicon?: string | null;
  tipEnabled?: boolean;
  tipPercentageDefault?: number;
  tipOnlyOnPremise?: boolean;
  paymentMethods?: any[];
}

// ============================================================================
// GET - Obtener perfil del negocio autenticado
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    console.log('[Settings Profile API] GET request for businessId:', businessId);
    console.log('[Settings Profile API] Supabase configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId es requerido' }, { status: 400 });
    }

    // 1. Get core data from Supabase
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) {
      console.error('[Settings Profile API] Business query error:', businessError);
      return NextResponse.json({ success: false, error: 'Error al obtener el perfil: ' + businessError.message }, { status: 500 });
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
    }

    // 2. Get advanced data from isolated store
    const advancedProfile = await getBusinessProfileAsync(businessId);

    // 3. Merge data
    const finalProfile: BusinessProfile = {
      ...advancedProfile,
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone || advancedProfile.phone,
      address: business.address || advancedProfile.address,
      primaryColor: business.primaryColor || advancedProfile.primaryColor,
      secondaryColor: business.secondaryColor || advancedProfile.secondaryColor,
      logo: business.logo || advancedProfile.logo,
    };

    return NextResponse.json({
      success: true,
      data: finalProfile
    });

  } catch (error) {
    console.error('[Settings Profile API] Error reading profile:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener el perfil' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Actualizar perfil del negocio
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const body: UpdateProfileRequest = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId es requerido' }, { status: 400 });
    }

    console.log('[Settings Profile API] PUT request for business:', businessId);

    // 1. Update core fields in Supabase if provided
    const dbUpdate = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
      ...(body.secondaryColor !== undefined && { secondaryColor: body.secondaryColor }),
      ...(body.logo !== undefined && { logo: body.logo }),
    };

    if (Object.keys(dbUpdate).length > 0) {
      await supabaseAdmin
        .from('businesses')
        .update(dbUpdate)
        .eq('id', businessId);
    }

    // 2. Update all fields in isolated store
    const updatedProfile = await updateBusinessProfileAsync(businessId, body);

    console.log('[Settings Profile API] Profile updated successfully for:', businessId);

    return NextResponse.json({
      success: true,
      data: updatedProfile
    });

  } catch (error) {
    console.error('[Settings Profile API] Error updating profile:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
