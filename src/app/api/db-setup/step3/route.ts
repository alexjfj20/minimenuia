// Crear tablas - Paso 3: Órdenes y tablas adicionales
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
        "orderType" TEXT DEFAULT 'RESTAURANT',
        "orderNumber" TEXT UNIQUE NOT NULL,
        subtotal DOUBLE PRECISION DEFAULT 0,
        "deliveryFee" DOUBLE PRECISION DEFAULT 0,
        tax DOUBLE PRECISION DEFAULT 0,
        total DOUBLE PRECISION DEFAULT 0,
        "currency" TEXT DEFAULT 'COP',
        status TEXT DEFAULT 'PENDING',
        "paymentStatus" TEXT DEFAULT 'PENDING',
        "paymentMethod" TEXT,
        neighborhood TEXT,
        "estimatedDelivery" TEXT,
        "driverName" TEXT,
        "invoiceNumber" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) DEFAULT NOW()
      );
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
        notes TEXT
      );
    `);
    results.push('✅ Tabla order_items creada');

    // Crear tabla payment_gateways
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        "displayName" TEXT NOT NULL,
        type TEXT NOT NULL,
        enabled BOOLEAN DEFAULT false,
        mode TEXT DEFAULT 'SANDBOX',
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
    `);
    results.push('✅ Tabla activity_logs creada');

    // Crear índices
    try {
      await client.query('CREATE INDEX IF NOT EXISTS orders_businessId_idx ON orders("businessId")');
      await client.query('CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)');
      await client.query('CREATE INDEX IF NOT EXISTS order_items_orderId_idx ON order_items("orderId")');
      results.push('✅ Índices creados');
    } catch {
      results.push('ℹ️ Índices ya existen');
    }

    client.release();

    return NextResponse.json({
      success: true,
      message: '✅ Paso 3 completado: Todas las tablas han sido creadas',
      results,
      complete: true,
      nextStep: 'Visita /api/db/init para verificar la base de datos',
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
