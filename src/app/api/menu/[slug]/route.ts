// ============================================================================
// Menu Public API - v4.1 (Aislamiento Total SaaS - DB + Store Aislado)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessProfileAsync } from '@/lib/business-store';

// ============================================================================
// INTERFACES
// ============================================================================

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  featured: boolean;
  image: string | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

interface MenuData {
  business: any; // Flexible structure for compatibility
  categories: Category[];
  products: Product[];
}

interface MenuResponse {
  success: boolean;
  data?: MenuData;
  error?: string;
}

// ============================================================================
// GET - Obtener menú público por slug (Aislado por Negocio)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<MenuResponse>> {
  try {
    const { slug } = await params;

    console.log('[Menu API v4.1] GET menu for slug:', slug);

    // 1. Get business from DB by slug
    const business = await db.business.findUnique({
      where: { slug }
    });

    if (!business) {
      console.log('[Menu API] Business not found for slug:', slug);
      return NextResponse.json({
        success: false,
        error: 'Establecimiento no encontrado'
      }, { status: 404 });
    }

    // 2. Get categories from DB
    const dbCategories = await db.category.findMany({
      where: {
        businessId: business.id,
        isActive: true
      },
      orderBy: { order: 'asc' }
    });

    // 3. Get products from DB
    const dbProducts = await db.product.findMany({
      where: {
        businessId: business.id,
        isAvailable: true
      },
      include: { category: true },
      orderBy: { order: 'asc' }
    });

    // 4. Get advanced settings from isolated store
    const advancedSettings = await getBusinessProfileAsync(business.id);

    // 5. Build response mapping (Database values Override store values for core fields)
    const menuData: MenuData = {
      business: {
        ...advancedSettings, // Features like IVA, payment methods, etc.
        id: business.id,
        name: business.name,
        slug: business.slug,
        phone: business.phone || advancedSettings.phone,
        address: business.address || advancedSettings.address,
        primaryColor: business.primaryColor || advancedSettings.primaryColor,
        secondaryColor: business.secondaryColor || advancedSettings.secondaryColor,
        logo: business.logo || advancedSettings.logo,
      },
      categories: dbCategories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '🍴',
        order: c.order
      })),
      products: dbProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: p.price,
        category: p.category.name,
        available: p.isAvailable,
        featured: p.isFeatured,
        image: p.image,
        stock: 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }))
    };

    console.log('[Menu API] Returning isolated menu with', menuData.products.length, 'products');

    return NextResponse.json({
      success: true,
      data: menuData
    });

  } catch (error) {
    console.error('[Menu API] Error loading menu:', error);

    return NextResponse.json({
      success: false,
      error: 'Error al cargar el menú desde el sistema multi-tenant'
    }, { status: 500 });
  }
}
