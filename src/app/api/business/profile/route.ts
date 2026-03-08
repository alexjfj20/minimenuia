import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================================
// INTERFACES
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
  updatedAt: string;
  // Campos adicionales para compatibilidad
  description?: string;
  avatar?: string | null;
  banner?: string | null;
  bannerEnabled?: boolean;
  heroImageUrl?: string | null;
  showHeroBanner?: boolean;
}

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
  slug?: string;
  description?: string;
  avatar?: string | null;
  banner?: string | null;
  bannerEnabled?: boolean;
}

// ============================================================================
// GET - Obtener perfil del negocio filtrado por businessId
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'businessId es requerido para obtener el perfil'
      }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Negocio no encontrado'
      }, { status: 404 });
    }

    const profile: BusinessProfile = {
      id: business.id,
      name: business.name,
      phone: business.phone || '',
      address: business.address || '',
      primaryColor: business.primaryColor || '#8b5cf6',
      secondaryColor: business.secondaryColor || '#ffffff',
      logo: business.logo || null,
      slug: business.slug,
      description: business.description || '',
      avatar: business.avatar || null,
      banner: business.banner || null,
      bannerEnabled: business.bannerEnabled ?? true,
      heroImageUrl: business.heroImageUrl || null,
      showHeroBanner: business.showHeroBanner ?? false,
      updatedAt: business.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('[Profile API] Error reading profile from DB:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el perfil de la base de datos'
    }, { status: 500 });
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
      return NextResponse.json({
        success: false,
        error: 'businessId es requerido para actualizar el perfil'
      }, { status: 400 });
    }

    // Update business in DB
    const updatedBusiness = await db.business.update({
      where: { id: businessId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
        ...(body.secondaryColor !== undefined && { secondaryColor: body.secondaryColor }),
        ...(body.logo !== undefined && { logo: body.logo }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.banner !== undefined && { banner: body.banner }),
        ...(body.bannerEnabled !== undefined && { bannerEnabled: body.bannerEnabled }),
        ...(body.slug !== undefined && { slug: body.slug }),
      }
    });

    const profile: BusinessProfile = {
      id: updatedBusiness.id,
      name: updatedBusiness.name,
      phone: updatedBusiness.phone || '',
      address: updatedBusiness.address || '',
      primaryColor: updatedBusiness.primaryColor || '#8b5cf6',
      secondaryColor: updatedBusiness.secondaryColor || '#ffffff',
      logo: updatedBusiness.logo || null,
      slug: updatedBusiness.slug,
      description: updatedBusiness.description || '',
      avatar: updatedBusiness.avatar || null,
      banner: updatedBusiness.banner || null,
      bannerEnabled: updatedBusiness.bannerEnabled ?? true,
      updatedAt: updatedBusiness.updatedAt.toISOString()
    };

    console.log('[Profile API] Profile updated in DB successfully:', profile.name);

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('[Profile API] Error updating profile in DB:', error);

    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el perfil en la base de datos'
    }, { status: 500 });
  }
}
