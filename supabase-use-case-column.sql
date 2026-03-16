-- ============================================================
-- AGREGAR COLUMNA use_case EN ai_models
-- ============================================================
-- Esta columna permite especificar si un proveedor de IA
-- se usa para generación de texto, imagen o ambos.
--
-- Valores posibles:
--   'text'  → Solo generación de texto (ej: Groq para GPT)
--   'image' → Solo generación de imágenes (ej: DALL-E 3)
--   'both'  → Ambas funcionalidades (ej: OpenAI GPT + DALL-E)
-- ============================================================

-- Agregar columna con valor por defecto 'both' para modelos existentes
ALTER TABLE ai_models
ADD COLUMN use_case TEXT NOT NULL DEFAULT 'both'
CHECK (use_case IN ('text', 'image', 'both'));

-- Agregar comentario descriptivo
COMMENT ON COLUMN ai_models.use_case IS 
  'Especifica si el modelo se usa para: text (solo texto), image (solo imagen), o both (ambos)';

-- Actualizar modelos existentes según su proveedor
-- OpenAI GPT → both (tiene GPT para texto y DALL-E para imagen)
UPDATE ai_models
SET use_case = 'both'
WHERE provider LIKE '%OpenAI%';

-- Google Gemini → both (tiene Gemini para texto e Imagen API)
UPDATE ai_models
SET use_case = 'both'
WHERE provider LIKE '%Google%';

-- Groq → text (solo tiene modelos de lenguaje, no genera imágenes)
UPDATE ai_models
SET use_case = 'text'
WHERE provider LIKE '%Groq%';

-- Custom API → both (puede configurarse para ambos)
UPDATE ai_models
SET use_case = 'both'
WHERE provider LIKE '%Custom%';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar cambios:
-- SELECT id, provider, model, use_case, active FROM ai_models ORDER BY created_at DESC;
-- ============================================================
