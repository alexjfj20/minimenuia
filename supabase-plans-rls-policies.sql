-- =============================================
-- MINIMENU - Políticas RLS para tabla plans
-- =============================================
-- Ejecuta este script en Supabase SQL Editor para habilitar RLS correctamente
-- Esto soluciona el error PGRST116 en updates

-- =============================================
-- 1. HABILITAR RLS
-- =============================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. POLÍTICAS SELECT
-- =============================================
-- Permitir lectura pública (anon)
DROP POLICY IF EXISTS "Allow select plans" ON public.plans;
CREATE POLICY "Allow select plans"
  ON public.plans FOR SELECT TO anon 
  USING (true);

-- Permitir lectura a autenticados
DROP POLICY IF EXISTS "Allow authenticated select plans" ON public.plans;
CREATE POLICY "Allow authenticated select plans"
  ON public.plans FOR SELECT TO authenticated 
  USING (true);

-- =============================================
-- 3. POLÍTICAS INSERT
-- =============================================
-- Permitir inserción pública (anon)
DROP POLICY IF EXISTS "Allow insert plans" ON public.plans;
CREATE POLICY "Allow insert plans"
  ON public.plans FOR INSERT TO anon 
  WITH CHECK (true);

-- Permitir inserción a autenticados
DROP POLICY IF EXISTS "Allow authenticated insert plans" ON public.plans;
CREATE POLICY "Allow authenticated insert plans"
  ON public.plans FOR INSERT TO authenticated 
  WITH CHECK (true);

-- =============================================
-- 4. POLÍTICAS UPDATE (CRÍTICO PARA EL FIX)
-- =============================================
-- Permitir actualización pública (anon)
DROP POLICY IF EXISTS "Allow update plans" ON public.plans;
CREATE POLICY "Allow update plans"
  ON public.plans FOR UPDATE TO anon 
  USING (true) 
  WITH CHECK (true);

-- Permitir actualización a autenticados
DROP POLICY IF EXISTS "Allow authenticated update plans" ON public.plans;
CREATE POLICY "Allow authenticated update plans"
  ON public.plans FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- =============================================
-- 5. POLÍTICAS DELETE
-- =============================================
-- Permitir eliminación pública (anon)
DROP POLICY IF EXISTS "Allow delete plans" ON public.plans;
CREATE POLICY "Allow delete plans"
  ON public.plans FOR DELETE TO anon 
  USING (true);

-- Permitir eliminación a autenticados
DROP POLICY IF EXISTS "Allow authenticated delete plans" ON public.plans;
CREATE POLICY "Allow authenticated delete plans"
  ON public.plans FOR DELETE TO authenticated 
  USING (true);

-- =============================================
-- 6. VERIFICAR POLÍTICAS CREADAS
-- =============================================
SELECT 
  policyname AS "Política",
  cmd AS "Comando",
  roles AS "Roles",
  qual AS "Condición USING",
  with_check AS "Condición WITH CHECK"
FROM pg_policies
WHERE tablename = 'plans'
ORDER BY cmd, policyname;

-- =============================================
-- 7. RESUMEN DE POLÍTICAS
-- =============================================
SELECT 
  'plans' AS tabla,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) AS select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) AS insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) AS update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) AS delete_policies,
  COUNT(*) AS total_policies
FROM pg_policies
WHERE tablename = 'plans';

-- =============================================
-- MENSAJE DE CONFIRMACIÓN
-- =============================================
-- Deberías ver 8 políticas en total:
-- 2 SELECT (anon + authenticated)
-- 2 INSERT (anon + authenticated)
-- 2 UPDATE (anon + authenticated) ← CRÍTICO PARA EL FIX
-- 2 DELETE (anon + authenticated)

SELECT '✅ Políticas RLS para tabla plans creadas exitosamente' AS status;
