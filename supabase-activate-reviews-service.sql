-- ============================================================
-- ACTIVAR SERVICIO "RESEÑAS Y FIDELIZACIÓN" PARA TODOS LOS NEGOCIOS ACTIVOS
-- ============================================================
-- Este script inserta automáticamente el registro en business_services
-- para TODOS los negocios activos, sin necesidad de IDs manuales
-- ============================================================

-- ============================================================
-- PASO 1: INSERTAR PARA TODOS LOS NEGOCIOS ACTIVOS
-- ============================================================

INSERT INTO public.business_services (
  business_id,
  service_id,
  status,
  created_at,
  updated_at
)
SELECT 
  b.id,
  s.id,
  'active',
  NOW(),
  NOW()
FROM public.businesses b
CROSS JOIN public.services s
WHERE s.name = 'Reseñas y Fidelización'
  AND b.status = 'active'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- ============================================================
-- PASO 2: VERIFICAR QUE SE INSERTARON LOS REGISTROS
-- ============================================================

SELECT 
  bs.business_id,
  b.name as business_name,
  bs.service_id,
  s.name as service_name,
  bs.status,
  bs.created_at
FROM public.business_services bs
JOIN public.businesses b ON bs.business_id = b.id
JOIN public.services s ON bs.service_id = s.id
WHERE s.name = 'Reseñas y Fidelización'
ORDER BY b.name;

-- ============================================================
-- LISTO - AHORA DEBERÍA APARECER LA PESTAÑA "RESEÑAS" 
-- EN TODOS LOS NEGOCIOS ACTIVOS
-- ============================================================
