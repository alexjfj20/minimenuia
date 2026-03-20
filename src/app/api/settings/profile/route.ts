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

    // Validar que businessId sea un UUID válido
    if (!businessId || businessId === 'undefined' || businessId === 'null') {
      console.error('[Settings Profile API] Invalid businessId:', businessId);
      return NextResponse.json({ 
        success: false, 
        error: 'businessId inválido o no proporcionado. Verifica que el usuario esté autenticado correctamente.' 
      }, { status: 400 });
    }

    // Validar formato de UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      console.error('[Settings Profile API] businessId no es un UUID válido:', businessId);
      return NextResponse.json({ 
        success: false, 
        error: 'businessId no tiene formato UUID válido' 
      }, { status: 400 });
    }

    // Get all data from Supabase (no file-based storage in production)
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
      console.warn('[Settings Profile API] Business not found for id:', businessId);
      return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Build profile from Supabase data only (no file-based storage)
    const finalProfile: BusinessProfile = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone || '',
      address: business.address || '',
      primaryColor: business.primaryColor || '#8b5cf6',
      secondaryColor: business.secondaryColor || '#ffffff',
      logo: business.logo || null,
      avatar: business.avatar || null,
      banner: business.banner || null,
      bannerEnabled: business.bannerEnabled ?? true,
      heroImageUrl: business.heroImageUrl || null,
      showHeroBanner: business.showHeroBanner ?? false,
      favicon: business.favicon || null,
      impoconsumo: business.impoconsumo ?? 8,
      valorEmpaqueUnitario: business.valorEmpaqueUnitario ?? 0,
      tipEnabled: business.tipEnabled ?? true,
      tipPercentageDefault: business.tipPercentageDefault ?? 10,
      tipOnlyOnPremise: business.tipOnlyOnPremise ?? true,
      paymentMethods: business.paymentMethods ?? [],
      updatedAt: business.updatedAt || new Date().toISOString(),
    };

    console.log('[Settings Profile API] Profile loaded successfully for business:', businessId);

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

    console.log('[Settings Profile API] PUT request for businessId:', businessId);

    // Validar que businessId sea un UUID válido
    if (!businessId || businessId === 'undefined' || businessId === 'null') {
      console.error('[Settings Profile API] Invalid businessId in PUT:', businessId);
      return NextResponse.json({ 
        success: false, 
        error: 'businessId inválido o no proporcionado. Verifica que el usuario esté autenticado correctamente.' 
      }, { status: 400 });
    }

    // Validar formato de UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      console.error('[Settings Profile API] businessId no es un UUID válido:', businessId);
      return NextResponse.json({ 
        success: false, 
        error: 'businessId no tiene formato UUID válido' 
      }, { status: 400 });
    }

    // Build update object with all possible fields
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor !== undefined) updateData.secondaryColor = body.secondaryColor;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.banner !== undefined) updateData.banner = body.banner;
    if (body.bannerEnabled !== undefined) updateData.bannerEnabled = body.bannerEnabled;
    if (body.heroImageUrl !== undefined) updateData.heroImageUrl = body.heroImageUrl;
    if (body.showHeroBanner !== undefined) updateData.showHeroBanner = body.showHeroBanner;
    if (body.favicon !== undefined) updateData.favicon = body.favicon;
    if (body.impoconsumo !== undefined) updateData.impoconsumo = body.impoconsumo;
    if (body.valorEmpaqueUnitario !== undefined) updateData.valorEmpaqueUnitario = body.valorEmpaqueUnitario;
    if (body.tipEnabled !== undefined) updateData.tipEnabled = body.tipEnabled;
    if (body.tipPercentageDefault !== undefined) updateData.tipPercentageDefault = body.tipPercentageDefault;
    if (body.tipOnlyOnPremise !== undefined) updateData.tipOnlyOnPremise = body.tipOnlyOnPremise;
    if (body.paymentMethods !== undefined) updateData.paymentMethods = body.paymentMethods;

    console.log('[Settings Profile API] Updating fields:', Object.keys(updateData));

    // Update in Supabase (no file-based storage)
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', businessId);

    if (updateError) {
      console.error('[Settings Profile API] Update error:', updateError);
      return NextResponse.json({ success: false, error: 'Error al actualizar el perfil: ' + updateError.message }, { status: 500 });
    }

    // Fetch updated profile
    const { data: updatedBusiness } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (!updatedBusiness) {
      return NextResponse.json({ success: false, error: 'Negocio no encontrado después de actualizar' }, { status: 404 });
    }

    const finalProfile: BusinessProfile = {
      id: updatedBusiness.id,
      name: updatedBusiness.name,
      slug: updatedBusiness.slug,
      phone: updatedBusiness.phone || '',
      address: updatedBusiness.address || '',
      primaryColor: updatedBusiness.primaryColor || '#8b5cf6',
      secondaryColor: updatedBusiness.secondaryColor || '#ffffff',
      logo: updatedBusiness.logo || null,
      avatar: updatedBusiness.avatar || null,
      banner: updatedBusiness.banner || null,
      bannerEnabled: updatedBusiness.bannerEnabled ?? true,
      heroImageUrl: updatedBusiness.heroImageUrl || null,
      showHeroBanner: updatedBusiness.showHeroBanner ?? false,
      favicon: updatedBusiness.favicon || null,
      impoconsumo: updatedBusiness.impoconsumo ?? 8,
      valorEmpaqueUnitario: updatedBusiness.valorEmpaqueUnitario ?? 0,
      tipEnabled: updatedBusiness.tipEnabled ?? true,
      tipPercentageDefault: updatedBusiness.tipPercentageDefault ?? 10,
      tipOnlyOnPremise: updatedBusiness.tipOnlyOnPremise ?? true,
      paymentMethods: updatedBusiness.paymentMethods ?? [],
      updatedAt: updatedBusiness.updatedAt || new Date().toISOString(),
    };

    console.log('[Settings Profile API] Profile updated successfully');

    return NextResponse.json({
      success: true,
      data: finalProfile
    });

  } catch (error) {
    console.error('[Settings Profile API] Error updating profile:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
