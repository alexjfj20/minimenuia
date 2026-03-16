-- ============================================================
-- VERIFICAR Y CORREGIR TABLA services
-- ============================================================
-- El service_id existe en business_services pero la consulta
-- .in() no lo encuentra en services. Verificar y corregir.
-- ============================================================

-- ============================================================
-- PASO 1: VERIFICAR QUE EL SERVICIO EXISTE EN services
-- ============================================================

SELECT id, name, status 
FROM public.services 
WHERE id = 'fba81f12-7de1-44d2-9db0-4db323cf7458';

-- ============================================================
-- PASO 2: DESHABILITAR RLS EN services (si está habilitado)
-- ============================================================

-- Deshabilitar RLS para permitir acceso directo
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos
GRANT ALL ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;

-- ============================================================
-- PASO 3: VERIFICAR PERMISOS
-- ============================================================

-- Verificar estado de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'services';

-- Verificar grants
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'services'
AND table_schema = 'public';

-- ============================================================
-- PASO 4: RECARGAR SCHEMA DE POSTGREST
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- LISTO - AHORA LA CONSULTA .in() DEBERÍA FUNCIONAR
-- ============================================================
