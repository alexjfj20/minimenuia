import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// IN-MEMORY STORAGE (persists during server runtime)
// ============================================================================

interface BusinessProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  slug: string;
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
  updatedAt: string;
}

// Default profile
const DEFAULT_PROFILE: BusinessProfile = {
  id: 'business-1',
  name: 'Restaurante El Sabor',
  phone: '+57 300 123 4567',
  address: 'Calle 123 #45-67, Bogotá',
  primaryColor: '#8b5cf6',
  secondaryColor: '#ffffff',
  logo: null,
  slug: 'restaurante-el-sabor',
  iva: 19,
  empaque: 3000,
  valorEmpaqueUnitario: 500,
  domicilio: 3000,
  impoconsumo: 8,
  // Imágenes del negocio
  avatar: null,
  banner: null,
  // Propina Voluntaria - Configuración por defecto
  tipEnabled: true,
  tipPercentageDefault: 10,
  tipOnlyOnPremise: true,
  updatedAt: new Date().toISOString()
};

// In-memory storage
let currentProfile: BusinessProfile = { ...DEFAULT_PROFILE };

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
}

// ============================================================================
// GET - Obtener perfil del negocio
// ============================================================================

export async function GET(): Promise<NextResponse<ProfileResponse>> {
  console.log('[Settings Profile API] GET profile:', currentProfile.name);
  
  return NextResponse.json({
    success: true,
    data: currentProfile
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
    
    // Update profile
    currentProfile = {
      ...currentProfile,
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
      ...(body.logo !== undefined && { logo: body.logo }),
      ...(body.banner !== undefined && { banner: body.banner }),
      // Propina Voluntaria
      ...(body.tipEnabled !== undefined && { tipEnabled: body.tipEnabled }),
      ...(body.tipPercentageDefault !== undefined && { tipPercentageDefault: body.tipPercentageDefault }),
      ...(body.tipOnlyOnPremise !== undefined && { tipOnlyOnPremise: body.tipOnlyOnPremise }),
      updatedAt: new Date().toISOString()
    };

    console.log('[Settings Profile API] Profile updated successfully:', currentProfile.name);

    return NextResponse.json({
      success: true,
      data: currentProfile
    });

  } catch (error) {
    console.error('[Settings Profile API] Error updating profile:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el perfil'
    }, { status: 500 });
  }
}
