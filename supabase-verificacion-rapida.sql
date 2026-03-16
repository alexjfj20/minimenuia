-- ============================================================
-- VERIFICACIÓN RÁPIDA - ¿POR QUÉ NO FUNCIONA EL TOGGLE?
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. ¿Existe el servicio "Reseñas y Fidelización"?
SELECT id, name, status FROM services WHERE name = 'Reseñas y Fidelización';

-- 2. ¿Cuántos negocios activos hay?
SELECT COUNT(*) as total_negocios FROM businesses WHERE status = 'active';

-- 3. ¿Cuántos registros hay en business_services?
SELECT COUNT(*) as total_vinculos FROM business_services;

-- 4. Ver TODOS los registros de business_services
SELECT * FROM business_services;

-- 5. Ver vínculos para el servicio "Reseñas y Fidelización"
SELECT 
  bs.business_id,
  b.name as negocio,
  bs.service_id,
  s.name as servicio,
  bs.status
FROM business_services bs
JOIN businesses b ON bs.business_id = b.id
JOIN services s ON bs.service_id = s.id
WHERE s.name = 'Reseñas y Fidelización';

-- 6. Si está VACÍO, INSERTAR para todos los negocios activos
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

-- 7. Verificar después del INSERT
SELECT 
  bs.business_id,
  b.name as negocio,
  bs.service_id,
  s.name as servicio,
  bs.status,
  bs.created_at
FROM business_services bs
JOIN businesses b ON bs.business_id = b.id
JOIN services s ON bs.service_id = s.id
WHERE s.name = 'Reseñas y Fidelización'
ORDER BY b.name;
