-- ============================================================
-- CORRECCIÓN RLS - business_services (PERMISOS DE ESCRITURA)
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. HABILITAR RLS (si no está habilitado)
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES (limpieza)
DROP POLICY IF EXISTS "authenticated_select" ON public.business_services;
DROP POLICY IF EXISTS "service_role_all" ON public.business_services;
DROP POLICY IF EXISTS "users_insert_own_business" ON public.business_services;
DROP POLICY IF EXISTS "users_update_own_business" ON public.business_services;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver business_services" ON public.business_services;
DROP POLICY IF EXISTS "Admins pueden gestionar business_services" ON public.business_services;
DROP POLICY IF EXISTS "Negocios pueden ver sus propios servicios" ON public.business_services;

-- 3. POLÍTICA PARA QUE USUARIOS AUTENTICADOS PUEDAN LEER TODOS LOS business_services
CREATE POLICY "authenticated_select"
  ON public.business_services
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. POLÍTICA PARA QUE SERVICE_ROLE PUEDA HACER TODO (administrador)
CREATE POLICY "service_role_all"
  ON public.business_services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. POLÍTICA PARA QUE USUARIOS PUEDAN INSERTAR PARA SUS PROPIOS NEGOCIOS
-- Un usuario puede insertar en business_services si el business_id le pertenece
CREATE POLICY "users_insert_own_business"
  ON public.business_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_services.business_id
      AND b.user_id = auth.uid()
    )
  );

-- 6. POLÍTICA PARA QUE USUARIOS PUEDAN ACTUALIZAR SUS PROPIOS NEGOCIOS
CREATE POLICY "users_update_own_business"
  ON public.business_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_services.business_id
      AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_services.business_id
      AND b.user_id = auth.uid()
    )
  );

-- 7. POLÍTICA PARA QUE USUARIOS PUEDAN ELIMINAR SUS PROPIOS NEGOCIOS
CREATE POLICY "users_delete_own_business"
  ON public.business_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_services.business_id
      AND b.user_id = auth.uid()
    )
  );

-- 8. POLÍTICA ESPECIAL PARA SUPER ADMIN
-- El super admin puede gestionar TODOS los business_services
-- Verificar si el usuario tiene rol 'SUPER_ADMIN' en la tabla users
CREATE POLICY "super_admin_all"
  ON public.business_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'SUPER_ADMIN'
    )
  );

-- 9. VERIFICAR POLÍTICAS CREADAS
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'business_services'
ORDER BY policyname;

-- ============================================================
-- LISTO - RLS CORREGIDO PARA ESCRITURA
-- ============================================================
-- AHORA:
-- - Super Admin puede gestionar TODOS los business_services
-- - Usuarios normales solo pueden gestionar SUS PROPIOS negocios
-- - Todos los autenticados pueden LEER business_services
-- ============================================================
