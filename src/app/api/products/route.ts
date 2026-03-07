// =============================================
// MINIMENU - Products API (Supabase + pg)
// =============================================
// CRÍTICO: Cada negocio tiene sus propios productos aislados por businessId
// Las cuentas nuevas empiezan SIN productos (SaaS multi-tenant)

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Product {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  order: number;
  stock: number | null;
  onSale: boolean;
  salePrice: number | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductsDataResponse {
  products: Product[];
  categories: Category[];
}

interface ProductsResponse {
  success: boolean;
  data?: ProductsDataResponse;
  products?: Product[];
  product?: Product;
  error?: string;
}

interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  available?: boolean;
  featured?: boolean;
  image?: string | null;
  stock?: number;
  onSale?: boolean;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

interface UpdateProductRequest {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  available?: boolean;
  featured?: boolean;
  image?: string | null;
  stock?: number;
  onSale?: boolean;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

// ============================================================================
// HELPER: Get businessId from session cookie
// ============================================================================

function getBusinessIdFromSession(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    console.log('[Products API] No session cookie found');
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    console.log('[Products API] Session businessId:', session.businessId);
    return session.businessId || null;
  } catch (error) {
    console.error('[Products API] Error parsing session:', error);
    return null;
  }
}

// ============================================================================
// GET - Obtener productos y categorías del negocio autenticado
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('[Products API] DATABASE_URL not configured');
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  // Obtener businessId de la sesión
  const businessId = getBusinessIdFromSession(request);

  if (!businessId) {
    console.log('[Products API] GET rejected - no businessId');
    return NextResponse.json(
      { success: false, error: 'No autenticado o sin negocio asociado' },
      { status: 401 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();

    try {
      // Obtener categorías del negocio
      const categoriesResult = await client.query(
        `SELECT id, "businessId", name, description, icon, "order", "isActive", "createdAt", "updatedAt"
         FROM categories 
         WHERE "businessId" = $1 
         ORDER BY "order" ASC`,
        [businessId]
      );

      // Obtener productos del negocio
      const productsResult = await client.query(
        `SELECT id, "businessId", "categoryId", name, description, price, currency, image, 
                "isAvailable", "isFeatured", "order", stock, "onSale", "salePrice", 
                "saleStartDate", "saleEndDate", "createdAt", "updatedAt"
         FROM products 
         WHERE "businessId" = $1 
         ORDER BY "order" ASC, "createdAt" DESC`,
        [businessId]
      );

      const response: ProductsDataResponse = {
        categories: categoriesResult.rows.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          businessId: row.businessId as string,
          name: (row.name as string) || '',
          description: row.description as string | null,
          icon: row.icon as string | null,
          order: (row.order as number) || 0,
          isActive: (row.isActive as boolean) ?? true,
          createdAt: row.createdAt as string,
          updatedAt: row.updatedAt as string,
        })),
        products: productsResult.rows.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          businessId: row.businessId as string,
          categoryId: row.categoryId as string | null,
          name: (row.name as string) || '',
          description: (row.description as string) || '',
          price: Number(row.price) || 0,
          currency: (row.currency as string) || 'COP',
          image: row.image as string | null,
          isAvailable: (row.isAvailable as boolean) ?? true,
          isFeatured: (row.isFeatured as boolean) ?? false,
          order: (row.order as number) || 0,
          stock: row.stock as number | null,
          onSale: (row.onSale as boolean) ?? false,
          salePrice: row.salePrice ? Number(row.salePrice) : null,
          saleStartDate: row.saleStartDate as string | null,
          saleEndDate: row.saleEndDate as string | null,
          createdAt: row.createdAt as string,
          updatedAt: row.updatedAt as string,
        })),
      };

      console.log('[Products API] GET for business:', businessId, 
                  '- Products:', response.products.length, 
                  'Categories:', response.categories.length);

      return NextResponse.json({
        success: true,
        data: response,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// ============================================================================
// POST - Crear nuevo producto
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  // Obtener businessId de la sesión
  const businessId = getBusinessIdFromSession(request);

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'No autenticado o sin negocio asociado' },
      { status: 401 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const body: CreateProductRequest = await request.json();
    
    console.log('[Products API] POST request:', body.name, 'for business:', businessId);
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del producto es requerido'
      }, { status: 400 });
    }
    
    if (body.price === undefined || body.price < 0) {
      return NextResponse.json({
        success: false,
        error: 'El precio es requerido y debe ser mayor o igual a 0'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Get max order for this business
      const orderResult = await client.query(
        'SELECT COALESCE(MAX("order"), 0) as max_order FROM products WHERE "businessId" = $1',
        [businessId]
      );
      const nextOrder = ((orderResult.rows[0] as Record<string, unknown>)?.max_order as number || 0) + 1;

      // Generate UUID
      const idResult = await client.query('SELECT gen_random_uuid() as id');
      const productId = (idResult.rows[0] as Record<string, unknown>).id as string;

      // Insert product
      await client.query(
        `INSERT INTO products (
          id, "businessId", "categoryId", name, description, price, currency, image,
          "isAvailable", "isFeatured", "order", stock, "onSale", "salePrice",
          "saleStartDate", "saleEndDate"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          productId,
          businessId,
          body.categoryId || null,
          body.name.trim(),
          body.description?.trim() || '',
          Number(body.price),
          'COP',
          body.image || null,
          body.available ?? true,
          body.featured ?? false,
          nextOrder,
          body.stock ?? 0,
          body.onSale ?? false,
          body.salePrice || null,
          body.saleStartDate || null,
          body.saleEndDate || null,
        ]
      );

      // Return the created product
      const newProduct: Product = {
        id: productId,
        businessId,
        categoryId: body.categoryId || null,
        name: body.name.trim(),
        description: body.description?.trim() || '',
        price: Number(body.price),
        currency: 'COP',
        image: body.image || null,
        isAvailable: body.available ?? true,
        isFeatured: body.featured ?? false,
        order: nextOrder,
        stock: body.stock ?? 0,
        onSale: body.onSale ?? false,
        salePrice: body.salePrice || null,
        saleStartDate: body.saleStartDate || null,
        saleEndDate: body.saleEndDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[Products API] Product created:', productId, newProduct.name);

      return NextResponse.json({
        success: true,
        product: newProduct,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Products API] Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el producto' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// ============================================================================
// PUT - Actualizar producto existente
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  // Obtener businessId de la sesión
  const businessId = getBusinessIdFromSession(request);

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'No autenticado o sin negocio asociado' },
      { status: 401 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const body: UpdateProductRequest = await request.json();
    
    console.log('[Products API] PUT request for product:', body.id, 'business:', businessId);
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'El ID del producto es requerido'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Verify product belongs to this business
      const checkResult = await client.query(
        'SELECT id FROM products WHERE id = $1 AND "businessId" = $2',
        [body.id, businessId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Producto no encontrado o no autorizado'
        }, { status: 404 });
      }

      // Build update query
      const updates: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      if (body.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(body.name.trim());
        paramIndex++;
      }
      if (body.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(body.description.trim());
        paramIndex++;
      }
      if (body.price !== undefined) {
        updates.push(`price = $${paramIndex}`);
        values.push(Number(body.price));
        paramIndex++;
      }
      if (body.categoryId !== undefined) {
        updates.push(`"categoryId" = $${paramIndex}`);
        values.push(body.categoryId || null);
        paramIndex++;
      }
      if (body.available !== undefined) {
        updates.push(`"isAvailable" = $${paramIndex}`);
        values.push(body.available);
        paramIndex++;
      }
      if (body.featured !== undefined) {
        updates.push(`"isFeatured" = $${paramIndex}`);
        values.push(body.featured);
        paramIndex++;
      }
      if (body.image !== undefined) {
        updates.push(`image = $${paramIndex}`);
        values.push(body.image);
        paramIndex++;
      }
      if (body.stock !== undefined) {
        updates.push(`stock = $${paramIndex}`);
        values.push(body.stock);
        paramIndex++;
      }
      if (body.onSale !== undefined) {
        updates.push(`"onSale" = $${paramIndex}`);
        values.push(body.onSale);
        paramIndex++;
      }
      if (body.salePrice !== undefined) {
        updates.push(`"salePrice" = $${paramIndex}`);
        values.push(body.salePrice);
        paramIndex++;
      }
      if (body.saleStartDate !== undefined) {
        updates.push(`"saleStartDate" = $${paramIndex}`);
        values.push(body.saleStartDate);
        paramIndex++;
      }
      if (body.saleEndDate !== undefined) {
        updates.push(`"saleEndDate" = $${paramIndex}`);
        values.push(body.saleEndDate);
        paramIndex++;
      }

      if (updates.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No hay campos para actualizar'
        }, { status: 400 });
      }

      updates.push(`"updatedAt" = NOW()`);

      // Add WHERE clause parameters
      values.push(body.id);
      values.push(businessId);

      const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex} AND "businessId" = $${paramIndex + 1}`;
      
      await client.query(query, values);

      // Get updated product
      const result = await client.query(
        `SELECT id, "businessId", "categoryId", name, description, price, currency, image, 
                "isAvailable", "isFeatured", "order", stock, "onSale", "salePrice", 
                "saleStartDate", "saleEndDate", "createdAt", "updatedAt"
         FROM products WHERE id = $1`,
        [body.id]
      );

      const row = result.rows[0] as Record<string, unknown>;
      const updatedProduct: Product = {
        id: row.id as string,
        businessId: row.businessId as string,
        categoryId: row.categoryId as string | null,
        name: (row.name as string) || '',
        description: (row.description as string) || '',
        price: Number(row.price) || 0,
        currency: (row.currency as string) || 'COP',
        image: row.image as string | null,
        isAvailable: (row.isAvailable as boolean) ?? true,
        isFeatured: (row.isFeatured as boolean) ?? false,
        order: (row.order as number) || 0,
        stock: row.stock as number | null,
        onSale: (row.onSale as boolean) ?? false,
        salePrice: row.salePrice ? Number(row.salePrice) : null,
        saleStartDate: row.saleStartDate as string | null,
        saleEndDate: row.saleEndDate as string | null,
        createdAt: row.createdAt as string,
        updatedAt: row.updatedAt as string,
      };

      console.log('[Products API] Product updated:', updatedProduct.id, updatedProduct.name);

      return NextResponse.json({
        success: true,
        product: updatedProduct,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Products API] Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el producto' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// ============================================================================
// DELETE - Eliminar producto
// ============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  // Obtener businessId de la sesión
  const businessId = getBusinessIdFromSession(request);

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'No autenticado o sin negocio asociado' },
      { status: 401 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('[Products API] DELETE request for product:', id, 'business:', businessId);
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'El ID del producto es requerido'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Verify product belongs to this business and delete
      const result = await client.query(
        'DELETE FROM products WHERE id = $1 AND "businessId" = $2 RETURNING id, name',
        [id, businessId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Producto no encontrado o no autorizado'
        }, { status: 404 });
      }

      const deletedProduct = result.rows[0] as Record<string, unknown>;

      console.log('[Products API] Product deleted:', deletedProduct.id, deletedProduct.name);

      return NextResponse.json({
        success: true,
        product: deletedProduct as unknown as Product,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Products API] Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el producto' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
