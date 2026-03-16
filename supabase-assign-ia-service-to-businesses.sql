-- ============================================================
-- ASIGNAR SERVICIO "IA para Catálogo" A TODOS LOS NEGOCIOS
-- ============================================================
-- Este script asigna el servicio de IA a todos los negocios activos
-- para que puedan usar los botones de "Crear con IA" en el Catálogo
-- ============================================================

-- ============================================================
-- PASO 1: VERIFICAR QUE EXISTE EL SERVICIO "IA para Catálogo"
-- ============================================================

-- Obtener el ID del servicio "IA para Catálogo"
DO $$
DECLARE
  ia_service_id uuid;
BEGIN
  -- Buscar el servicio
  SELECT id INTO ia_service_id
  FROM public.services
  WHERE name = 'IA para Catálogo'
  LIMIT 1;
  
  -- Si no existe, crearlo
  IF ia_service_id IS NULL THEN
    INSERT INTO public.services (name, description, price, currency, billing_type, trial_enabled, trial_days, trial_ai_credits, ai_credits_included, ai_credits_limit, status)
    VALUES (
      'IA para Catálogo',
      'Generación automática de productos con IA para el catálogo del restaurante',
      29000,
      'COP',
      'monthly',
      true,
      7,
      50,
      100,
      200,
      'active'
    )
    RETURNING id INTO ia_service_id;
    
    RAISE NOTICE 'Servicio IA para Catálogo creado con ID: %', ia_service_id;
  ELSE
    RAISE NOTICE 'Servicio IA para Catálogo ya existe con ID: %', ia_service_id;
  END IF;
  
  -- ============================================================
  -- PASO 2: ASIGNAR SERVICIO A TODOS LOS NEGOCIOS ACTIVOS
  -- ============================================================
  
  -- Insertar registros en business_services para cada negocio activo
  INSERT INTO public.business_services (business_id, service_id, status, ai_credits_used, ai_credits_reset_date, created_at, updated_at)
  SELECT 
    b.id as business_id,
    ia_service_id as service_id,
    'active' as status,
    0 as ai_credits_used,
    (NOW() + INTERVAL '30 days') as ai_credits_reset_date,
    NOW() as created_at,
    NOW() as updated_at
  FROM public.businesses b
  WHERE b.status = 'active'
  ON CONFLICT (business_id, service_id) DO UPDATE SET
    status = 'active',
    updated_at = NOW();
  
  -- Reportar cuántos negocios recibieron el servicio
  RAISE NOTICE 'Servicio IA asignado a todos los negocios activos';
  
END $$;

-- ============================================================
-- PASO 3: VERIFICAR RESULTADO
-- ============================================================

-- Verificar asignaciones
SELECT 
  bs.id,
  b.name as business_name,
  s.name as service_name,
  bs.status,
  bs.ai_credits_used,
  bs.ai_credits_reset_date
FROM public.business_services bs
JOIN public.businesses b ON bs.business_id = b.id
JOIN public.services s ON bs.service_id = s.id
WHERE s.name = 'IA para Catálogo'
ORDER BY b.name;

-- Contar total de asignaciones
SELECT COUNT(*) as total_asignaciones 
FROM public.business_services bs
JOIN public.services s ON bs.service_id = s.id
WHERE s.name = 'IA para Catálogo';

-- ============================================================
-- LISTO - AHORA LOS NEGOCIOS PUEDEN USAR IA EN EL CATÁLOGO
-- ============================================================
