// =============================================
// MINIMENU - Business Init API
// =============================================
// Inicializa datos limpios para un nuevo negocio

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  // Obtener businessId de la sesión
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  let session;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Sesión inválida' },
      { status: 401 }
    );
  }

  const businessId = session.businessId;

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'Usuario sin negocio asociado' },
      { status: 400 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();

    try {
      // Verificar si ya tiene categorías
      const categoriesResult = await client.query(
        'SELECT COUNT(*)::int as count FROM categories WHERE "businessId" = $1',
        [businessId]
      );

      const existingCategories = categoriesResult.rows[0]?.count || 0;

      if (existingCategories > 0) {
        return NextResponse.json({
          success: true,
          message: 'El negocio ya tiene datos inicializados',
          data: {
            categories: existingCategories,
          },
        });
      }

      // Crear categorías de ejemplo
      const categories = [
        { name: 'Entradas', icon: '🥗', order: 1 },
        { name: 'Platos Principales', icon: '🍽️', order: 2 },
        { name: 'Bebidas', icon: '🥤', order: 3 },
        { name: 'Postres', icon: '🍰', order: 4 },
      ];

      const createdCategories: { id: string; name: string }[] = [];

      for (const cat of categories) {
        const idResult = await client.query('SELECT gen_random_uuid() as id');
        const catId = idResult.rows[0].id;

        await client.query(
          `INSERT INTO categories (id, "businessId", name, icon, "order", "isActive")
           VALUES ($1, $2, $3, $4, $5, true)`,
          [catId, businessId, cat.name, cat.icon, cat.order]
        );

        createdCategories.push({ id: catId, name: cat.name });
      }

      // Crear algunos productos de ejemplo
      const products = [
        { name: 'Empanadas (4 uds)', description: 'Crujientes empanadas', price: 12000, categoryId: createdCategories[0]?.id, featured: true },
        { name: 'Bandeja Paisa', description: 'Tradicional bandeja paisa', price: 35000, categoryId: createdCategories[1]?.id, featured: true },
        { name: 'Limonada Natural', description: 'Refrescante limonada', price: 5000, categoryId: createdCategories[2]?.id, featured: false },
      ];

      for (const prod of products) {
        if (!prod.categoryId) continue;

        const idResult = await client.query('SELECT gen_random_uuid() as id');
        const prodId = idResult.rows[0].id;

        await client.query(
          `INSERT INTO products (id, "businessId", "categoryId", name, description, price, "isAvailable", "isFeatured", "order")
           VALUES ($1, $2, $3, $4, $5, $6, true, $7, 0)`,
          [prodId, businessId, prod.categoryId, prod.name, prod.description, prod.price, prod.featured]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Datos inicializados correctamente',
        data: {
          categories: createdCategories.length,
          products: products.length,
        },
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Business Init API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al inicializar datos' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
