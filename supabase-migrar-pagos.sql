-- ============================================================
-- MIGRAR CONFIGURACIÓN DE PAGOS - localStorage a Supabase
-- ============================================================
-- Esto es solo informativo - la migración real se hace desde el navegador
-- ============================================================

-- 1. Verificar si hay configuración en la tabla
SELECT 
  stripe_enabled,
  nequi_enabled,
  bancolombia_enabled,
  hotmart_enabled,
  updated_at
FROM payment_gateway
LIMIT 1;

-- 2. Si está vacía (todos false), insertar configuración por defecto
-- NOTA: La configuración real debe venir del Super Admin Panel
-- Este script solo verifica que la tabla esté lista

-- 3. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_gateway'
AND column_name IN (
  'stripe_enabled', 'nequi_enabled', 'bancolombia_enabled', 
  'hotmart_enabled', 'nequi_account_number', 'bancolombia_account_number'
)
ORDER BY ordinal_position;

-- ============================================================
-- INSTRUCCIONES PARA MIGRAR:
-- ============================================================
-- 1. Abre la consola del navegador (F12)
-- 2. Ejecuta este código JavaScript:
--
-- const stored = localStorage.getItem('minimenu_payment_config');
-- if (stored) {
--   const config = JSON.parse(stored);
--   console.log('Configuración en localStorage:', config);
--   console.log('Ahora ve al Super Admin → Pagos y guarda nuevamente');
--   console.log('Esto migrará la configuración a Supabase automáticamente');
-- } else {
--   console.log('No hay configuración en localStorage');
-- }
--
-- 3. Ve al Super Admin → Pagos
-- 4. Verifica que los métodos estén configurados
-- 5. Click en "Guardar Configuración" (esto guarda en Supabase)
-- 6. Verifica en el Admin Panel → Suscripción → Modal de planes
-- ============================================================
