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

    // 1. Get business from Supabase by slug
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (businessError || !business) {
      console.log('[Menu API] Business not found for slug:', slug);
      return NextResponse.json({
        success: false,
        error: 'Establecimiento no encontrado'
      }, { status: 404 });
    }

    // 2. Get categories from Supabase
    const { data: dbCategories } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('businessId', business.id)
      .eq('isActive', true)
      .order('order', { ascending: true });

    // 3. Get products from Supabase
    const { data: dbProducts } = await supabaseAdmin
      .from('products')
      .select('*, categories:category(name)')
      .eq('businessId', business.id)
      .eq('isAvailable', true)
      .order('order', { ascending: true });

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
      category: p.categories?.name || 'General',
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
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          logo: business.logo,
          primaryColor: business.primaryColor,
          secondaryColor: business.secondaryColor
        },
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
