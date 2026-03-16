-- ============================================================
-- AGREGAR CAMPOS DE PRUEBA GRATUITA Y API KEY EN INTEGRACIONES
-- ============================================================
-- Este script agrega columnas para:
-- 1. Prueba gratuita (trial)
-- 2. Configuración de API Key propia
-- 3. Activación automática para todos los negocios
-- ============================================================

-- Tabla: integrations (o la tabla que uses para integraciones)
-- Nota: Ajusta el nombre de la tabla según tu schema real

ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_ai_credits INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS requiere_api_key_propia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activar_todos BOOLEAN DEFAULT false;

-- Comentario descriptivo
COMMENT ON COLUMN integrations.trial_enabled IS 'Indica si la integración incluye período de prueba gratuita';
COMMENT ON COLUMN integrations.trial_days IS 'Duración de la prueba gratuita en días (1-7)';
COMMENT ON COLUMN integrations.trial_ai_credits IS 'Créditos de IA disponibles durante la prueba (si aplica)';
COMMENT ON COLUMN integrations.requiere_api_key_propia IS 'Si es true, el negocio debe ingresar su propia API Key';
COMMENT ON COLUMN integrations.activar_todos IS 'Si es true, se activa automáticamente para todos los negocios activos';

-- ============================================================
-- TABLA BUSINESS_INTEGRATIONS (negocio-integracion)
-- ============================================================
-- Si existe esta tabla de relación, agregar columnas para tracking

-- ALTER TABLE business_integrations
-- ADD COLUMN IF NOT EXISTS api_key_almacenada TEXT DEFAULT NULL,
-- ADD COLUMN IF NOT EXISTS activado_desde DATE DEFAULT NULL;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar cambios:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'integrations'
-- ORDER BY ordinal_position;
-- ============================================================
