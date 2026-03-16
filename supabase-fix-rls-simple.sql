-- ============================================================
-- CORREGIR PERMISOS RLS - VERSIÓN SIMPLIFICADA
-- ============================================================
-- Elimina políticas restrictivas y permite acceso total a autenticados
-- ============================================================

-- ============================================================
-- TABLA USERS
-- ============================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "super_admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "users_view_own_data" ON public.users;
DROP POLICY IF EXISTS "super_admin_manage_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_access_users" ON public.users;

-- Política simple: Todos los autenticados pueden ver todos los usuarios
CREATE POLICY "authenticated_all_users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLA BUSINESSES
-- ============================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "super_admin_full_access_businesses" ON public.businesses;
DROP POLICY IF EXISTS "businesses_view_own" ON public.businesses;
DROP POLICY IF EXISTS "super_admin_manage_businesses" ON public.businesses;
DROP POLICY IF EXISTS "authenticated_access_businesses" ON public.businesses;

-- Política simple: Todos los autenticados pueden ver todos los negocios
CREATE POLICY "authenticated_all_businesses"
  ON public.businesses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RECARGAR SCHEMA
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar:
-- SELECT * FROM public.users LIMIT 5;
-- SELECT * FROM public.businesses LIMIT 5;
-- ============================================================
