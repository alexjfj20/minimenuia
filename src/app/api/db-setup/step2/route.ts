// Crear tablas - Paso 2: Categorías, Productos y Menús
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL no configurada' }, { status: 500 });
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  const results: string[] = [];

  try {
    const client = await pool.connect();

    // Crear tabla categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessId" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        "order" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla categories creada');

    // Crear tabla products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessId" TEXT NOT NULL,
        "categoryId" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price DOUBLE PRECISION DEFAULT 0,
        "currency" TEXT DEFAULT 'COP',
        image TEXT,
        "isAvailable" BOOLEAN DEFAULT true,
        "isFeatured" BOOLEAN DEFAULT false,
        "order" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla products creada');

    // Crear tabla menus
    await client.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessId" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "qrCode" TEXT,
        slug TEXT UNIQUE NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla menus creada');

    // Crear tabla menu_categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "menuId" TEXT NOT NULL,
        "categoryId" TEXT NOT NULL,
        "order" INTEGER DEFAULT 0,
        UNIQUE ("menuId", "categoryId")
      );
    `);
    results.push('✅ Tabla menu_categories creada');

    client.release();

    return NextResponse.json({
      success: true,
      message: '✅ Paso 2 completado: Tablas de productos y menús creadas',
      results,
      nextStep: 'Visita /api/db-setup/step3 para crear las tablas de órdenes',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
      results,
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
