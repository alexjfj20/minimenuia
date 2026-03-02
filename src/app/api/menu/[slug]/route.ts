// ============================================================================
// Menu Public API - v3.1 (Shared Store + Payment Methods Sync - FIX CACHE)
// FIX: Payment methods from profile should sync to menu
// ============================================================================

const API_VERSION = '3.1-FIX-CACHE';

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  getBusinessProfileAsync,
  type PaymentMethodConfig,
  type BusinessProfile 
} from '@/lib/business-store';

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
  business: BusinessProfile;
  categories: Category[];
  products: Product[];
}

interface MenuResponse {
  success: boolean;
  data?: MenuData;
  error?: string;
}

// ============================================================================
// FILE-BASED STORAGE PATHS (for products only)
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function readJSON<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

// ============================================================================
// GET - Obtener menú público por slug (v2 - using shared store)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<MenuResponse>> {
  try {
    const { slug } = await params;
    
    console.log('========================================');
    console.log('[Menu API v3.0] GET menu for slug:', slug);
    console.log('[Menu API v3.0] API Version:', API_VERSION);
    
    // Get business profile from shared store (async to ensure file is loaded)
    const profile = await getBusinessProfileAsync();
    
    console.log('[Menu API] Profile loaded:', profile.name);
    console.log('[Menu API] Payment methods from store:', profile.paymentMethods?.map(m => `${m.name}(${m.enabled ? 'on' : 'off'})`).join(', '));
    
    // Read products and categories
    const defaultProductsData = {
      products: [] as Product[],
      categories: [] as Category[],
      updatedAt: new Date().toISOString()
    };
    
    const productsData = await readJSON<{
      products: Product[];
      categories: Category[];
      updatedAt: string;
    }>(PRODUCTS_FILE, defaultProductsData);
    
    // Build response
    const menuData: MenuData = {
      business: {
        ...profile,
        slug: slug || profile.slug
      },
      categories: productsData.categories || [],
      products: productsData.products || []
    };
    
    console.log('[Menu API] Returning menu with', menuData.products.length, 'products');
    console.log('[Menu API] Active payment methods:', menuData.business.paymentMethods?.filter(m => m.enabled).map(m => m.name).join(', '));
    
    return NextResponse.json({
      success: true,
      data: menuData
    });

  } catch (error) {
    console.error('[Menu API] Error reading menu:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al cargar el menú'
    }, { status: 500 });
  }
}
