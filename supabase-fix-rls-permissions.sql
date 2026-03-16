-- ============================================================
-- CORREGIR PERMISOS RLS PARA USERS Y BUSINESSES
-- ============================================================
-- Este script habilita el acceso correcto a las tablas
-- ============================================================

-- ============================================================
-- TABLA USERS
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "authenticated_access_users" ON public.users;
DROP POLICY IF EXISTS "super_admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "users_view_own_data" ON public.users;

-- Policy 1: Super Admin puede ver todo
CREATE POLICY "super_admin_full_access_users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy 2: Usuarios autenticados pueden verse a sí mismos
CREATE POLICY "users_view_own_data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy 3: Super Admin puede insertar/actualizar/eliminar
CREATE POLICY "super_admin_manage_users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- ============================================================
-- TABLA BUSINESSES
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "authenticated_access_businesses" ON public.businesses;
DROP POLICY IF EXISTS "super_admin_full_access_businesses" ON public.businesses;
DROP POLICY IF EXISTS "businesses_view_own" ON public.businesses;

-- Policy 1: Super Admin puede ver todo
CREATE POLICY "super_admin_full_access_businesses"
  ON public.businesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy 2: Dueños pueden ver sus propios negocios
CREATE POLICY "businesses_view_own"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (
    "ownerId" = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy 3: Super Admin puede gestionar todos los negocios
CREATE POLICY "super_admin_manage_businesses"
  ON public.businesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT ON public.businesses TO anon;

-- ============================================================
-- RECARGAR SCHEMA DE POSTGREST
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar:

-- 1. Verificar policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('users', 'businesses');

-- 2. Verificar grants
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_name IN ('users', 'businesses')
-- AND grantee IN ('authenticated', 'anon');

-- ============================================================
