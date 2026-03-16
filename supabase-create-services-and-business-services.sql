-- ============================================================
-- CREAR TABLAS services Y business_services
-- ============================================================
-- Orden correcto:
-- 1. Crear tabla services (padre)
-- 2. Crear tabla business_services (hijo, con FK a services)
-- ============================================================

-- ============================================================
-- PASO 1: CREAR TABLA services
-- ============================================================

CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  price numeric DEFAULT 0,
  currency text DEFAULT 'COP',
  billing_type text DEFAULT 'monthly',
  trial_enabled boolean DEFAULT false,
  trial_days integer DEFAULT NULL,
  trial_ai_credits integer DEFAULT NULL,
  ai_credits_included integer DEFAULT 0,
  ai_credits_limit integer DEFAULT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services(name);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);

-- Comentario
COMMENT ON TABLE public.services IS 
  'Servicios globales del sistema que pueden asignarse a negocios';

-- ============================================================
-- PASO 2: CREAR TABLA business_services
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  ai_credits_used integer DEFAULT 0,
  ai_credits_reset_date timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, service_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_business_services_business_id 
  ON public.business_services(business_id);

CREATE INDEX IF NOT EXISTS idx_business_services_service_id 
  ON public.business_services(service_id);

CREATE INDEX IF NOT EXISTS idx_business_services_status 
  ON public.business_services(status);

-- Comentario descriptivo
COMMENT ON TABLE public.business_services IS 
  'Relación muchos-a-muchos entre negocios y servicios asignados';

-- ============================================================
-- PASO 3: PERMISOS RLS SIMPLIFICADOS
-- ============================================================

-- Habilitar RLS para services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para services
DROP POLICY IF EXISTS "authenticated_all_services" ON public.services;

-- Política simple para services
CREATE POLICY "authenticated_all_services"
  ON public.services
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants para services
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;

-- Habilitar RLS para business_services
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para business_services
DROP POLICY IF EXISTS "authenticated_all_business_services" ON public.business_services;

-- Política simple para business_services
CREATE POLICY "authenticated_all_business_services"
  ON public.business_services
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants para business_services
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_services TO authenticated;
GRANT SELECT ON public.business_services TO anon;

-- ============================================================
-- PASO 4: INSERTAR SERVICIO "IA para Catálogo"
-- ============================================================

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
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  trial_enabled = EXCLUDED.trial_enabled,
  trial_days = EXCLUDED.trial_days,
  trial_ai_credits = EXCLUDED.trial_ai_credits,
  ai_credits_included = EXCLUDED.ai_credits_included,
  ai_credits_limit = EXCLUDED.ai_credits_limit,
  updated_at = now();

-- ============================================================
-- PASO 5: RECARGAR SCHEMA
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar:

-- 1. Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('services', 'business_services');

-- 2. Verificar servicio "IA para Catálogo"
SELECT id, name, description, price, trial_enabled, status 
FROM public.services 
WHERE name = 'IA para Catálogo';

-- ============================================================
