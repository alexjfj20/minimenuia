-- ============================================================
-- AGREGAR CAMPOS DE IA Y PRUEBA GRATUITA EN SERVICIOS
-- ============================================================
-- Este script agrega columnas para:
-- 1. Prueba gratuita (trial)
-- 2. Créditos de IA incluidos
-- 3. Límite de usos por mes
-- ============================================================

-- Tabla: services
ALTER TABLE services
ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_ai_credits INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_credits_included INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_credits_limit INTEGER DEFAULT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN services.trial_enabled IS 'Indica si el servicio incluye período de prueba gratuita';
COMMENT ON COLUMN services.trial_days IS 'Duración de la prueba gratuita en días (1-7)';
COMMENT ON COLUMN services.trial_ai_credits IS 'Créditos de IA disponibles durante la prueba';
COMMENT ON COLUMN services.ai_credits_included IS 'Créditos de IA incluidos por paquete (se reinician mensualmente)';
COMMENT ON COLUMN services.ai_credits_limit IS 'Límite máximo de generaciones de IA por mes';

-- ============================================================
-- TABLA BUSINESS_SERVICES (negocio-servicio)
-- ============================================================
-- Agregar columnas para tracking de créditos por negocio

ALTER TABLE business_services
ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_credits_reset_date DATE DEFAULT NULL;

COMMENT ON COLUMN business_services.ai_credits_used IS 'Créditos de IA utilizados en el período actual';
COMMENT ON COLUMN business_services.ai_credits_reset_date IS 'Fecha del próximo reinicio de créditos';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar cambios:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'services'
-- AND column_name IN ('trial_enabled', 'trial_days', 'trial_ai_credits', 'ai_credits_included', 'ai_credits_limit')
-- ORDER BY ordinal_position;
-- ============================================================
