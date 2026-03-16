-- ============================================================
-- CORREGIR SERVICE_ID EN business_services
-- ============================================================
-- El service_id en business_services no coincide con el ID real
-- en la tabla services. Este script lo corrige.
-- ============================================================

-- ============================================================
-- PASO 1: VERIFICAR IDs ACTUALES
-- ============================================================

-- Verificar el ID correcto del servicio "IA para Catálogo"
SELECT id, name, status 
FROM public.services 
WHERE name = 'IA para Catálogo';

-- Verificar qué service_id está guardado en business_services
SELECT 
  bs.business_id,
  bs.service_id as service_id_actual,
  b.name as business_name
FROM public.business_services bs
JOIN public.businesses b ON bs.business_id = b.id
WHERE bs.service_id = 'fba81f12-7de1-44d2-9db0-4db323cf7458';

-- ============================================================
-- PASO 2: CORREGIR EL service_id
-- ============================================================

-- Actualizar el service_id en business_services al ID correcto
UPDATE public.business_services
SET service_id = (
  SELECT id FROM public.services WHERE name = 'IA para Catálogo'
)
WHERE service_id = 'fba81f12-7de1-44d2-9db0-4db323cf7458';

-- ============================================================
-- PASO 3: VERIFICAR CORRECCIÓN
-- ============================================================

-- Verificar que la corrección funcionó
SELECT 
  bs.id,
  bs.business_id,
  bs.service_id,
  bs.status,
  b.name as business_name,
  s.name as service_name
FROM public.business_services bs
JOIN public.businesses b ON bs.business_id = b.id
JOIN public.services s ON bs.service_id = s.id
WHERE b.name LIKE '%Restaurante el sabor casero%'
OR b.slug = 'menudehoy';

-- ============================================================
-- LISTO - AHORA DEBERÍA FUNCIONAR
-- ============================================================
