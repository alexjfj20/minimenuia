// ============================================================================
// Menu Public API - v4.1 (Aislamiento Total SaaS - DB + Store Aislado)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getBusinessProfileAsync } from '@/lib/business-store';

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
  business: any;
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
    console.log('[Menu API] Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[Menu API] Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get business from Supabase by slug (include ALL fields to debug)
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (businessError) {
      console.error('[Menu API] Business query error:', businessError);
      return NextResponse.json({
        success: false,
        error: 'Error al buscar el establecimiento'
      }, { status: 500 });
    }

    if (!business) {
      console.log('[Menu API] Business not found for slug:', slug);

      // Debug: List all available businesses and their slugs
      const { data: allBusinesses } = await supabaseAdmin
        .from('businesses')
        .select('id, name, slug, phone');

      console.log('[Menu API] All available businesses:', allBusinesses);
      console.log('[Menu API] Looking for slug:', slug);
      console.log('[Menu API] Available slugs:', allBusinesses?.map(b => b.slug));
      console.log('[Menu API] Available phones:', allBusinesses?.map(b => b.phone));

      return NextResponse.json({
        success: false,
        error: 'Establecimiento no encontrado. Slug disponible: ' + (allBusinesses?.[0]?.slug || 'ninguno')
      }, { status: 404 });
    }

    console.log('[Menu API] Business found:', business.name);
    console.log('[Menu API] Business slug:', business.slug);
    console.log('[Menu API] Business phone field:', business.phone);
    console.log('[Menu API] All business fields:', Object.keys(business));

    // Prepare business data for response
    const businessData = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description || '',
      logo: business.logo,
      primaryColor: business.primaryColor || '#8b5cf6',
      secondaryColor: business.secondaryColor || '#ffffff',
      phone: business.phone,
      address: business.address || '',
      iva: business.iva ?? 19,
      empaque: business.empaque ?? 3000,
      impoconsumo: business.impoconsumo ?? 8,
      valorEmpaqueUnitario: business.valorEmpaqueUnitario,
      domicilio: business.domicilio,
      banner: business.banner,
      bannerEnabled: business.bannerEnabled,
      heroImageUrl: business.heroImageUrl,
      showHeroBanner: business.showHeroBanner,
      tipEnabled: business.tipEnabled,
      tipPercentageDefault: business.tipPercentageDefault,
      tipOnlyOnPremise: business.tipOnlyOnPremise,
      paymentMethods: business.paymentMethods
    };

    console.log('[Menu API] Sending business data with phone:', businessData.phone);

    // 2. Get categories from Supabase
    const { data: dbCategories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('businessId', business.id)
      .eq('isActive', true)
      .order('order', { ascending: true });

    if (categoriesError) {
      console.error('[Menu API] Categories query error:', categoriesError);
    }

    console.log('[Menu API] Categories loaded:', dbCategories?.length || 0);

    // 3. Get products from Supabase (simple query without relations to avoid issues)
    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('businessId', business.id)
      .eq('isAvailable', true)
      .order('order', { ascending: true });

    if (productsError) {
      console.error('[Menu API] Products query error:', productsError);
      return NextResponse.json({
        success: false,
        error: 'Error al cargar los productos: ' + productsError.message
      }, { status: 500 });
    }

    console.log('[Menu API] Products loaded:', dbProducts?.length || 0);

    // Create category map for quick lookup
    const categoryMap = new Map(dbCategories?.map(c => [c.id, c.name]) || []);

    const categories: Category[] = (dbCategories || []).map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon || '🍴',
      order: c.order
    }));

    const products: Product[] = (dbProducts || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: categoryMap.get(p.categoryId || '') || 'General',
      available: p.isAvailable,
      featured: p.isFeatured,
      image: p.image,
      stock: p.stock || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    console.log(`[Menu API] Menu loaded: ${products.length} products, ${categories.length} categories`);

    return NextResponse.json({
      success: true,
      data: {
        business: businessData,
        categories,
        products
      }
    });

  } catch (error) {
    console.error('[Menu API] Error loading menu:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al cargar el menú'
    }, { status: 500 });
  }
}
