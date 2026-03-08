// Crear tablas - Paso 1: Enums y tablas básicas
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

    // Crear enum types
    const enums = [
      "DO $$ BEGIN CREATE TYPE \"UserRole\" AS ENUM ('SUPER_ADMIN', 'BUSINESS_ADMIN', 'STAFF'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"BusinessStatus\" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_PAYMENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"Currency\" AS ENUM ('COP', 'USD', 'EUR'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"BillingType\" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME', 'LIFETIME'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"OrderType\" AS ENUM ('RESTAURANT', 'DELIVERY'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"OrderStatus\" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"PaymentStatus\" AS ENUM ('PENDING', 'PAID', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
    ];

    for (const sql of enums) {
      await client.query(sql);
    }
    results.push('✅ Enums creados');

    // Crear tabla plans
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price DOUBLE PRECISION DEFAULT 0,
        "currency" TEXT DEFAULT 'COP',
        period TEXT DEFAULT 'MONTHLY',
        features TEXT DEFAULT '',
        "isActive" BOOLEAN DEFAULT true,
        "isPublic" BOOLEAN DEFAULT true,
        "isPopular" BOOLEAN DEFAULT false,
        order INTEGER DEFAULT 0,
        icon TEXT DEFAULT 'zap',
        color TEXT DEFAULT '#8b5cf6',
        "maxUsers" INTEGER DEFAULT 1,
        "maxProducts" INTEGER DEFAULT 50,
        "maxCategories" INTEGER DEFAULT 5,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla plans creada');

    // Crear tabla businesses
    await client.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        "ownerId" TEXT NOT NULL,
        "ownerName" TEXT NOT NULL,
        "ownerEmail" TEXT NOT NULL,
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        "planId" TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        logo TEXT,
        "primaryColor" TEXT DEFAULT '#8b5cf6',
        "secondaryColor" TEXT DEFAULT '#ffffff',
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla businesses creada');

    // Crear tabla users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'BUSINESS_ADMIN',
        "businessId" TEXT,
        "resetToken" TEXT,
        "resetTokenExpiry" TIMESTAMP(3),
        avatar TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla users creada');

    // Insertar plan gratuito por defecto
    const existingPlan = await client.query("SELECT id FROM plans WHERE slug = 'gratis'");
    if (existingPlan.rows.length === 0) {
      await client.query(`
        INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic")
        VALUES ('Gratis', 'gratis', 'Plan gratuito para comenzar', 0, '50 productos,1 usuario', true, true)
      `);
      results.push('✅ Plan gratuito insertado');
    } else {
      results.push('ℹ️ Plan gratuito ya existe');
    }

    client.release();

    return NextResponse.json({
      success: true,
      message: '✅ Paso 1 completado: Enums y tablas básicas creadas',
      results,
      nextStep: 'Visita /api/db-setup/step2 para crear las tablas de productos y órdenes',
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
