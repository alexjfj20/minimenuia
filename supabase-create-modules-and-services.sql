-- ============================================================
-- CREAR TABLAS modules Y services
-- ============================================================
-- Orden correcto:
-- 1. Crear tabla services
-- 2. Crear tabla modules
-- ============================================================

-- ============================================================
-- PASO 1: CREAR TABLA services (si no existe)
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
-- PASO 2: CREAR TABLA modules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text DEFAULT 'addon' CHECK (type IN ('core', 'addon')),
  icon text DEFAULT 'zap',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_modules_name ON public.modules(name);
CREATE INDEX IF NOT EXISTS idx_modules_type ON public.modules(type);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.modules(status);

-- Comentario
COMMENT ON TABLE public.modules IS 
  'Módulos del sistema (core y addon)';

-- ============================================================
-- PASO 3: INSERTAR DATOS DE EJEMPLO
-- ============================================================

-- Insertar módulos core por defecto
INSERT INTO public.modules (name, description, type, icon, status)
VALUES 
  ('Dashboard', 'Panel de control principal', 'core', 'LayoutDashboard', 'active'),
  ('Productos', 'Gestión de productos y menú', 'core', 'Package', 'active'),
  ('Pedidos', 'Gestión de pedidos', 'core', 'ShoppingCart', 'active'),
  ('Clientes', 'Base de datos de clientes', 'core', 'Users', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASO 4: PERMISOS RLS SIMPLIFICADOS
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

-- Habilitar RLS para modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para modules
DROP POLICY IF EXISTS "authenticated_all_modules" ON public.modules;

-- Política simple para modules
CREATE POLICY "authenticated_all_modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants para modules
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT ON public.modules TO anon;

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
AND table_name IN ('services', 'modules');

-- 2. Verificar módulos core
SELECT id, name, type, status FROM public.modules WHERE type = 'core';

-- ============================================================
