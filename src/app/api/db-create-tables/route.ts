// Crear tablas en la base de datos Supabase
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL no configurada' }, { status: 500 });
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 30000,
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
      "DO $$ BEGIN CREATE TYPE \"ModuleType\" AS ENUM ('CORE', 'ADDON'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"ModuleStatus\" AS ENUM ('ACTIVE', 'INACTIVE'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"ServiceStatus\" AS ENUM ('ACTIVE', 'INACTIVE'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"OrderType\" AS ENUM ('RESTAURANT', 'DELIVERY'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"OrderStatus\" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"PaymentStatus\" AS ENUM ('PENDING', 'PAID', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"GatewayType\" AS ENUM ('API', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"GatewayMode\" AS ENUM ('SANDBOX', 'PRODUCTION'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
      "DO $$ BEGIN CREATE TYPE \"IntegrationStatus\" AS ENUM ('ACTIVE', 'INACTIVE'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
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
        "currency" "Currency" DEFAULT 'COP',
        period "BillingType" DEFAULT 'MONTHLY',
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

    // Crear tabla users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role "UserRole" DEFAULT 'BUSINESS_ADMIN',
        "businessId" TEXT,
        "resetToken" TEXT,
        "resetTokenExpiry" TIMESTAMP(3),
        avatar TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    `);
    results.push('✅ Tabla users creada');

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
        status "BusinessStatus" DEFAULT 'ACTIVE',
        logo TEXT,
        "primaryColor" TEXT DEFAULT '#8b5cf6',
        "secondaryColor" TEXT DEFAULT '#ffffff',
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("planId") REFERENCES plans(id)
      );
      CREATE INDEX IF NOT EXISTS businesses_slug_idx ON businesses(slug);
      CREATE INDEX IF NOT EXISTS businesses_status_idx ON businesses(status);
    `);
    results.push('✅ Tabla businesses creada');

    // Agregar foreign key de users a businesses
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_businessId_fkey
        FOREIGN KEY ("businessId") REFERENCES businesses(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Crear tabla modules
    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        type "ModuleType" DEFAULT 'ADDON',
        icon TEXT DEFAULT 'puzzle',
        status "ModuleStatus" DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla modules creada');

    // Crear tabla system_services
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_services (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        price DOUBLE PRECISION DEFAULT 0,
        "currency" "Currency" DEFAULT 'COP',
        "billingType" "BillingType" DEFAULT 'MONTHLY',
        status "ServiceStatus" DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla system_services creada');

    // Crear tabla business_modules
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_modules (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessId" TEXT NOT NULL,
        "moduleId" TEXT NOT NULL,
        status "BusinessStatus" DEFAULT 'ACTIVE',
        "assignedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("businessId") REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY ("moduleId") REFERENCES modules(id) ON DELETE CASCADE,
        UNIQUE ("businessId", "moduleId")
      );
    `);
    results.push('✅ Tabla business_modules creada');

    // Crear tabla business_services
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_services (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessId" TEXT NOT NULL,
        "serviceId" TEXT NOT NULL,
        status "BusinessStatus" DEFAULT 'ACTIVE',
        "assignedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("businessId") REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY ("serviceId") REFERENCES system_services(id) ON DELETE CASCADE,
        UNIQUE ("businessId", "serviceId")
      );
    `);
    results.push('✅ Tabla business_services creada');

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
        "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("businessId") REFERENCES businesses(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS categories_businessId_idx ON categories("businessId");
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
        "currency" "Currency" DEFAULT 'COP',
        image TEXT,
        "isAvailable" BOOLEAN DEFAULT true,
        "isFeatured" BOOLEAN DEFAULT false,
        "order" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("businessId") REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS products_businessId_idx ON products("businessId");
      CREATE INDEX IF NOT EXISTS products_categoryId_idx ON products("categoryId");
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
        "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("businessId") REFERENCES businesses(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS menus_slug_idx ON menus(slug);
    `);
    results.push('✅ Tabla menus creada');

    // Crear tabla menu_categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "menuId" TEXT NOT NULL,
        "categoryId" TEXT NOT NULL,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY ("menuId") REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE ("menuId", "categoryId")
      );
    `);
    results.push('✅ Tabla menu_categories creada');

    // Crear tabla orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessId" TEXT NOT NULL,
        "customerId" TEXT,
        "customerName" TEXT NOT NULL,
        "customerPhone" TEXT,
        "customerEmail" TEXT,
        "customerAddress" TEXT,
        "customerNotes" TEXT,
        "orderType" "OrderType" DEFAULT 'RESTAURANT',
        "orderNumber" TEXT UNIQUE NOT NULL,
        subtotal DOUBLE PRECISION DEFAULT 0,
        "deliveryFee" DOUBLE PRECISION DEFAULT 0,
        tax DOUBLE PRECISION DEFAULT 0,
        total DOUBLE PRECISION DEFAULT 0,
        "currency" "Currency" DEFAULT 'COP',
        status "OrderStatus" DEFAULT 'PENDING',
        "paymentStatus" "PaymentStatus" DEFAULT 'PENDING',
        "paymentMethod" TEXT,
        neighborhood TEXT,
        "estimatedDelivery" TEXT,
        "driverName" TEXT,
        "invoiceNumber" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("businessId") REFERENCES businesses(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS orders_businessId_idx ON orders("businessId");
      CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
      CREATE INDEX IF NOT EXISTS orders_orderType_idx ON orders("orderType");
      CREATE INDEX IF NOT EXISTS orders_createdAt_idx ON orders("createdAt");
      CREATE INDEX IF NOT EXISTS orders_orderNumber_idx ON orders("orderNumber");
    `);
    results.push('✅ Tabla orders creada');

    // Crear tabla order_items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        "unitPrice" DOUBLE PRECISION DEFAULT 0,
        "totalPrice" DOUBLE PRECISION DEFAULT 0,
        notes TEXT,
        FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS order_items_orderId_idx ON order_items("orderId");
    `);
    results.push('✅ Tabla order_items creada');

    // Crear tabla integrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        "iconSvg" TEXT DEFAULT '',
        status "IntegrationStatus" DEFAULT 'ACTIVE',
        "requiresManualSetup" BOOLEAN DEFAULT false,
        "setupInstructions" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla integrations creada');

    // Crear tabla business_integrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_integrations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessId" TEXT NOT NULL,
        "integrationId" TEXT NOT NULL,
        config JSONB,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
        FOREIGN KEY ("integrationId") REFERENCES integrations(id) ON DELETE CASCADE,
        UNIQUE ("businessId", "integrationId")
      );
    `);
    results.push('✅ Tabla business_integrations creada');

    // Crear tabla payment_gateways
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        "displayName" TEXT NOT NULL,
        type "GatewayType" NOT NULL,
        enabled BOOLEAN DEFAULT false,
        mode "GatewayMode" DEFAULT 'SANDBOX',
        "publicKey" TEXT,
        "secretKey" TEXT,
        "accountId" TEXT,
        "accountHolder" TEXT,
        "qrCodeUrl" TEXT,
        instructions TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
    `);
    results.push('✅ Tabla payment_gateways creada');

    // Crear tabla activity_logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT,
        "businessId" TEXT,
        action TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT,
        details JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS activity_logs_userId_idx ON activity_logs("userId");
      CREATE INDEX IF NOT EXISTS activity_logs_businessId_idx ON activity_logs("businessId");
      CREATE INDEX IF NOT EXISTS activity_logs_createdAt_idx ON activity_logs("createdAt");
    `);
    results.push('✅ Tabla activity_logs creada');

    client.release();

    return NextResponse.json({
      success: true,
      message: '✅ Todas las tablas han sido creadas exitosamente',
      results,
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
