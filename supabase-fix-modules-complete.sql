-- ============================================================
-- CORREGIR TABLA modules - AGREGAR COLUMNAS FALTANTES
-- ============================================================
-- Agrega las columnas necesarias y luego inserta los datos
-- ============================================================

-- ============================================================
-- PASO 1: AGREGAR COLUMNAS FALTANTES (si no existen)
-- ============================================================

-- Agregar columna icon si no existe
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'zap';

-- Agregar columna status si no existe
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Agregar columna created_at si no existe
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Agregar columna updated_at si no existe
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- PASO 2: ELIMINAR COLUMNA type Y RECREAR ENUM
-- ============================================================

-- Eliminar columna type
ALTER TABLE public.modules
DROP COLUMN IF EXISTS type;

-- Eliminar ENUM existente
DROP TYPE IF EXISTS "ModuleType";

-- Crear ENUM nuevo
CREATE TYPE "ModuleType" AS ENUM ('core', 'addon');

-- Agregar columna type con ENUM nuevo
ALTER TABLE public.modules
ADD COLUMN type "ModuleType" DEFAULT 'addon'::"ModuleType" NOT NULL;

-- ============================================================
-- PASO 3: INSERTAR MÓDULOS CORE
-- ============================================================

INSERT INTO public.modules (id, name, description, type, icon, status, created_at, updated_at)
VALUES 
  ('mod-dashboard-001', 'Dashboard', 'Panel de control principal', 'core'::"ModuleType", 'LayoutDashboard', 'active', NOW(), NOW()),
  ('mod-products-001', 'Productos', 'Gestión de productos y menú', 'core'::"ModuleType", 'Package', 'active', NOW(), NOW()),
  ('mod-orders-001', 'Pedidos', 'Gestión de pedidos', 'core'::"ModuleType", 'ShoppingCart', 'active', NOW(), NOW()),
  ('mod-customers-001', 'Clientes', 'Base de datos de clientes', 'core'::"ModuleType", 'Users', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASO 4: VERIFICAR DATOS INSERTADOS
-- ============================================================

-- Verificar estructura de la tabla
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'modules' 
ORDER BY ordinal_position;

-- Verificar módulos insertados
SELECT id, name, type, icon, status FROM public.modules WHERE type = 'core'::"ModuleType" ORDER BY created_at;

-- Contar total de módulos
SELECT COUNT(*) as total_modules FROM public.modules;

-- ============================================================
-- LISTO - AHORA DEBERÍAS VER 4 MÓDULOS CORE
-- ============================================================
