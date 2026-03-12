import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
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

interface ProductsResponse {
  success: boolean;
  data?: { products: Product[]; categories: Category[]; updatedAt: string };
  error?: string;
}

interface CreateProductRequest {
  businessId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  available?: boolean;
  featured?: boolean;
  image?: string | null;
  stock?: number;
}

// ============================================================================
// GET - Obtener todos los productos filtrados por businessId
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    console.log('[Products API] GET request for businessId:', businessId);
    console.log('[Products API] Supabase configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'El businessId es requerido para listar productos'
      }, { status: 400 });
    }

    // Fetch categories from Supabase (without relations to avoid issues)
    const { data: dbCategories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('businessId', businessId)
      .order('order', { ascending: true });

    if (categoriesError) {
      console.error('[Products API] Categories error:', categoriesError);
    }

    console.log('[Products API] Categories found:', dbCategories?.length || 0);

    // Fetch products from Supabase (simple query without relations)
    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('businessId', businessId)
      .order('createdAt', { ascending: false });

    if (productsError) {
      console.error('[Products API] Products error:', productsError);
      return NextResponse.json({
        success: false,
        error: 'Error al leer los productos de la base de datos: ' + productsError.message
      }, { status: 500 });
    }

    console.log(`[Products API] GET from DB for business ${businessId}: ${dbProducts?.length || 0} products`);

    // Get category names separately to avoid relation issues
    const categoryMap = new Map(dbCategories?.map(c => [c.id, c.name]) || []);

    const products: Product[] = (dbProducts || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: categoryMap.get(p.categoryId || '') || 'General',
      categoryId: p.categoryId,
      available: p.isAvailable,
      featured: p.isFeatured,
      image: p.image,
      stock: p.stock || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    const categories: Category[] = (dbCategories || []).map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon || '🍴',
      order: c.order
    }));

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Products API] Error reading products:', error);

    return NextResponse.json({
      success: false,
      error: 'Error al leer los productos de la base de datos'
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear nuevo producto
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const body: CreateProductRequest = await request.json();
    const { businessId, name, price, category: categoryName, categoryId } = body;

    console.log('[Products API] POST request:', name, 'for business:', businessId);

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId es requerido' }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre del producto es requerido' }, { status: 400 });
    }
    if (price === undefined || price < 0) {
      return NextResponse.json({ success: false, error: 'El precio es requerido' }, { status: 400 });
    }

    // 1. Get or create category
    let categoryIdToUse = categoryId;
    
    if (!categoryIdToUse && categoryName) {
      const { data: existingCategory } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('businessId', businessId)
        .eq('name', categoryName)
        .maybeSingle();

      if (existingCategory) {
        categoryIdToUse = existingCategory.id;
      } else {
        const { data: newCategory } = await supabaseAdmin
          .from('categories')
          .insert({
            businessId,
            name: categoryName,
            icon: '🍴',
            order: 0
          })
          .select()
          .single();
        
        categoryIdToUse = newCategory?.id;
      }
    }

    // 2. Create product
    const { data: newProduct, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        businessId,
        name,
        description: body.description || '',
        price,
        categoryId: categoryIdToUse,
        isAvailable: body.available ?? true,
        isFeatured: body.featured ?? false,
        image: body.image || null,
        stock: body.stock ?? 0,
        order: 0
      })
      .select()
      .single();

    if (productError) {
      console.error('[Products API] Error creating product:', productError);
      return NextResponse.json({
        success: false,
        error: 'Error al crear el producto'
      }, { status: 500 });
    }

    console.log('[Products API] Product created successfully:', newProduct.id);

    return NextResponse.json({
      success: true,
      data: {
        products: [{
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description || '',
          price: newProduct.price,
          category: categoryName || 'General',
          categoryId: categoryIdToUse,
          available: newProduct.isAvailable,
          featured: newProduct.isFeatured,
          image: newProduct.image,
          stock: newProduct.stock || 0,
          createdAt: newProduct.createdAt,
          updatedAt: newProduct.updatedAt
        }],
        categories: [],
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Products API] Error creating product:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al crear el producto'
    }, { status: 500 });
  }
}

// ============================================================================
// PUT - Actualizar producto
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const body: CreateProductRequest & { id: string } = await request.json();
    const { id, businessId } = body;

    if (!id || !businessId) {
      return NextResponse.json({ success: false, error: 'ID y businessId son requeridos' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.available !== undefined) updateData.isAvailable = body.available;
    if (body.featured !== undefined) updateData.isFeatured = body.featured;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.stock !== undefined) updateData.stock = body.stock;

    await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('businessId', businessId);

    console.log('[Products API] Product updated successfully:', id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Products API] Error updating product:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el producto'
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Eliminar producto
// ============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID del producto es requerido' }, { status: 400 });
    }

    await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    console.log('[Products API] Product deleted successfully:', id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Products API] Error deleting product:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar el producto'
    }, { status: 500 });
  }
}
