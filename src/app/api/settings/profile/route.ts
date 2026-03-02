// ============================================================================
// Settings Profile API - v3.0 (Shared Store with File Persistence)
// Uses shared business store for data persistence across API routes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  getBusinessProfileAsync, 
  updateBusinessProfileAsync,
  type PaymentMethodConfig,
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
  // Imágenes del negocio
  avatar?: string | null;
  banner?: string | null;
  // Propina Voluntaria
  tipEnabled?: boolean;
  tipPercentageDefault?: number;
  tipOnlyOnPremise?: boolean;
  // Métodos de Pago
  paymentMethods?: PaymentMethodConfig[];
}

// ============================================================================
// GET - Obtener perfil del negocio
// ============================================================================

export async function GET(): Promise<NextResponse<ProfileResponse>> {
  const profile = await getBusinessProfileAsync();
  console.log('[Settings Profile API v3.0] GET profile:', profile.name);
  console.log('[Settings Profile API v3.0] Payment methods:', profile.paymentMethods?.filter(m => m.enabled).map(m => m.name).join(', '));
  
  return NextResponse.json({
    success: true,
    data: profile
  });
}

// ============================================================================
// PUT - Actualizar perfil del negocio
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const body: UpdateProfileRequest = await request.json();
    
    console.log('[Settings Profile API] PUT request:', body);
    
    // Validate required fields
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del negocio es requerido'
      }, { status: 400 });
    }
    
    // Update profile using shared store (async for file persistence)
    const updatedProfile = await updateBusinessProfileAsync({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
      ...(body.secondaryColor !== undefined && { secondaryColor: body.secondaryColor }),
      ...(body.logo !== undefined && { logo: body.logo }),
      ...(body.iva !== undefined && { iva: body.iva }),
      ...(body.empaque !== undefined && { empaque: body.empaque }),
      ...(body.valorEmpaqueUnitario !== undefined && { valorEmpaqueUnitario: body.valorEmpaqueUnitario }),
      ...(body.domicilio !== undefined && { domicilio: body.domicilio }),
      ...(body.impoconsumo !== undefined && { impoconsumo: body.impoconsumo }),
      // Imágenes del negocio
      ...(body.avatar !== undefined && { avatar: body.avatar }),
      ...(body.banner !== undefined && { banner: body.banner }),
      // Propina Voluntaria
      ...(body.tipEnabled !== undefined && { tipEnabled: body.tipEnabled }),
      ...(body.tipPercentageDefault !== undefined && { tipPercentageDefault: body.tipPercentageDefault }),
      ...(body.tipOnlyOnPremise !== undefined && { tipOnlyOnPremise: body.tipOnlyOnPremise }),
      // Métodos de Pago
      ...(body.paymentMethods !== undefined && { paymentMethods: body.paymentMethods }),
    });

    console.log('[Settings Profile API v3.0] Profile updated successfully:', updatedProfile.name);
    console.log('[Settings Profile API v3.0] Active payment methods:', updatedProfile.paymentMethods?.filter(m => m.enabled).map(m => m.name).join(', '));

    return NextResponse.json({
      success: true,
      data: updatedProfile
    });

  } catch (error) {
    console.error('[Settings Profile API] Error updating profile:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el perfil'
    }, { status: 500 });
  }
}
