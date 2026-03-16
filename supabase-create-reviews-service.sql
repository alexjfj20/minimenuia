-- ============================================================
-- VERIFICAR/INSERTAR SERVICIO "RESEÑAS Y FIDELIZACIÓN"
-- ============================================================
-- Este script verifica si el servicio existe y lo inserta si no existe
-- ============================================================

-- ============================================================
-- PASO 1: VERIFICAR SI EXISTE EL SERVICIO
-- ============================================================

SELECT id, name, status, created_at 
FROM public.services 
WHERE name = 'Reseñas y Fidelización';

-- ============================================================
-- PASO 2: INSERTAR SI NO EXISTE
-- ============================================================

INSERT INTO public.services (name, description, price, currency, billing_type, status, created_at, updated_at)
SELECT 
  'Reseñas y Fidelización',
  'Sistema de reseñas y puntos de fidelización para clientes',
  0,
  'COP',
  'monthly',
  'active',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.services WHERE name = 'Reseñas y Fidelización'
);

-- ============================================================
-- PASO 3: VERIFICAR QUE SE INSERTÓ
-- ============================================================

SELECT id, name, status, created_at 
FROM public.services 
WHERE name = 'Reseñas y Fidelización';

-- ============================================================
-- PASO 4: ACTIVAR PARA TODOS LOS NEGOCIOS (OPCIONAL)
-- ============================================================

-- Si querés activar el servicio para todos los negocios existentes:
-- Descomentar las siguientes líneas:

/*
INSERT INTO public.business_services (business_id, service_id, status, ai_credits_used, ai_credits_reset_date, created_at, updated_at)
SELECT 
  b.id,
  s.id,
  'active',
  0,
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
FROM public.businesses b
CROSS JOIN public.services s
WHERE s.name = 'Reseñas y Fidelización'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();
*/

-- ============================================================
-- LISTO - SERVICIO CREADO
-- ============================================================
