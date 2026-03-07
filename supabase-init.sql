-- =============================================
-- MINIMENU - Script de Inicialización (idempotente)
-- =============================================
-- Este script se puede ejecutar múltiples veces sin errores

-- =============================================
-- ENUMS (crear si no existen)
-- =============================================

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BUSINESS_ADMIN', 'STAFF');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_PAYMENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Currency" AS ENUM ('COP', 'USD', 'EUR');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BillingType" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME', 'LIFETIME');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderType" AS ENUM ('RESTAURANT', 'DELIVERY');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLAS (crear si no existen)
-- =============================================

-- Plans
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
  "order" INTEGER DEFAULT 0,
  icon TEXT DEFAULT 'zap',
  color TEXT DEFAULT '#8b5cf6',
  "maxUsers" INTEGER DEFAULT 1,
  "maxProducts" INTEGER DEFAULT 50,
  "maxCategories" INTEGER DEFAULT 5,
  "createdAt" TIMESTAMP(3) DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

-- Businesses
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
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

-- Users
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

-- Categories
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

-- Products
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
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

-- Menus
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

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "menuId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  UNIQUE ("menuId", "categoryId")
);

-- Orders
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
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

-- Order Items
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

-- Payment Gateways
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

-- Activity Logs
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

-- =============================================
-- INSERTAR DATOS INICIALES
-- =============================================

INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic", "maxUsers", "maxProducts", "maxCategories")
SELECT 'Gratis', 'gratis', 'Plan gratuito para comenzar', 0, '50 productos,1 usuario', true, true, 1, 50, 5
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'gratis');

INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic", "maxUsers", "maxProducts", "maxCategories")
SELECT 'Básico', 'basico', 'Plan básico', 29000, '200 productos,3 usuarios', true, true, 3, 200, 10
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'basico');

INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic", "isPopular", "maxUsers", "maxProducts", "maxCategories")
SELECT 'Pro', 'pro', 'Plan profesional', 59000, 'Productos ilimitados,10 usuarios', true, true, true, 10, 999999, 999
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'pro');
