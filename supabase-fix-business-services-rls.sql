-- ============================================================
-- CORREGIR PERMISOS RLS PARA business_services
-- ============================================================
-- El error "new row violates row-level security policy" significa
-- que las políticas RLS no permiten INSERT/UPDATE/DELETE
-- ============================================================

-- ============================================================
-- PASO 1: VERIFICAR SI RLS ESTÁ HABILITADO
-- ============================================================

-- Verificar estado de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'business_services';

-- ============================================================
-- PASO 2: ELIMINAR POLÍTICAS EXISTENTES (si las hay)
-- ============================================================

DROP POLICY IF EXISTS "authenticated_all_business_services" ON public.business_services;
DROP POLICY IF EXISTS "authenticated_insert_business_services" ON public.business_services;
DROP POLICY IF EXISTS "authenticated_update_business_services" ON public.business_services;
DROP POLICY IF EXISTS "authenticated_delete_business_services" ON public.business_services;

-- ============================================================
-- PASO 3: CREAR POLÍTICAS CORRECTAS
-- ============================================================

-- Política para SELECT (leer)
CREATE POLICY "authenticated_select_business_services"
  ON public.business_services
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT (crear)
CREATE POLICY "authenticated_insert_business_services"
  ON public.business_services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE (actualizar)
CREATE POLICY "authenticated_update_business_services"
  ON public.business_services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE (eliminar)
CREATE POLICY "authenticated_delete_business_services"
  ON public.business_services
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- PASO 4: VERIFICAR POLÍTICAS CREADAS
-- ============================================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'business_services'
ORDER BY policyname;

-- ============================================================
-- PASO 5: RECARGAR SCHEMA DE POSTGREST
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- LISTO - AHORA DEBERÍA FUNCIONAR EL INSERT
-- ============================================================
