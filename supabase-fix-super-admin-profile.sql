-- Script para crear/actualizar perfil de super_admin existente
-- Ejecutar en Supabase SQL Editor si el perfil no se crea automáticamente

-- Verificar usuarios super_admin existentes sin perfil
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as role,
  p.id as profile_exists
FROM auth.users u
LEFT JOIN admin_profiles p ON p.id = u.id
WHERE u.raw_user_meta_data ->> 'role' = 'super_admin'
  AND p.id IS NULL;

-- Crear perfil para super_admin existentes sin perfil
INSERT INTO admin_profiles (id, full_name, display_name, company_name, timezone, language)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email, 'Super Admin'),
  COALESCE(u.raw_user_meta_data ->> 'display_name', 'Super Admin'),
  'MINIMENU',
  'America/Bogota',
  'es'
FROM auth.users u
WHERE u.raw_user_meta_data ->> 'role' = 'super_admin'
ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon los perfiles
SELECT 
  u.id,
  u.email,
  p.display_name,
  p.created_at
FROM auth.users u
INNER JOIN admin_profiles p ON p.id = u.id
WHERE u.raw_user_meta_data ->> 'role' = 'super_admin';
