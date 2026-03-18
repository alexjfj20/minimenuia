-- ============================================================
-- DIAGNÓSTICO: CAMPOS NO SE GUARDAN EN payment_gateway
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Ver TODOS los campos de la tabla
SELECT 
  id,
  nequi_enabled,
  nequi_account_number,
  nequi_account_holder,
  nequi_instructions,
  bancolombia_enabled,
  bancolombia_account_number,
  bancolombia_account_holder,
  bancolombia_instructions,
  hotmart_enabled,
  hotmart_instructions,
  updated_at
FROM payment_gateway;

-- 2. Verificar si hay múltiples registros
SELECT COUNT(*) as total_registros FROM payment_gateway;

-- 3. Ver campos NULL o vacíos
SELECT 
  'nequi_account_holder' as campo,
  nequi_account_holder as valor,
  CASE 
    WHEN nequi_account_holder IS NULL THEN 'NULL'
    WHEN nequi_account_holder = '' THEN 'VACÍO'
    ELSE 'CON DATO'
  END as estado
FROM payment_gateway
UNION ALL
SELECT 
  'nequi_account_number',
  nequi_account_number,
  CASE 
    WHEN nequi_account_number IS NULL THEN 'NULL'
    WHEN nequi_account_number = '' THEN 'VACÍO'
    ELSE 'CON DATO'
  END
FROM payment_gateway
UNION ALL
SELECT 
  'bancolombia_account_holder',
  bancolombia_account_holder,
  CASE 
    WHEN bancolombia_account_holder IS NULL THEN 'NULL'
    WHEN bancolombia_account_holder = '' THEN 'VACÍO'
    ELSE 'CON DATO'
  END
FROM payment_gateway
UNION ALL
SELECT 
  'bancolombia_account_number',
  bancolombia_account_number,
  CASE 
    WHEN bancolombia_account_number IS NULL THEN 'NULL'
    WHEN bancolombia_account_number = '' THEN 'VACÍO'
    ELSE 'CON DATO'
  END
FROM payment_gateway;

-- ============================================================
-- SOLUCIÓN: Actualizar manualmente los campos
-- ============================================================
-- Si los campos están vacíos, ejecutar esto:

UPDATE payment_gateway 
SET 
  nequi_account_holder = 'Alexander Jerez Fernandez',
  nequi_instructions = 'Envía el pago al número mostrado y comparte el comprobante.',
  bancolombia_account_holder = 'Alexander Jerez Fernandez',
  bancolombia_account_number = '123-456789-00',
  bancolombia_instructions = 'Realiza la transferencia a la cuenta mostrada y envía el comprobante.',
  updated_at = NOW()
WHERE id = (SELECT id FROM payment_gateway LIMIT 1);

-- ============================================================
-- VERIFICAR DESPUÉS DE ACTUALIZAR
-- ============================================================

SELECT 
  'Nequi' as pasarela,
  nequi_enabled as habilitado,
  nequi_account_number as numero,
  nequi_account_holder as titular,
  nequi_instructions as instrucciones
FROM payment_gateway
UNION ALL
SELECT 
  'Bancolombia',
  bancolombia_enabled,
  bancolombia_account_number,
  bancolombia_account_holder,
  bancolombia_instructions
FROM payment_gateway;

-- ============================================================
-- PREVENCIÓN: Verificar que el upsert funciona correctamente
-- ============================================================

-- Probar upsert con todos los campos
INSERT INTO payment_gateway (
  nequi_enabled,
  nequi_account_number,
  nequi_account_holder,
  nequi_instructions,
  bancolombia_enabled,
  bancolombia_account_number,
  bancolombia_account_holder,
  bancolombia_instructions,
  updated_at
) VALUES (
  true,
  '3001234567',
  'Alexander Jerez Fernandez',
  'Envía el pago al número mostrado.',
  true,
  '123-456789-00',
  'Alexander Jerez Fernandez',
  'Realiza la transferencia.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nequi_enabled = EXCLUDED.nequi_enabled,
  nequi_account_number = EXCLUDED.nequi_account_number,
  nequi_account_holder = EXCLUDED.nequi_account_holder,
  nequi_instructions = EXCLUDED.nequi_instructions,
  bancolombia_enabled = EXCLUDED.bancolombia_enabled,
  bancolombia_account_number = EXCLUDED.bancolombia_account_number,
  bancolombia_account_holder = EXCLUDED.bancolombia_account_holder,
  bancolombia_instructions = EXCLUDED.bancolombia_instructions,
  updated_at = EXCLUDED.updated_at;

-- Verificar resultado
SELECT 
  nequi_account_holder,
  bancolombia_account_holder,
  updated_at
FROM payment_gateway;
