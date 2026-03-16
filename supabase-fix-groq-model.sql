-- ============================================================
-- CORREGIR MODELO DE GROQ (descontinuado)
-- ============================================================
-- El modelo llama-3.1-70b-versatile fue descontinuado por Groq.
-- Este script actualiza al modelo vigente: llama-3.3-70b-versatile
-- ============================================================

UPDATE ai_models 
SET 
  model = 'llama-3.3-70b-versatile',
  updated_at = NOW()
WHERE 
  provider = 'Groq' 
  AND model = 'llama-3.1-70b-versatile';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar el cambio:
-- SELECT id, provider, model, active, use_case, priority 
-- FROM ai_models 
-- WHERE provider = 'Groq';
-- ============================================================
