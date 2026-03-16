-- ============================================================
-- CORRECCIÓN RLS - business_services
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- Esto corrige CUALQUIER problema de políticas RLS
-- ============================================================

-- 1. HABILITAR RLS (si no está habilitado)
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES (limpieza)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver business_services" ON public.business_services;
DROP POLICY IF EXISTS "Admins pueden gestionar business_services" ON public.business_services;
DROP POLICY IF EXISTS "Negocios pueden ver sus propios servicios" ON public.business_services;
DROP POLICY IF EXISTS "Select all" ON public.business_services;
DROP POLICY IF EXISTS "Insert all" ON public.business_services;
DROP POLICY IF EXISTS "Update all" ON public.business_services;
DROP POLICY IF EXISTS "Delete all" ON public.business_services;

-- 3. CREAR POLÍTICA SIMPLE PARA QUE TODOS LOS AUTENTICADOS PUEDAN LEER
-- Esta política permite que CUALQUIER usuario autenticado pueda leer business_services
-- Es la más permisiva para debugging
CREATE POLICY "authenticated_select"
  ON public.business_services
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. CREAR POLÍTICA PARA QUE SERVICE_ROLE PUEDA HACER TODO
CREATE POLICY "service_role_all"
  ON public.business_services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. CREAR POLÍTICA PARA QUE USUARIOS PUEDAN INSERTAR PARA SUS PROPIOS NEGOCIOS
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

-- 6. CREAR POLÍTICA PARA QUE USUARIOS PUEDAN ACTUALIZAR SUS PROPIOS NEGOCIOS
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

-- 7. VERIFICAR POLÍTICAS CREADAS
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'business_services'
ORDER BY policyname;

-- ============================================================
-- LISTO - RLS CORREGIDO
-- ============================================================
-- AHORA LOS USUARIOS AUTENTICADOS PUEDEN LEER business_services
-- Y LOS DUEÑOS DE NEGOCIOS PUEDEN GESTIONAR SUS PROPIOS SERVICIOS
-- ============================================================
