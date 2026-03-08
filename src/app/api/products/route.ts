import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Currency } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

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
  // Campos de Oferta
  onSale?: boolean;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

interface ProductsData {
  products: Product[];
  categories: Category[];
  updatedAt: string;
}

interface ProductsResponse {
  success: boolean;
  data?: ProductsData;
  products?: Product[];
  product?: Product;
  error?: string;
}

interface CreateProductRequest {
  businessId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available?: boolean;
  featured?: boolean;
  image?: string | null;
  stock?: number;
  // Campos de Oferta
  onSale?: boolean;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

interface UpdateProductRequest {
  id: string;
  businessId: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  available?: boolean;
  featured?: boolean;
  image?: string | null;
  stock?: number;
  // Campos de Oferta
  onSale?: boolean;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

// ============================================================================
// GET - Obtener todos los productos filtrados por businessId
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'El businessId es requerido para listar productos'
      }, { status: 400 });
    }

    // Fetch categories from DB
    const dbCategories = await db.category.findMany({
      where: { businessId },
      orderBy: { order: 'asc' }
    });

    // Fetch products from DB
    const dbProducts = await db.product.findMany({
      where: { businessId },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[Products API] GET from DB for business ${businessId}: ${dbProducts.length} products`);

    const products: Product[] = dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: p.category.name,
      categoryId: p.categoryId,
      available: p.isAvailable,
      featured: p.isFeatured,
      image: p.image,
      stock: 0, // No hay campo stock en el esquema actual de Prisma product
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    }));

    const categories: Category[] = dbCategories.map(c => ({
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
    const { businessId, name, price, category: categoryName } = body;

    console.log('[Products API] POST request:', name, 'for business:', businessId);

    // Validate required fields
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
    let category = await db.category.findFirst({
      where: {
        businessId,
        name: categoryName || 'Entradas'
      }
    });

    if (!category) {
      category = await db.category.create({
        data: {
          businessId,
          name: categoryName || 'Entradas',
          icon: '🍴',
          order: 0
        }
      });
    }

    // 2. Create product
    const dbProduct = await db.product.create({
      data: {
        businessId,
        categoryId: category.id,
        name: name.trim(),
        description: body.description?.trim() || '',
        price: Number(price),
        currency: Currency.COP,
        isAvailable: body.available ?? true,
        isFeatured: body.featured ?? false,
        image: body.image || null,
      },
      include: {
        category: true
      }
    });

    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || '',
      price: dbProduct.price,
      category: dbProduct.category.name,
      categoryId: dbProduct.categoryId,
      available: dbProduct.isAvailable,
      featured: dbProduct.isFeatured,
      image: dbProduct.image,
      stock: 0,
      createdAt: dbProduct.createdAt.toISOString(),
      updatedAt: dbProduct.updatedAt.toISOString()
    };

    console.log('[Products API] Product created in DB:', product.id);

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('[Products API] Error creating product:', error);
    return NextResponse.json({ success: false, error: 'Error al crear el producto' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Actualizar producto existente
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const body: UpdateProductRequest = await request.json();
    const { id, businessId } = body;

    console.log('[Products API] PUT request for product:', id);

    if (!id || !businessId) {
      return NextResponse.json({ success: false, error: 'ID y businessId son requeridos' }, { status: 400 });
    }

    // 1. If category name is provided, ensure it exists
    let categoryId = undefined;
    if (body.category) {
      let category = await db.category.findFirst({
        where: { businessId, name: body.category }
      });

      if (!category) {
        category = await db.category.create({
          data: {
            businessId,
            name: body.category,
            icon: '🍴',
            order: 0
          }
        });
      }
      categoryId = category.id;
    }

    // 2. Update product
    const dbProduct = await db.product.update({
      where: {
        id,
        businessId // Strict filtering for security
      },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(body.available !== undefined && { isAvailable: body.available }),
        ...(body.featured !== undefined && { isFeatured: body.featured }),
        ...(body.image !== undefined && { image: body.image }),
      },
      include: {
        category: true
      }
    });

    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || '',
      price: dbProduct.price,
      category: dbProduct.category.name,
      categoryId: dbProduct.categoryId,
      available: dbProduct.isAvailable,
      featured: dbProduct.isFeatured,
      image: dbProduct.image,
      stock: 0,
      createdAt: dbProduct.createdAt.toISOString(),
      updatedAt: dbProduct.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('[Products API] Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar el producto' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Eliminar producto
// ============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const businessId = searchParams.get('businessId');

    if (!id || !businessId) {
      return NextResponse.json({ success: false, error: 'ID y businessId son requeridos' }, { status: 400 });
    }

    const deletedProduct = await db.product.delete({
      where: {
        id,
        businessId // Strict filtering for security
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    console.error('[Products API] Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar el producto' }, { status: 500 });
  }
}
