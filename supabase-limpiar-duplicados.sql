-- ============================================================
-- LIMPIEZA: Eliminar registros duplicados en payment_gateway
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Ver CUÁNTOS registros hay
SELECT COUNT(*) as total_registros FROM payment_gateway;

-- 2. Ver TODOS los registros con sus IDs
SELECT 
  id,
  nequi_enabled,
  nequi_account_number,
  nequi_account_holder,
  bancolombia_enabled,
  bancolombia_account_number,
  bancolombia_account_holder,
  hotmart_enabled,
  hotmart_instructions,
  updated_at
FROM payment_gateway
ORDER BY updated_at DESC;

-- 3. Eliminar registros duplicados (mantener solo el más reciente)
-- IMPORTANTE: Esto elimina todos menos el más reciente
DELETE FROM payment_gateway 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id 
    FROM payment_gateway 
    ORDER BY updated_at DESC 
    LIMIT 1
  ) as subquery
);

-- 4. Verificar que solo quede 1 registro
SELECT COUNT(*) as total_registros FROM payment_gateway;

-- 5. Ver TODOS los campos de Hotmart
SELECT 
  hotmart_enabled,
  hotmart_instructions,
  updated_at
FROM payment_gateway;

-- ============================================================
-- ACTUALIZAR MANUALMENTE LOS DATOS DE HOTMART
-- ============================================================
-- Si Hotmart está vacío o incorrecto, ejecutar esto:

UPDATE payment_gateway 
SET 
  hotmart_enabled = true,
  hotmart_instructions = 'Serás redirigido a Hotmart para completar tu suscripción de forma segura.',
  updated_at = NOW()
WHERE id = (SELECT id FROM payment_gateway LIMIT 1);

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT 
  'Nequi' as pasarela,
  nequi_enabled as habilitado,
  nequi_account_number as numero,
  nequi_account_holder as titular,
  nequi_instructions as instrucciones,
  NULL as hotmart_url
FROM payment_gateway
UNION ALL
SELECT 
  'Bancolombia',
  bancolombia_enabled,
  bancolombia_account_number,
  bancolombia_account_holder,
  bancolombia_instructions,
  NULL
FROM payment_gateway
UNION ALL
SELECT 
  'Hotmart',
  hotmart_enabled,
  NULL,
  NULL,
  hotmart_instructions,
  NULL
FROM payment_gateway;

-- ============================================================
-- PREVENIR FUTUROS DUPLICADOS
-- ============================================================
-- La tabla ya debería tener una constraint de unicidad en el ID
-- pero podemos agregar un trigger para prevenir inserts múltiples

-- Verificar si existe la constraint
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'payment_gateway';

-- ============================================================
-- INSTRUCCIONES PARA EL SUPER ADMIN
-- ============================================================
/*
Después de limpiar los duplicados:

1. Ve al Super Admin Panel → Pestaña "Pagos"
2. Recarga la página (F5)
3. Verifica que los datos se carguen correctamente:
   - Nequi: Número, Titular, Instrucciones
   - Bancolombia: Número, Titular, Instrucciones
   - Hotmart: Habilitado, Instrucciones
4. Si algún campo está vacío, complétalo y guarda
5. Verifica en Admin Panel → Suscripción → Planes
*/
