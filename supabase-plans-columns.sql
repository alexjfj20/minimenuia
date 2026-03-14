-- =============================================
-- MINIMENU - Verificar y Agregar Columnas Faltantes en Plans
-- =============================================
-- Ejecuta este script en Supabase SQL Editor para asegurar que todas las columnas necesarias existan

-- Verificar columnas existentes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- Agregar columnas faltantes si no existen

-- updatedAt (para tracking de cambios)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- isActive (para activar/desactivar planes)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- isPublic (para mostrar/ocultar planes públicamente)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT true;

-- order (para ordenar los planes)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- icon (ícono del plan)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "icon" TEXT DEFAULT 'zap';

-- color (color del plan)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT '#8b5cf6';

-- maxUsers (límite de usuarios)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER DEFAULT 1;

-- maxProducts (límite de productos)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "maxProducts" INTEGER DEFAULT 50;

-- maxCategories (límite de categorías)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "maxCategories" INTEGER DEFAULT 5;

-- hotmartUrl (URL de pago de Hotmart)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "hotmartUrl" TEXT;

-- Verificar columnas después de agregar
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT '✅ Todas las columnas necesarias para planes han sido verificadas/agregadas' as status;
