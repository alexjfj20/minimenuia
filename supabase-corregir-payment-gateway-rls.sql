-- ============================================================
-- CORRECCIÓN: payment_gateway - RLS y fila inicial
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Crear fila inicial en payment_gateway (si no existe)
INSERT INTO payment_gateway DEFAULT VALUES
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT id, updated_at FROM payment_gateway;

-- ============================================================
-- 2. Corregir políticas RLS para permitir INSERT/UPDATE
-- ============================================================

-- Ver políticas actuales
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'payment_gateway';

-- Eliminar políticas existentes si causan problemas
DROP POLICY IF EXISTS "service_role_insert" ON payment_gateway;

-- Crear política para INSERT de service_role
CREATE POLICY "service_role_insert"
  ON payment_gateway
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Crear política para UPDATE de service_role
DROP POLICY IF EXISTS "service_role_update" ON payment_gateway;
CREATE POLICY "service_role_update"
  ON payment_gateway
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================================
-- 3. ALTERNATIVA: Deshabilitar RLS temporalmente para testing
-- ============================================================
-- Si persisten los errores, ejecutar esto:
-- ALTER TABLE payment_gateway DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Verificar que se puede insertar
-- ============================================================
-- Ejecutar este INSERT de prueba:
UPDATE payment_gateway 
SET 
  hotmart_enabled = true,
  hotmart_instructions = 'Test',
  updated_at = NOW()
WHERE id = (SELECT id FROM payment_gateway LIMIT 1);

-- Verificar resultado
SELECT * FROM payment_gateway;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
