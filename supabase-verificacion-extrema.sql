-- ============================================================
-- VERIFICACIÓN EXTREMA - ¿POR QUÉ NO FUNCIONA?
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- COMPARTIR TODOS LOS RESULTADOS (screenshots o texto)
-- ============================================================

-- ============================================================
-- 1. ¿EXISTE LA TABLA business_services?
-- ============================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'business_services';

-- DEBE MOSTRAR: business_services | BASE TABLE

-- ============================================================
-- 2. ¿EXISTE LA TABLA services?
-- ============================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'services';

-- DEBE MOSTRAR: services | BASE TABLE

-- ============================================================
-- 3. ¿EXISTE LA TABLA businesses?
-- ============================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'businesses';

-- DEBE MOSTRAR: businesses | BASE TABLE

-- ============================================================
-- 4. VER TODOS LOS SERVICIOS EXISTENTES
-- ============================================================
SELECT 
  id,
  name,
  status,
  created_at
FROM services
ORDER BY created_at;

-- DEBE MOSTRAR AL MENOS: "Reseñas y Fidelización" con status = 'active'

-- ============================================================
-- 5. VER TODOS LOS NEGOCIOS EXISTENTES
-- ============================================================
SELECT 
  id,
  name,
  status,
  user_id,
  created_at
FROM businesses
ORDER BY created_at;

-- COPIA EL "id" DE TU NEGOCIO PARA EL SIGUIENTE PASO

-- ============================================================
-- 6. ¿HAY DATOS EN business_services?
-- ============================================================
SELECT 
  id,
  business_id,
  service_id,
  status,
  created_at
FROM business_services
ORDER BY created_at DESC;

-- SI ESTÁ VACÍO = EJECUTAR PASO 7
-- SI TIENE DATOS = VERIFICAR QUE business_id Y service_id SEAN CORRECTOS

-- ============================================================
-- 7. INSERTAR SERVICIO PARA TU NEGOCIO ESPECÍFICO
-- ============================================================
-- REEMPLAZA 'TU_BUSINESS_ID' CON EL ID DEL PASO 5
-- REEMPLAZA 'TU_SERVICE_ID' CON EL ID DEL PASO 4

-- Ejemplo:
-- INSERT INTO business_services (business_id, service_id, status)
-- VALUES ('12345678-1234-1234-1234-123456789012', '87654321-4321-4321-4321-210987654321', 'active');

-- PARA INSERTAR AUTOMÁTICO (si hay 1 negocio y 1 servicio):
INSERT INTO business_services (business_id, service_id, status, ai_credits_used, ai_credits_reset_date)
SELECT 
  (SELECT id FROM businesses WHERE status = 'active' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Reseñas y Fidelización' LIMIT 1),
  'active',
  0,
  (NOW() + INTERVAL '30 days')::date
WHERE EXISTS (SELECT 1 FROM businesses WHERE status = 'active')
  AND EXISTS (SELECT 1 FROM services WHERE name = 'Reseñas y Fidelización')
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- ============================================================
-- 8. VERIFICAR DESPUÉS DEL INSERT
-- ============================================================
SELECT 
  bs.id as vinculo_id,
  bs.business_id,
  b.name as negocio,
  bs.service_id,
  s.name as servicio,
  bs.status,
  bs.created_at
FROM business_services bs
JOIN businesses b ON bs.business_id = b.id
JOIN services s ON bs.service_id = s.id
ORDER BY bs.created_at DESC;

-- DEBE MOSTRAR: 1 fila con tu negocio y "Reseñas y Fidelización"

-- ============================================================
-- 9. PROBAR CONSULTA EXACTA DEL BUSINESSADMINPANEL
-- ============================================================
-- Esta es la consulta EXACTA que hace el código TypeScript

SELECT service_id, status 
FROM business_services 
WHERE business_id = (SELECT id FROM businesses WHERE status = 'active' LIMIT 1)
  AND status = 'active';

-- DEBE MOSTRAR: 1 fila con el service_id

-- ============================================================
-- 10. VERIFICAR POLÍTICAS RLS
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual IS NOT NULL as has_qual,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'business_services'
ORDER BY policyname;

-- DEBE MOSTRAR políticas para 'authenticated' y 'service_role'

-- ============================================================
-- 11. ¿RLS ESTÁ HABILITADO?
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'business_services';

-- DEBE MOSTRAR: t (true)

-- ============================================================
-- 12. MENSAJE FINAL DE DIAGNÓSTICO
-- ============================================================
DO $$
DECLARE
  tabla_bs_existe BOOLEAN;
  tabla_services_existe BOOLEAN;
  tabla_businesses_existe BOOLEAN;
  servicio_existe BOOLEAN;
  negocio_existe BOOLEAN;
  total_vinculos INTEGER;
  servicio_activo BOOLEAN;
BEGIN
  -- Verificar tablas
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'business_services'
  ) INTO tabla_bs_existe;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'services'
  ) INTO tabla_services_existe;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'businesses'
  ) INTO tabla_businesses_existe;
  
  -- Verificar servicio
  SELECT EXISTS (
    SELECT FROM services WHERE name = 'Reseñas y Fidelización'
  ) INTO servicio_existe;
  
  -- Verificar negocio
  SELECT EXISTS (
    SELECT FROM businesses WHERE status = 'active'
  ) INTO negocio_existe;
  
  -- Verificar vínculos
  SELECT COUNT(*) INTO total_vinculos FROM business_services;
  
  -- Verificar si hay servicio activo para algún negocio
  SELECT EXISTS (
    SELECT FROM business_services bs
    JOIN services s ON bs.service_id = s.id
    WHERE s.name = 'Reseñas y Fidelización'
    AND bs.status = 'active'
  ) INTO servicio_activo;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO EXTREMO COMPLETADO';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tabla business_services existe: %', tabla_bs_existe;
  RAISE NOTICE 'Tabla services existe: %', tabla_services_existe;
  RAISE NOTICE 'Tabla businesses existe: %', tabla_businesses_existe;
  RAISE NOTICE 'Servicio "Reseñas" existe: %', servicio_existe;
  RAISE NOTICE 'Negocio activo existe: %', negocio_existe;
  RAISE NOTICE 'Total vínculos business_services: %', total_vinculos;
  RAISE NOTICE 'Servicio "Reseñas" activo para negocio: %', servicio_activo;
  RAISE NOTICE '============================================';
  
  IF NOT tabla_bs_existe THEN
    RAISE NOTICE '❌ ERROR CRÍTICO: Tabla business_services NO EXISTE';
    RAISE NOTICE 'SOLUCIÓN: Ejecutar supabase-activacion-completa.sql';
  ELSIF NOT servicio_existe THEN
    RAISE NOTICE '❌ ERROR: Servicio "Reseñas y Fidelización" NO EXISTE';
    RAISE NOTICE 'SOLUCIÓN: Ejecutar supabase-activacion-completa.sql';
  ELSIF NOT negocio_existe THEN
    RAISE NOTICE '❌ ERROR: No hay negocios activos';
    RAISE NOTICE 'SOLUCIÓN: Crear un negocio primero';
  ELSIF total_vinculos = 0 THEN
    RAISE NOTICE '❌ ERROR: business_services está VACÍA';
    RAISE NOTICE 'SOLUCIÓN: Ejecutar PASO 7 de este script';
  ELSIF NOT servicio_activo THEN
    RAISE NOTICE '❌ ERROR: Servicio "Reseñas" no está activo para ningún negocio';
    RAISE NOTICE 'SOLUCIÓN: Ejecutar PASO 7 de este script';
  ELSE
    RAISE NOTICE '✅ TODO CORRECTO - El problema puede ser de RLS o del frontend';
    RAISE NOTICE 'REVISAR: Políticas RLS en PASO 10';
  END IF;
  
  RAISE NOTICE '============================================';
END $$;
