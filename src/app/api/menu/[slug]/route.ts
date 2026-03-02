import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

interface BusinessProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  slug: string;
  iva: number;
  empaque: number;
  valorEmpaqueUnitario?: number;
  domicilio?: number;
  impoconsumo?: number;
  // Propina Voluntaria
  tipEnabled?: boolean;
  tipPercentageDefault?: number;
  tipOnlyOnPremise?: boolean;
  updatedAt: string;
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
// FILE-BASED STORAGE PATHS
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const PROFILE_FILE = path.join(DATA_DIR, 'business_profile.json');

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
// GET - Obtener menú público por slug
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<MenuResponse>> {
  try {
    const { slug } = await params;
    
    console.log('[Menu API] GET menu for slug:', slug);
    
    // Read business profile
    const defaultProfile: BusinessProfile = {
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
      // Propina Voluntaria
      tipEnabled: true,
      tipPercentageDefault: 10,
      tipOnlyOnPremise: true,
      updatedAt: new Date().toISOString()
    };
    
    const profile = await readJSON<BusinessProfile>(PROFILE_FILE, defaultProfile);
    
    // Check if slug matches (for now, we'll accept any slug and return the data)
    // In production, you'd want to validate the slug against the business
    
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
