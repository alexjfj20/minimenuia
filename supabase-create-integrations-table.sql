-- ============================================================
-- CREAR TABLA integrations
-- ============================================================
-- Esta tabla almacena las integraciones externas disponibles
-- para los negocios (WhatsApp, Analytics, Pixel, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'zap',
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  config_url text,
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_integrations_name ON public.integrations(name);
CREATE INDEX IF NOT EXISTS idx_integrations_category ON public.integrations(category);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON public.integrations(is_active);

-- Comentario
COMMENT ON TABLE public.integrations IS 
  'Integraciones externas disponibles para los negocios';

-- ============================================================
-- INSERTAR INTEGRACIONES POR DEFECTO
-- ============================================================

INSERT INTO public.integrations (name, description, icon, category, is_active)
VALUES 
  ('WhatsApp Business', 'Envío automático de mensajes y notificaciones', 'MessageCircle', 'communication', true),
  ('Google Analytics', 'Seguimiento de visitas y métricas del sitio', 'BarChart', 'analytics', true),
  ('Facebook Pixel', 'Remarketing y seguimiento de conversiones', 'Globe', 'marketing', true),
  ('Slack', 'Notificaciones en tiempo real al equipo', 'MessageCircle', 'communication', true),
  ('Stripe', 'Pasarela de pagos online', 'CreditCard', 'payment', true),
  ('Mercado Pago', 'Pagos con tarjetas y efectivo', 'CreditCard', 'payment', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PERMISOS RLS
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "authenticated_all_integrations" ON public.integrations;

-- Política simple
CREATE POLICY "authenticated_all_integrations"
  ON public.integrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT SELECT ON public.integrations TO anon;

-- ============================================================
-- RECARGAR SCHEMA
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar estructura
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'integrations' 
ORDER BY ordinal_position;

-- Verificar integraciones insertadas
SELECT id, name, icon, category, is_active FROM public.integrations ORDER BY name;

-- Contar total
SELECT COUNT(*) as total_integrations FROM public.integrations;

-- ============================================================
-- LISTO - AHORA EXISTE LA TABLA integrations
-- ============================================================
