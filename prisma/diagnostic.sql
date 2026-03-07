-- =============================================
-- MINIMENU - Diagnóstico de Base de Datos
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Verificar si las tablas principales existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'plans', 'businesses', 'orders', 'products', 'categories')
ORDER BY table_name;

-- 2. Ver estructura de la tabla plans
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- 3. Verificar si ya existe algún plan
SELECT * FROM plans LIMIT 5;

-- 4. Verificar si ya existe algún usuario
SELECT id, email, name, role FROM users LIMIT 5;
