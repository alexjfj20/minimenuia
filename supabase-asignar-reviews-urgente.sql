-- ============================================================
-- ASIGNAR SERVICIO "RESEÑAS Y FIDELIZACIÓN" A TODOS LOS NEGOCIOS
-- ============================================================
-- SCRIPT DE EMERGENCIA - Solo para desbloquear la funcionalidad
-- Ejecutar en: Supabase SQL Editor
-- ============================================================
-- ADVERTENCIA: Esto asigna el servicio a TODOS los negocios.
-- Para control granular, usar los toggles en Super Admin → Negocios
-- ============================================================

-- 1. Verificar que existe el servicio "Reseñas y Fidelización"
SELECT id, name, status 
FROM services 
WHERE name = 'Reseñas y Fidelización';

-- 2. Verificar negocios activos
SELECT id, name, status 
FROM businesses 
WHERE status = 'active';

-- 3. Asignar servicio "Reseñas y Fidelización" a todos los negocios activos
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

-- 4. Verificar resultado
SELECT 
  bs.id,
  b.name as business_name,
  s.name as service_name,
  bs.status,
  bs.created_at
FROM business_services bs
JOIN businesses b ON bs.business_id = b.id
JOIN services s ON bs.service_id = s.id
WHERE s.name = 'Reseñas y Fidelización'
ORDER BY b.name;

-- ============================================================
-- LISTO - AHORA DEBERÍA APARECER LA PESTAÑA "RESEÑAS"
-- EN TODOS LOS NEGOCIOS ACTIVOS
-- ============================================================
