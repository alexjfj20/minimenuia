-- ============================================================
-- VERIFICAR CONFIGURACIÓN DE PAGOS EN SUPABASE
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Ver TODOS los datos de payment_gateway
SELECT 
  id,
  hotmart_enabled,
  hotmart_instructions,
  nequi_enabled,
  nequi_account_number,
  nequi_account_holder,
  nequi_instructions,
  bancolombia_enabled,
  bancolombia_account_number,
  bancolombia_account_holder,
  bancolombia_instructions,
  updated_at
FROM payment_gateway;

-- 2. Ver solo los campos habilitados
SELECT 
  'hotmart' as pasarela,
  hotmart_enabled as habilitado,
  hotmart_instructions as instrucciones
FROM payment_gateway
UNION ALL
SELECT 
  'nequi',
  nequi_enabled,
  nequi_instructions
FROM payment_gateway
UNION ALL
SELECT 
  'bancolombia',
  bancolombia_enabled,
  bancolombia_instructions
FROM payment_gateway;

-- ============================================================
-- SI TODOS ESTÁN EN FALSE, EJECUTA ESTO:
-- ============================================================

-- Actualizar para activar Nequi y Bancolombia (ejemplo)
UPDATE payment_gateway 
SET 
  nequi_enabled = true,
  nequi_account_number = '3001234567',
  nequi_account_holder = 'Tu Nombre',
  nequi_instructions = 'Envía el pago al número mostrado y envía el comprobante.',
  bancolombia_enabled = true,
  bancolombia_account_number = '123-456789-00',
  bancolombia_account_holder = 'Tu Nombre',
  bancolombia_instructions = 'Transferencia a cuenta de ahorros Bancolombia.',
  hotmart_enabled = true,
  hotmart_instructions = 'Serás redirigido a Hotmart para completar tu suscripción.',
  updated_at = NOW()
WHERE id = (SELECT id FROM payment_gateway LIMIT 1);

-- ============================================================
-- VERIFICAR DESPUÉS DE ACTUALIZAR
-- ============================================================

-- Verificar que se actualizó correctamente
SELECT 
  nequi_enabled,
  nequi_account_number,
  bancolombia_enabled,
  bancolombia_account_number,
  hotmart_enabled,
  updated_at
FROM payment_gateway;
