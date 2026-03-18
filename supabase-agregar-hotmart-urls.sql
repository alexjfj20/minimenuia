-- ============================================================
-- AGREGAR COLUMNAS DE HOTMART POR PLAN
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Agregar columnas para URLs de Hotmart por plan
ALTER TABLE payment_gateway 
ADD COLUMN IF NOT EXISTS hotmart_url_gratis TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hotmart_url_basico TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hotmart_url_profesional TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hotmart_url_empresarial TEXT DEFAULT '';

-- Verificar que se agregaron las columnas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_gateway'
AND column_name LIKE 'hotmart_url%'
ORDER BY column_name;

-- Actualizar con URLs de ejemplo (OPCIONAL)
UPDATE payment_gateway 
SET 
  hotmart_url_gratis = 'https://pay.hotmart.com/XXXXXX?checkoutMode=10',
  hotmart_url_basico = 'https://pay.hotmart.com/YYYYYY?checkoutMode=10',
  hotmart_url_profesional = 'https://pay.hotmart.com/ZZZZZZ?checkoutMode=10',
  hotmart_url_empresarial = 'https://pay.hotmart.com/AAAAAA?checkoutMode=10',
  updated_at = NOW()
WHERE id = (SELECT id FROM payment_gateway LIMIT 1);

-- Verificar URLs guardadas
SELECT 
  hotmart_url_gratis,
  hotmart_url_basico,
  hotmart_url_profesional,
  hotmart_url_empresarial,
  updated_at
FROM payment_gateway;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
