-- ============================================================
-- VERIFICAR COLUMNAS DE BUSINESSES
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Ver columnas reales de la tabla businesses
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- 2. Ver estructura de un negocio específico
SELECT * FROM businesses LIMIT 1;

-- 3. Ver si existe plan_id o planId
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND (column_name LIKE '%plan%' OR column_name LIKE '%id%');
