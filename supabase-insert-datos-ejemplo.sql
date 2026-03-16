-- ============================================================
-- INSERTAR DATOS DE EJEMPLO EN SUPABASE
-- ============================================================
-- Esto crea un usuario Super Admin y un negocio de ejemplo
-- ============================================================

-- ============================================================
-- PASO 1: INSERTAR USUARIO SUPER ADMIN
-- ============================================================

INSERT INTO public.users (
  id,
  email,
  name,
  username,
  role,
  status,
  "businessId",
  "businessName",
  phone,
  avatar,
  "createdAt",
  "updatedAt",
  "lastLoginAt"
) VALUES (
  'e3a9970e-9525-4370-ad6a-f8f7f60c9b33',  -- ID del usuario logueado
  'auditsemseo@gmail.com',
  'Super Admin',
  'admin',
  'super_admin',
  'active',
  NULL,
  NULL,
  '+57 300 000 0000',
  NULL,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  "updatedAt" = NOW();

-- ============================================================
-- PASO 2: INSERTAR NEGOCIO DE EJEMPLO
-- ============================================================

INSERT INTO public.businesses (
  id,
  name,
  "ownerId",
  "ownerName",
  "ownerEmail",
  phone,
  address,
  "planId",
  "planName",
  status,
  logo,
  "primaryColor",
  "secondaryColor",
  slug,
  "createdAt",
  "updatedAt"
) VALUES (
  'biz-001',
  'Mi Negocio Demo',
  'e3a9970e-9525-4370-ad6a-f8f7f60c9b33',
  'Super Admin',
  'auditsemseo@gmail.com',
  '+57 300 000 0000',
  'Calle 123 #45-67, Ciudad',
  'plan-basic',
  'Plan Básico',
  'active',
  NULL,
  '#8b5cf6',
  '#ffffff',
  'mi-negocio-demo',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  "updatedAt" = NOW();

-- ============================================================
-- PASO 3: ASIGNAR USUARIO AL NEGOCIO (OPCIONAL)
-- ============================================================

UPDATE public.users
SET 
  "businessId" = 'biz-001',
  "businessName" = 'Mi Negocio Demo'
WHERE email = 'auditsemseo@gmail.com';

-- ============================================================
-- PASO 4: VERIFICAR DATOS INSERTADOS
-- ============================================================

SELECT 'Users' as tabla, COUNT(*) as cantidad FROM public.users
UNION ALL
SELECT 'Businesses', COUNT(*) FROM public.businesses;

-- ============================================================
-- LISTO - AHORA DEBERÍAS VER LOS DATOS EN EL PANEL
-- ============================================================
