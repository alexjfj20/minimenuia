-- ============================================================
-- CREAR TABLA business_services
-- ============================================================
-- Esta tabla relaciona negocios con servicios asignados
-- Es requerida para la funcionalidad de "IA para Catálogo"
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
-- PERMISOS RLS SIMPLIFICADOS
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "authenticated_all_business_services" ON public.business_services;

-- Política simple: Todos los autenticados pueden ver/gestionar
CREATE POLICY "authenticated_all_business_services"
  ON public.business_services
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_services TO authenticated;
GRANT SELECT ON public.business_services TO anon;

-- ============================================================
-- RECARGAR SCHEMA
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar para confirmar:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'business_services';
-- ============================================================
