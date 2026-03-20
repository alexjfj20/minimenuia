-- Script para verificar y corregir el rol del super_admin en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar usuarios existentes y sus roles
SELECT 
  id,
  email,
  raw_user_meta_data ->> 'role' as current_role,
  raw_user_meta_data ->> 'full_name' as full_name,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Si el super_admin no tiene el rol correcto, actualizarlo
-- Reemplaza 'tu-email@ejemplo.com' con el email del super_admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'tu-email@ejemplo.com'
  AND (raw_user_meta_data ->> 'role' IS NULL OR raw_user_meta_data ->> 'role' != 'super_admin');

-- 3. Verificar que se actualizó correctamente
SELECT 
  id,
  email,
  raw_user_meta_data ->> 'role' as role
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';

-- 4. Si necesitas crear un nuevo super_admin desde cero:
-- (Solo si no existe ningún usuario super_admin)
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'nuevo-super-admin@minimenu.com',
  crypt('TuContraseñaSegura123!', gen_salt('bf')),
  NOW(),
  '{"role": "super_admin", "full_name": "Super Admin"}'::jsonb,
  NOW(),
  NOW()
);
*/

-- 5. Verificar perfiles de admin existentes
SELECT 
  u.email,
  u.raw_user_meta_data ->> 'role' as role,
  p.id as profile_id,
  p.display_name,
  p.created_at
FROM auth.users u
LEFT JOIN admin_profiles p ON p.id = u.id
WHERE u.raw_user_meta_data ->> 'role' = 'super_admin';
