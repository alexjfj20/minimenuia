-- ============================================================
-- LIMPIAR payment_gateway - Mantener solo 1 fila
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Ver CUÁNTAS filas hay
SELECT COUNT(*) as total_filas FROM payment_gateway;

-- 2. Ver TODAS las filas con sus IDs
SELECT id, created_at, updated_at FROM payment_gateway ORDER BY created_at;

-- 3. Eliminar TODAS las filas excepto la más reciente
DELETE FROM payment_gateway 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id 
    FROM payment_gateway 
    ORDER BY updated_at DESC 
    LIMIT 1
  ) as subquery
);

-- 4. Verificar que solo quede 1 fila
SELECT COUNT(*) as total_filas FROM payment_gateway;

-- 5. Verificar la fila restante
SELECT 
  id, 
  hotmart_enabled, 
  hotmart_instructions,
  updated_at 
FROM payment_gateway;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
