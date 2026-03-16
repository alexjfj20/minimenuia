-- ============================================================
-- CORREGIR TABLA modules - UUIDs CORRECTOS
-- ============================================================
-- Usa UUIDs válidos en formato correcto
-- ============================================================

-- ============================================================
-- PASO 1: ELIMINAR TABLA modules (si existe)
-- ============================================================

DROP TABLE IF EXISTS public.modules CASCADE;

-- ============================================================
-- PASO 2: ELIMINAR ENUMS EXISTENTES
-- ============================================================

DROP TYPE IF EXISTS "ModuleType";
DROP TYPE IF EXISTS "ModuleStatus";

-- ============================================================
-- PASO 3: CREAR ENUMS NUEVOS
-- ============================================================

CREATE TYPE "ModuleType" AS ENUM ('core', 'addon');
CREATE TYPE "ModuleStatus" AS ENUM ('active', 'inactive');

-- ============================================================
-- PASO 4: CREAR TABLA modules DESDE CERO
-- ============================================================

CREATE TABLE public.modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  type "ModuleType" DEFAULT 'addon'::"ModuleType" NOT NULL,
  icon text DEFAULT 'zap',
  status "ModuleStatus" DEFAULT 'active'::"ModuleStatus" NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_modules_name ON public.modules(name);
CREATE INDEX idx_modules_type ON public.modules(type);
CREATE INDEX idx_modules_status ON public.modules(status);

-- Comentario
COMMENT ON TABLE public.modules IS 
  'Módulos del sistema (core y addon)';

-- ============================================================
-- PASO 5: INSERTAR MÓDULOS CORE CON UUIDs VÁLIDOS
-- ============================================================

INSERT INTO public.modules (id, name, description, type, icon, status)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Dashboard', 'Panel de control principal', 'core'::"ModuleType", 'LayoutDashboard', 'active'::"ModuleStatus"),
  ('a0000000-0000-0000-0000-000000000002', 'Productos', 'Gestión de productos y menú', 'core'::"ModuleType", 'Package', 'active'::"ModuleStatus"),
  ('a0000000-0000-0000-0000-000000000003', 'Pedidos', 'Gestión de pedidos', 'core'::"ModuleType", 'ShoppingCart', 'active'::"ModuleStatus"),
  ('a0000000-0000-0000-0000-000000000004', 'Clientes', 'Base de datos de clientes', 'core'::"ModuleType", 'Users', 'active'::"ModuleStatus");

-- ============================================================
-- PASO 6: PERMISOS RLS
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "authenticated_all_modules" ON public.modules;

-- Política simple
CREATE POLICY "authenticated_all_modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT ON public.modules TO anon;

-- ============================================================
-- PASO 7: VERIFICAR DATOS INSERTADOS
-- ============================================================

-- Verificar estructura de la tabla
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'modules' 
ORDER BY ordinal_position;

-- Verificar módulos insertados
SELECT id, name, type, icon, status FROM public.modules ORDER BY type DESC, name;

-- Contar total de módulos
SELECT COUNT(*) as total_modules FROM public.modules;

-- ============================================================
-- LISTO - AHORA DEBERÍAS VER 4 MÓDULOS CORE
-- ============================================================
