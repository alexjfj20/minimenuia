-- ============================================================
-- AGREGAR CAMPOS DE IA Y PRUEBA GRATUITA EN MÓDULOS
-- ============================================================
-- Este script agrega columnas para:
-- 1. Prueba gratuita (trial)
-- 2. Créditos de IA incluidos (solo para módulos de tipo IA)
-- ============================================================

-- Tabla: modules
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_ai_credits INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_credits_included INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_credits_limit INTEGER DEFAULT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN modules.trial_enabled IS 'Indica si el módulo incluye período de prueba gratuita';
COMMENT ON COLUMN modules.trial_days IS 'Duración de la prueba gratuita en días (1-7)';
COMMENT ON COLUMN modules.trial_ai_credits IS 'Créditos de IA disponibles durante la prueba';
COMMENT ON COLUMN modules.ai_credits_included IS 'Créditos de IA incluidos por módulo (solo tipo IA)';
COMMENT ON COLUMN modules.ai_credits_limit IS 'Límite máximo de generaciones de IA por mes (solo tipo IA)';

-- ============================================================
-- TABLA BUSINESS_MODULES (negocio-modulo)
-- ============================================================
-- Agregar columnas para tracking de créditos por negocio

ALTER TABLE business_modules
ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_credits_reset_date DATE DEFAULT NULL;

COMMENT ON COLUMN business_modules.ai_credits_used IS 'Créditos de IA utilizados en el período actual';
COMMENT ON COLUMN business_modules.ai_credits_reset_date IS 'Fecha del próximo reinicio de créditos';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar cambios:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'modules'
-- AND column_name IN ('trial_enabled', 'trial_days', 'trial_ai_credits', 'ai_credits_included', 'ai_credits_limit')
-- ORDER BY ordinal_position;
-- ============================================================
