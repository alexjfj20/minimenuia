-- =============================================
-- MINIMENU - Configuración de Domicilio
-- =============================================

-- Agregar columnas para configuración de domicilio
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "deliveryFee" DOUBLE PRECISION DEFAULT 3000;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "minimumOrder" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "estimatedTime" TEXT DEFAULT '30-45 min';

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "deliveryEnabled" BOOLEAN DEFAULT true;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "deliveryRadius" DOUBLE PRECISION;

-- Verificar columnas agregadas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name IN (
    'deliveryFee', 
    'minimumOrder', 
    'estimatedTime', 
    'deliveryEnabled', 
    'deliveryRadius'
  )
ORDER BY ordinal_position;
