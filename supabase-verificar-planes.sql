-- ============================================================
-- VERIFICAR ESTRUCTURA DE TABLA PLANS
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Ver columnas de la tabla plans
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- 2. Ver planes existentes
SELECT 
  id,
  name,
  slug,
  description,
  price,
  currency,
  period,
  features,
  isActive,
  isPublic,
  isPopular,
  "order",
  icon,
  color,
  maxUsers,
  maxProducts,
  maxCategories,
  created_at
FROM plans
ORDER BY "order";

-- 3. Ver negocios y sus planes
SELECT 
  b.id,
  b.name as negocio,
  b.plan_id,
  b.plan_name,
  b.status,
  p.name as plan_actual
FROM businesses b
LEFT JOIN plans p ON b.plan_id = p.id
ORDER BY b.name;
