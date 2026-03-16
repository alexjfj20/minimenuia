-- ============================================================
-- VERIFICAR ASIGNACIÓN DE SERVICIOS
-- ============================================================
-- Este script verifica si el servicio "IA para Catálogo" está 
-- correctamente asignado al negocio "Restaurante el sabor casero"
-- ============================================================

-- ============================================================
-- PASO 1: OBTENER ID DEL NEGOCIO
-- ============================================================

SELECT id, name, slug, status 
FROM public.businesses 
WHERE name LIKE '%Restaurante el sabor casero%'
OR slug = 'menudehoy';

-- ============================================================
-- PASO 2: OBTENER ID DEL SERVICIO IA
-- ============================================================

SELECT id, name, status 
FROM public.services 
WHERE name = 'IA para Catálogo';

-- ============================================================
-- PASO 3: VERIFICAR ASIGNACIÓN EN business_services
-- ============================================================

SELECT 
  bs.id,
  bs.business_id,
  bs.service_id,
  bs.status,
  bs.ai_credits_used,
  bs.ai_credits_reset_date,
  bs.created_at,
  b.name as business_name,
  s.name as service_name
FROM public.business_services bs
JOIN public.businesses b ON bs.business_id = b.id
JOIN public.services s ON bs.service_id = s.id
WHERE b.name LIKE '%Restaurante el sabor casero%'
OR b.slug = 'menudehoy';

-- ============================================================
-- PASO 4: SI NO EXISTE LA ASIGNACIÓN, CREARLA MANUALMENTE
-- ============================================================

-- Reemplazar los UUIDs con los valores reales de los pasos 1 y 2
-- INSERT INTO public.business_services (business_id, service_id, status, ai_credits_used, ai_credits_reset_date, created_at)
-- VALUES (
--   'UUID_DEL_NEGOCIO',  -- Reemplazar con el ID del Paso 1
--   'UUID_DEL_SERVICIO',  -- Reemplazar con el ID del Paso 2
--   'active',
--   0,
--   NOW() + INTERVAL '30 days',
--   NOW()
-- )
-- ON CONFLICT (business_id, service_id) DO UPDATE SET
--   status = 'active',
--   updated_at = NOW();

-- ============================================================
-- PASO 5: VERIFICAR DATOS DEL USUARIO ADMIN
-- ============================================================

-- Verificar qué businessId tiene el usuario admin
SELECT 
  u.id,
  u.email,
  u.name,
  u."businessId",
  b.name as business_name
FROM public.users u
LEFT JOIN public.businesses b ON u."businessId" = b.id
WHERE u.email LIKE '%auditsemseo@gmail.com%';

-- ============================================================
-- LISTO - COPIAR Y PEGAR LOS RESULTADOS
-- ============================================================
