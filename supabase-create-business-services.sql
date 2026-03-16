-- ============================================================
-- CREAR TABLA business_services SI NO EXISTE
-- ============================================================
-- Esta tabla relaciona negocios con servicios asignados
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

COMMENT ON COLUMN public.business_services.business_id IS 
  'ID del negocio al que se asigna el servicio';

COMMENT ON COLUMN public.business_services.service_id IS 
  'ID del servicio global asignado';

COMMENT ON COLUMN public.business_services.status IS 
  'Estado del servicio: active o inactive';

COMMENT ON COLUMN public.business_services.ai_credits_used IS 
  'Créditos de IA utilizados en el período actual';

COMMENT ON COLUMN public.business_services.ai_credits_reset_date IS 
  'Fecha del próximo reinicio automático de créditos';

-- ============================================================
-- PERMISOS Y RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- Grant para roles autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_services TO authenticated;
GRANT SELECT ON public.business_services TO anon;

-- Policy: Super Admin puede hacer todo
DROP POLICY IF EXISTS "super_admin_full_access" ON public.business_services;
CREATE POLICY "super_admin_full_access"
  ON public.business_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy: Negocios pueden ver sus propios servicios
DROP POLICY IF EXISTS "businesses_view_own_services" ON public.business_services;
CREATE POLICY "businesses_view_own_services"
  ON public.business_services
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_id = auth.uid()
    )
  );

-- Policy: Negocios pueden actualizar sus créditos de IA
DROP POLICY IF EXISTS "businesses_update_own_credits" ON public.business_services;
CREATE POLICY "businesses_update_own_credits"
  ON public.business_services
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- CREAR TABLA services SI NO EXISTE (servicios globales)
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
-- PERMISOS PARA services
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver servicios activos
DROP POLICY IF EXISTS "everyone_view_active_services" ON public.services;
CREATE POLICY "everyone_view_active_services"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Policy: Super Admin puede hacer todo
DROP POLICY IF EXISTS "super_admin_full_access_services" ON public.services;
CREATE POLICY "super_admin_full_access_services"
  ON public.services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================================
-- DATOS DE SEMILLA (Seed Data)
-- ============================================================

-- Insertar servicio "IA para Catálogo" si no existe
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
-- RECARGAR SCHEMA DE POSTGREST
-- ============================================================

-- Notificar a PostgREST para recargar el schema
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar que todo está correcto:

-- 1. Verificar tablas creadas
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('business_services', 'services');

-- 2. Verificar servicio "IA para Catálogo"
-- SELECT id, name, description, price, trial_enabled, status 
-- FROM public.services 
-- WHERE name = 'IA para Catálogo';

-- 3. Verificar permisos
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_name = 'business_services';

-- ============================================================
