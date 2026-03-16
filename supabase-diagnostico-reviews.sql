-- ============================================================
-- DIAGNÓSTICO COMPLETO - ¿POR QUÉ NO APARECE LA PESTAÑA RESEÑAS?
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- Compartir TODOS los resultados con el desarrollador
-- ============================================================

-- ============================================================
-- PASO 1: ¿Existe la tabla business_services?
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('business_services', 'services', 'businesses');

-- Resultado esperado: Deben aparecer las 3 tablas

-- ============================================================
-- PASO 2: ¿Existe el servicio "Reseñas y Fidelización"?
-- ============================================================
SELECT id, name, status, created_at 
FROM services 
WHERE name = 'Reseñas y Fidelización';

-- Resultado esperado: 1 fila con id = UUID

-- ============================================================
-- PASO 3: ¿Cuántos negocios activos hay?
-- ============================================================
SELECT id, name, status, user_id, created_at 
FROM businesses 
WHERE status = 'active';

-- Resultado esperado: 1 o más filas (tus negocios)

-- ============================================================
-- PASO 4: ¿Hay vínculos en business_services?
-- ============================================================
SELECT * FROM business_services;

-- Resultado esperado: 
-- SI ESTÁ VACÍA = PROBLEMA IDENTIFICADO
-- SI TIENE DATOS = Verificar que business_id y service_id sean correctos

-- ============================================================
-- PASO 5: INSERTAR SERVICIO RESEÑAS PARA TODOS LOS NEGOCIOS
-- ============================================================
-- Solo ejecutar si PASO 4 está VACÍO

INSERT INTO business_services (business_id, service_id, status, ai_credits_used, ai_credits_reset_date)
SELECT 
  b.id,
  s.id,
  'active',
  0,
  (NOW() + INTERVAL '30 days')::date
FROM businesses b
CROSS JOIN services s
WHERE s.name = 'Reseñas y Fidelización'
  AND b.status = 'active'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- ============================================================
-- PASO 6: VERIFICAR DESPUÉS DEL INSERT
-- ============================================================
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
ORDER BY b.name;

-- Resultado esperado: 1 fila por negocio con el servicio "Reseñas y Fidelización"

-- ============================================================
-- PASO 7: VERIFICAR POLÍTICAS RLS
-- ============================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'business_services';

-- Resultado esperado: Debería haber políticas para 'authenticated' y 'service_role'

-- ============================================================
-- PASO 8: PROBAR CONSULTA COMO USUARIO AUTENTICADO
-- ============================================================
-- Esta es la consulta exacta que hace BusinessAdminPanel.tsx

-- Reemplaza 'TU_BUSINESS_ID' con el ID de tu negocio del PASO 3
-- Ejemplo: WHERE business_id = '12345678-1234-1234-1234-123456789012'

SELECT service_id, status 
FROM business_services 
WHERE business_id = 'TU_BUSINESS_ID'  -- <-- CAMBIAR ESTO
  AND status = 'active';

-- Resultado esperado: 1 fila con service_id del servicio "Reseñas y Fidelización"

-- ============================================================
-- PASO 9: MENSAJE FINAL
-- ============================================================
DO $$
DECLARE
  total_servicios INTEGER;
  total_negocios INTEGER;
  total_vinculos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_servicios FROM services WHERE status = 'active';
  SELECT COUNT(*) INTO total_negocios FROM businesses WHERE status = 'active';
  SELECT COUNT(*) INTO total_vinculos FROM business_services;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETADO';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Servicios activos: %', total_servicios;
  RAISE NOTICE 'Negocios activos: %', total_negocios;
  RAISE NOTICE 'Vínculos business_services: %', total_vinculos;
  RAISE NOTICE '============================================';
  
  IF total_vinculos = 0 THEN
    RAISE NOTICE '❌ PROBLEMA: business_services está VACÍA';
    RAISE NOTICE 'SOLUCIÓN: Ejecutar PASO 5';
  ELSIF total_vinculos < total_negocios THEN
    RAISE NOTICE '⚠️ PROBLEMA: Hay negocios sin servicios';
    RAISE NOTICE 'Negocios sin servicios: %', (total_negocios - total_vinculos);
    RAISE NOTICE 'SOLUCIÓN: Ejecutar PASO 5';
  ELSE
    RAISE NOTICE '✅ business_services tiene vínculos';
    RAISE NOTICE 'Verificar PASO 8 con el business_id correcto';
  END IF;
  
  RAISE NOTICE '============================================';
END $$;
