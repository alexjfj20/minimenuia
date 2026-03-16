-- ============================================================
-- PRUEBA DIRECTA - CONSULTA .in()
-- ============================================================
-- Este script prueba exactamente la misma consulta que hace
-- el frontend para verificar si funciona correctamente
-- ============================================================

-- ============================================================
-- PASO 1: PROBAR CONSULTA CON EL service_id ESPECÍFICO
-- ============================================================

-- Esta es la consulta exacta que hace el frontend
SELECT id, name
FROM public.services
WHERE id IN ('fba81f12-7de1-44d2-9db0-4db323cf7458');

-- ============================================================
-- PASO 2: PROBAR CONSULTA CON TODOS LOS SERVICIOS ACTIVOS
-- ============================================================

-- Verificar todos los servicios activos
SELECT id, name, status
FROM public.services
WHERE status = 'active';

-- ============================================================
-- PASO 3: PROBAR CONSULTA COMPLETA DEL FLUJO
-- ============================================================

-- Esta es la consulta completa que hace el frontend
WITH business_services_cte AS (
  SELECT service_id, status
  FROM public.business_services
  WHERE business_id = 'a10d1da3-0423-474a-bd90-f0190757aa02'
  AND status = 'active'
)
SELECT s.id, s.name
FROM business_services_cte bs
JOIN public.services s ON s.id = bs.service_id;

-- ============================================================
-- LISTO - COPIAR Y PEGAR LOS RESULTADOS
-- ============================================================
