-- ============================================================
-- DIAGNÓSTICO COMPLETO - BUSINESS_SERVICES
-- ============================================================
-- Ejecutar este script en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASO 1: VERIFICAR TABLA BUSINESS_SERVICES
-- ============================================================

-- Verificar si existe la tabla
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'business_services';

-- Verificar qué hay en business_services
SELECT * FROM business_services;

-- ============================================================
-- PASO 2: VERIFICAR NEGOCIOS ACTIVOS
-- ============================================================

-- Ver IDs de negocios activos
SELECT id, name, status, created_at 
FROM businesses 
WHERE status = 'active'
ORDER BY created_at DESC;

-- Contar negocios activos
SELECT COUNT(*) as total_negocios_activos 
FROM businesses 
WHERE status = 'active';

-- ============================================================
-- PASO 3: VERIFICAR SERVICIOS
-- ============================================================

-- Ver IDs de servicios
SELECT id, name, status, created_at 
FROM services
ORDER BY created_at DESC;

-- Verificar servicio "IA para Catálogo"
SELECT id, name, status 
FROM services 
WHERE name = 'IA para Catálogo';

-- Verificar servicio "Reseñas y Fidelización"
SELECT id, name, status 
FROM services 
WHERE name = 'Reseñas y Fidelización';

-- ============================================================
-- PASO 4: INSERTAR VÍNCULOS PARA TODOS LOS NEGOCIOS
-- ============================================================

-- Insertar servicio "IA para Catálogo" para todos los negocios activos
INSERT INTO business_services (business_id, service_id, status, created_at, updated_at)
SELECT 
  b.id,
  s.id,
  'active',
  NOW(),
  NOW()
FROM businesses b
CROSS JOIN services s
WHERE s.name = 'IA para Catálogo'
  AND b.status = 'active'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- Insertar servicio "Reseñas y Fidelización" para todos los negocios activos
INSERT INTO business_services (business_id, service_id, status, created_at, updated_at)
SELECT 
  b.id,
  s.id,
  'active',
  NOW(),
  NOW()
FROM businesses b
CROSS JOIN services s
WHERE s.name = 'Reseñas y Fidelización'
  AND b.status = 'active'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- ============================================================
-- PASO 5: VERIFICAR RESULTADO
-- ============================================================

-- Verificar que se insertaron los registros
SELECT 
  bs.id,
  bs.business_id,
  b.name as business_name,
  bs.service_id,
  s.name as service_name,
  bs.status,
  bs.created_at
FROM business_services bs
JOIN businesses b ON bs.business_id = b.id
JOIN services s ON bs.service_id = s.id
ORDER BY b.name, s.name;

-- Contar registros por servicio
SELECT 
  s.name as servicio,
  COUNT(bs.id) as total_negocios
FROM business_services bs
JOIN services s ON bs.service_id = s.id
GROUP BY s.name
ORDER BY s.name;

-- ============================================================
-- LISTO - AHORA DEBERÍAN APARECER LAS PESTAÑAS
-- ============================================================
