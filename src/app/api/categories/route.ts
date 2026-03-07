// =============================================
// MINIMENU - Categories API (con pg directo)
// =============================================
// Cada negocio tiene sus propias categorías aisladas por businessId
// Las cuentas nuevas empiezan SIN categorías (SaaS multi-tenant)

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

// ============================================================================
// INTERFACES
// ============================================================================

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

interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

interface UpdateCategoryRequest {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

// ============================================================================
// HELPER: Get businessId from session
// ============================================================================

function getBusinessIdFromSession(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return session.businessId || null;
  } catch {
    return null;
  }
}

// ============================================================================
// GET - Obtener categorías del negocio autenticado
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, "businessId", name, description, icon, "order", "isActive", "createdAt", "updatedAt"
         FROM categories 
         WHERE "businessId" = $1 
         ORDER BY "order" ASC`,
        [businessId]
      );

      const categories: Category[] = result.rows.map(row => ({
        id: row.id,
        businessId: row.businessId,
        name: row.name || '',
        description: row.description,
        icon: row.icon,
        order: row.order || 0,
        isActive: row.isActive ?? true,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      console.log('[Categories API] GET for business:', businessId, '- Categories:', categories.length);

      return NextResponse.json({
        success: true,
        data: categories,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Categories API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener categorías' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// ============================================================================
// POST - Crear nueva categoría
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const body: CreateCategoryRequest = await request.json();
    
    console.log('[Categories API] POST request:', body.name, 'for business:', businessId);
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El nombre de la categoría es requerido'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Get max order for this business
      const orderResult = await client.query(
        'SELECT COALESCE(MAX("order"), 0) as max_order FROM categories WHERE "businessId" = $1',
        [businessId]
      );
      const nextOrder = (orderResult.rows[0]?.max_order || 0) + 1;

      // Generate UUID
      const idResult = await client.query('SELECT gen_random_uuid() as id');
      const categoryId = idResult.rows[0].id;

      // Insert category
      await client.query(
        `INSERT INTO categories (id, "businessId", name, description, icon, "order", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          categoryId,
          businessId,
          body.name.trim(),
          body.description?.trim() || null,
          body.icon || null,
          nextOrder,
          body.isActive ?? true,
        ]
      );

      const newCategory: Category = {
        id: categoryId,
        businessId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        icon: body.icon || null,
        order: nextOrder,
        isActive: body.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[Categories API] Category created:', categoryId, newCategory.name);

      return NextResponse.json({
        success: true,
        category: newCategory,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Categories API] Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la categoría' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// ============================================================================
// PUT - Actualizar categoría existente
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse> {
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
    const body: UpdateCategoryRequest = await request.json();
    
    console.log('[Categories API] PUT request for category:', body.id, 'business:', businessId);
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'El ID de la categoría es requerido'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Verify category belongs to this business
      const checkResult = await client.query(
        'SELECT id FROM categories WHERE id = $1 AND "businessId" = $2',
        [body.id, businessId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Categoría no encontrada o no autorizada'
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
        values.push(body.description?.trim() || null);
        paramIndex++;
      }
      if (body.icon !== undefined) {
        updates.push(`icon = $${paramIndex}`);
        values.push(body.icon);
        paramIndex++;
      }
      if (body.order !== undefined) {
        updates.push(`"order" = $${paramIndex}`);
        values.push(body.order);
        paramIndex++;
      }
      if (body.isActive !== undefined) {
        updates.push(`"isActive" = $${paramIndex}`);
        values.push(body.isActive);
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

      const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} AND "businessId" = $${paramIndex + 1}`;
      
      await client.query(query, values);

      // Get updated category
      const result = await client.query(
        `SELECT id, "businessId", name, description, icon, "order", "isActive", "createdAt", "updatedAt"
         FROM categories WHERE id = $1`,
        [body.id]
      );

      const row = result.rows[0];
      const updatedCategory: Category = {
        id: row.id,
        businessId: row.businessId,
        name: row.name || '',
        description: row.description,
        icon: row.icon,
        order: row.order || 0,
        isActive: row.isActive ?? true,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      console.log('[Categories API] Category updated:', updatedCategory.id, updatedCategory.name);

      return NextResponse.json({
        success: true,
        category: updatedCategory,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Categories API] Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la categoría' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// ============================================================================
// DELETE - Eliminar categoría
// ============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
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
    
    console.log('[Categories API] DELETE request for category:', id, 'business:', businessId);
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'El ID de la categoría es requerido'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // First, set categoryId to null for all products in this category
      await client.query(
        'UPDATE products SET "categoryId" = NULL WHERE "categoryId" = $1 AND "businessId" = $2',
        [id, businessId]
      );

      // Verify category belongs to this business and delete
      const result = await client.query(
        'DELETE FROM categories WHERE id = $1 AND "businessId" = $2 RETURNING id, name',
        [id, businessId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Categoría no encontrada o no autorizada'
        }, { status: 404 });
      }

      const deletedCategory = result.rows[0];

      console.log('[Categories API] Category deleted:', deletedCategory.id, deletedCategory.name);

      return NextResponse.json({
        success: true,
        category: deletedCategory,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Categories API] Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la categoría' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
