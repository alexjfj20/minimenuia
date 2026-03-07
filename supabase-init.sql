-- =============================================
-- MINIMENU - Script de Inicialización de Base de Datos
-- =============================================
-- Ejecuta este script en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zobvdpegchzgwntemzou/sql

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BUSINESS_ADMIN', 'STAFF');
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_PAYMENT');
CREATE TYPE "Currency" AS ENUM ('COP', 'USD', 'EUR');
CREATE TYPE "BillingType" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME', 'LIFETIME');
CREATE TYPE "OrderType" AS ENUM ('RESTAURANT', 'DELIVERY');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- Plans
CREATE TABLE plans (
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

-- Businesses
CREATE TABLE businesses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "ownerId" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  "planId" TEXT NOT NULL REFERENCES plans(id),
  status "BusinessStatus" DEFAULT 'ACTIVE',
  logo TEXT,
  "primaryColor" TEXT DEFAULT '#8b5cf6',
  "secondaryColor" TEXT DEFAULT '#ffffff',
  "createdAt" TIMESTAMP(3) DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

CREATE INDEX businesses_slug_idx ON businesses(slug);

-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role "UserRole" DEFAULT 'BUSINESS_ADMIN',
  "businessId" TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  "resetToken" TEXT,
  "resetTokenExpiry" TIMESTAMP(3),
  avatar TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users(email);

-- Categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessId" TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

CREATE INDEX categories_businessId_idx ON categories("businessId");

-- Products
CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessId" TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  "categoryId" TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
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

CREATE INDEX products_businessId_idx ON products("businessId");
CREATE INDEX products_categoryId_idx ON products("categoryId");

-- Menus
CREATE TABLE menus (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessId" TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "qrCode" TEXT,
  slug TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

CREATE INDEX menus_slug_idx ON menus(slug);

-- Menu Categories
CREATE TABLE menu_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "menuId" TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  "categoryId" TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  UNIQUE ("menuId", "categoryId")
);

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessId" TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
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

CREATE INDEX orders_businessId_idx ON orders("businessId");
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_orderType_idx ON orders("orderType");
CREATE INDEX orders_createdAt_idx ON orders("createdAt");
CREATE INDEX orders_orderNumber_idx ON orders("orderNumber");

-- Order Items
CREATE TABLE order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  "unitPrice" DOUBLE PRECISION DEFAULT 0,
  "totalPrice" DOUBLE PRECISION DEFAULT 0,
  notes TEXT
);

CREATE INDEX order_items_orderId_idx ON order_items("orderId");

-- Payment Gateways
CREATE TABLE payment_gateways (
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
CREATE TABLE activity_logs (
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

CREATE INDEX activity_logs_userId_idx ON activity_logs("userId");
CREATE INDEX activity_logs_businessId_idx ON activity_logs("businessId");
CREATE INDEX activity_logs_createdAt_idx ON activity_logs("createdAt");

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Plan Gratuito
INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic", "maxUsers", "maxProducts", "maxCategories")
VALUES ('Gratis', 'gratis', 'Plan gratuito para comenzar', 0, '50 productos,1 usuario,Soporte por email', true, true, 1, 50, 5);

-- Plan Básico
INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic", "maxUsers", "maxProducts", "maxCategories")
VALUES ('Básico', 'basico', 'Plan básico para negocios en crecimiento', 29000, '200 productos,3 usuarios,Soporte prioritario', true, true, 3, 200, 10);

-- Plan Pro
INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic", "isPopular", "maxUsers", "maxProducts", "maxCategories")
VALUES ('Pro', 'pro', 'Plan profesional para negocios establecidos', 59000, 'Productos ilimitados,10 usuarios,Soporte 24/7', true, true, true, 10, 999999, 999);

-- =============================================
-- ¡LISTO!
-- =============================================
-- La base de datos está configurada.
-- Ahora visita: https://minimenuia.vercel.app/api/db/init
