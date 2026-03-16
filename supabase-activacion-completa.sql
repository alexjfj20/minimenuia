-- ============================================================
-- SCRIPT COMPLETO - ACTIVACIÓN DE SERVICIOS MINIMENU
-- ============================================================
-- Propósito: Crear tablas, servicios y asignarlos a negocios
-- Ejecutar en: Supabase SQL Editor
-- Fecha: 2026-03-16
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: VERIFICAR Y CREAR TABLA SERVICES
-- ============================================================

-- Verificar si existe la tabla services
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
    RAISE NOTICE 'Creando tabla services...';
    
    CREATE TABLE public.services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      price DECIMAL(12,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'COP',
      billing_type VARCHAR(50) DEFAULT 'monthly',
      trial_days INTEGER DEFAULT 0,
      ai_credits_included INTEGER DEFAULT 0,
      ai_credits_limit INTEGER DEFAULT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabla services creada exitosamente';
  ELSE
    RAISE NOTICE 'Tabla services ya existe';
  END IF;
END $$;

-- ============================================================
-- PASO 2: VERIFICAR Y CREAR TABLA BUSINESS_SERVICES
-- ============================================================

-- Verificar si existe la tabla business_services
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_services') THEN
    RAISE NOTICE 'Creando tabla business_services...';
    
    CREATE TABLE public.business_services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
      service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      ai_credits_used INTEGER DEFAULT 0,
      ai_credits_limit INTEGER DEFAULT NULL,
      ai_credits_reset_date DATE DEFAULT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(business_id, service_id)
    );
    
    -- Índices para mejorar rendimiento
    CREATE INDEX IF NOT EXISTS idx_business_services_business_id ON public.business_services(business_id);
    CREATE INDEX IF NOT EXISTS idx_business_services_service_id ON public.business_services(service_id);
    CREATE INDEX IF NOT EXISTS idx_business_services_status ON public.business_services(status);
    
    RAISE NOTICE 'Tabla business_services creada exitosamente';
  ELSE
    RAISE NOTICE 'Tabla business_services ya existe';
  END IF;
END $$;

-- ============================================================
-- PASO 3: INSERTAR SERVICIOS POR DEFECTO
-- ============================================================

-- Insertar servicio "IA para Catálogo" si no existe
INSERT INTO public.services (id, name, description, status, price, currency, billing_type, trial_days, ai_credits_included, ai_credits_limit)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'IA para Catálogo',
  'Servicio de inteligencia artificial para generación automática de descripciones, imágenes y optimización de productos del menú',
  'active',
  29900,
  'COP',
  'monthly',
  7,
  50,
  100
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insertar servicio "Reseñas y Fidelización" si no existe
INSERT INTO public.services (id, name, description, status, price, currency, billing_type, trial_days, ai_credits_included, ai_credits_limit)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Reseñas y Fidelización',
  'Sistema de reseñas con calificación por estrellas y programa de puntos de fidelización para clientes frecuentes',
  'active',
  19900,
  'COP',
  'monthly',
  14,
  0,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insertar servicio "Chatbot WhatsApp" si no existe
INSERT INTO public.services (id, name, description, status, price, currency, billing_type, trial_days, ai_credits_included, ai_credits_limit)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Chatbot WhatsApp',
  'Chatbot con IA para atención automática de pedidos y consultas de clientes vía WhatsApp',
  'active',
  49900,
  'COP',
  'monthly',
  7,
  100,
  200
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

RAISE NOTICE 'Servicios por defecto insertados/actualizados';

-- ============================================================
-- PASO 4: VERIFICAR NEGOCIOS ACTIVOS
-- ============================================================

-- Mostrar negocios activos
RAISE NOTICE 'Negocios activos encontrados:';
SELECT id, name, status, created_at 
FROM public.businesses 
WHERE status = 'active'
ORDER BY created_at DESC;

-- ============================================================
-- PASO 5: ASIGNAR SERVICIOS A TODOS LOS NEGOCIOS ACTIVOS
-- ============================================================

-- Asignar servicio "IA para Catálogo" a todos los negocios activos
INSERT INTO public.business_services (business_id, service_id, status, ai_credits_used, ai_credits_reset_date)
SELECT 
  b.id,
  '00000000-0000-0000-0000-000000000001', -- IA para Catálogo
  'active',
  0,
  (NOW() + INTERVAL '30 days')::date
FROM public.businesses b
WHERE b.status = 'active'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- Asignar servicio "Reseñas y Fidelización" a todos los negocios activos
INSERT INTO public.business_services (business_id, service_id, status)
SELECT 
  b.id,
  '00000000-0000-0000-0000-000000000002', -- Reseñas y Fidelización
  'active'
FROM public.businesses b
WHERE b.status = 'active'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- Asignar servicio "Chatbot WhatsApp" a todos los negocios activos
INSERT INTO public.business_services (business_id, service_id, status, ai_credits_used, ai_credits_reset_date)
SELECT 
  b.id,
  '00000000-0000-0000-0000-000000000003', -- Chatbot WhatsApp
  'active',
  0,
  (NOW() + INTERVAL '30 days')::date
FROM public.businesses b
WHERE b.status = 'active'
ON CONFLICT (business_id, service_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

RAISE NOTICE 'Servicios asignados a todos los negocios activos';

-- ============================================================
-- PASO 6: CONFIGURAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================

-- Habilitar RLS en business_services
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (para evitar conflictos)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver business_services" ON public.business_services;
DROP POLICY IF EXISTS "Admins pueden gestionar business_services" ON public.business_services;
DROP POLICY IF EXISTS "Negocios pueden ver sus propios servicios" ON public.business_services;

-- Política para que usuarios autenticados puedan leer business_services
CREATE POLICY "Usuarios autenticados pueden ver business_services"
  ON public.business_services
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para que el servicio (usando service_role) pueda gestionar
CREATE POLICY "Admins pueden gestionar business_services"
  ON public.business_services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para que negocios puedan ver sus propios servicios
CREATE POLICY "Negocios pueden ver sus propios servicios"
  ON public.business_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_services.business_id
      AND b.user_id = auth.uid()
    )
  );

RAISE NOTICE 'Políticas RLS configuradas';

-- ============================================================
-- PASO 7: VERIFICAR RESULTADO
-- ============================================================

-- Mostrar todos los vínculos business_services
RAISE NOTICE 'Vínculos business_services creados:';
SELECT 
  bs.id,
  b.name as business_name,
  s.name as service_name,
  bs.status,
  bs.ai_credits_used,
  bs.ai_credits_limit,
  bs.ai_credits_reset_date,
  bs.created_at
FROM public.business_services bs
JOIN public.businesses b ON bs.business_id = b.id
JOIN public.services s ON bs.service_id = s.id
ORDER BY b.name, s.name;

-- Resumen por servicio
RAISE NOTICE 'Resumen de servicios por negocio:';
SELECT 
  s.name as servicio,
  COUNT(bs.id) as total_negocios,
  COUNT(CASE WHEN bs.status = 'active' THEN 1 END) as activos,
  COUNT(CASE WHEN bs.status = 'inactive' THEN 1 END) as inactivos
FROM public.business_services bs
JOIN public.services s ON bs.service_id = s.id
GROUP BY s.name
ORDER BY s.name;

-- ============================================================
-- PASO 8: MENSAJE FINAL
-- ============================================================

DO $$
DECLARE
  total_negocios INTEGER;
  total_vinculos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_negocios FROM public.businesses WHERE status = 'active';
  SELECT COUNT(DISTINCT business_id) INTO total_vinculos FROM public.business_services;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RESUMEN DE ACTIVACIÓN';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total negocios activos: %', total_negocios;
  RAISE NOTICE 'Negocios con servicios: %', total_vinculos;
  RAISE NOTICE '============================================';
  
  IF total_negocios = total_vinculos THEN
    RAISE NOTICE '✅ ÉXITO: Todos los negocios tienen servicios asignados';
  ELSE
    RAISE NOTICE '⚠️ ATENCIÓN: Hay % negocios sin servicios asignados', (total_negocios - total_vinculos);
  END IF;
  
  RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
