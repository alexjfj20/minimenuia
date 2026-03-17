-- ============================================================
-- VERIFICAR Y ACTIVAR PLANES EN SUPABASE
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Ver todos los planes y su estado
SELECT 
  id,
  name,
  slug,
  price,
  isActive,
  isPublic,
  isPopular,
  "order",
  created_at
FROM plans
ORDER BY "order";

-- 2. Activar TODOS los planes (si están desactivados)
UPDATE plans 
SET 
  isActive = true,
  isPublic = true,
  updated_at = NOW()
WHERE isActive = false OR isPublic = false;

-- 3. Verificar después de actualizar
SELECT 
  id,
  name,
  isActive,
  isPublic
FROM plans
ORDER BY "order";

-- 4. Si no hay planes, INSERTAR planes por defecto
INSERT INTO plans (id, name, slug, description, price, currency, period, features, isActive, isPublic, isPopular, "order", icon, color, maxUsers, maxProducts, maxCategories)
SELECT 
  gen_random_uuid(),
  'Gratis',
  'gratis',
  'Para comenzar',
  0,
  'COP',
  'monthly',
  '1 Usuario
50 Productos
5 Categorías
Menú digital con QR
Pedidos por WhatsApp',
  true,
  true,
  false,
  1,
  'zap',
  '#8b5cf6',
  1,
  50,
  5
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'gratis');

INSERT INTO plans (id, name, slug, description, price, currency, period, features, isActive, isPublic, isPopular, "order", icon, color, maxUsers, maxProducts, maxCategories)
SELECT 
  gen_random_uuid(),
  'Básico',
  'basico',
  'Para pequeños negocios',
  29000,
  'COP',
  'monthly',
  '3 Usuarios
200 Productos
15 Categorías
Branding personalizado
Soporte prioritario',
  true,
  true,
  false,
  2,
  'package',
  '#06b6d4',
  3,
  200,
  15
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'basico');

INSERT INTO plans (id, name, slug, description, price, currency, period, features, isActive, isPublic, isPopular, "order", icon, color, maxUsers, maxProducts, maxCategories)
SELECT 
  gen_random_uuid(),
  'Profesional',
  'profesional',
  'Para negocios en crecimiento',
  59000,
  'COP',
  'monthly',
  '10 Usuarios
Productos ilimitados
Múltiples sedes
Analíticas avanzadas
Soporte 24/7',
  true,
  true,
  true,
  3,
  'star',
  '#8b5cf6',
  10,
  9999,
  999
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'profesional');

-- 5. Verificación final
SELECT 
  name,
  price,
  isActive,
  isPublic,
  isPopular
FROM plans
ORDER BY "order";
