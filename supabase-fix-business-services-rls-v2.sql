-- ============================================================
-- CORREGIR PERMISOS RLS PARA business_services - VERSIÓN COMPLETA
-- ============================================================
-- Este script deshabilita RLS y otorga permisos directos
-- ============================================================

-- ============================================================
-- PASO 1: DESHABILITAR RLS COMPLETAMENTE
-- ============================================================

-- Deshabilitar RLS para permitir acceso directo
ALTER TABLE public.business_services DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 2: OTORGAR PERMISOS DIRECTOS
-- ============================================================

-- Otorgar todos los permisos al rol authenticated
GRANT ALL ON public.business_services TO authenticated;

-- Otorgar permisos de lectura al rol anon (para consultas públicas si es necesario)
GRANT SELECT ON public.business_services TO anon;

-- ============================================================
-- PASO 3: VERIFICAR PERMISOS
-- ============================================================

-- Verificar estado de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'business_services';

-- Verificar grants
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'business_services'
AND table_schema = 'public';

-- ============================================================
-- PASO 4: RECARGAR SCHEMA DE POSTGREST
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- LISTO - AHORA DEBERÍA FUNCIONAR EL INSERT SIN RLS
-- ============================================================
