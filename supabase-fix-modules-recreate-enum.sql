-- ============================================================
-- CORREGIR TABLA modules - ELIMINAR ENUM Y RECREAR
-- ============================================================
-- Elimina el ENUM existente y lo recrea con los valores correctos
-- ============================================================

-- ============================================================
-- PASO 1: ELIMINAR COLUMNA type PRIMERO
-- ============================================================

ALTER TABLE public.modules
DROP COLUMN IF EXISTS type;

-- ============================================================
-- PASO 2: ELIMINAR TIPO ENUM EXISTENTE (si existe)
-- ============================================================

DROP TYPE IF EXISTS "ModuleType";

-- ============================================================
-- PASO 3: CREAR ENUM NUEVO CON VALORES CORRECTOS
-- ============================================================

CREATE TYPE "ModuleType" AS ENUM ('core', 'addon');

-- ============================================================
-- PASO 4: AGREGAR COLUMNA type CON ENUM NUEVO
-- ============================================================

ALTER TABLE public.modules
ADD COLUMN type "ModuleType" DEFAULT 'addon'::"ModuleType" NOT NULL;

-- ============================================================
-- PASO 5: INSERTAR MÓDULOS CORE
-- ============================================================

INSERT INTO public.modules (id, name, description, type, icon, status, created_at, updated_at)
VALUES 
  ('mod-dashboard-001', 'Dashboard', 'Panel de control principal', 'core'::"ModuleType", 'LayoutDashboard', 'active', NOW(), NOW()),
  ('mod-products-001', 'Productos', 'Gestión de productos y menú', 'core'::"ModuleType", 'Package', 'active', NOW(), NOW()),
  ('mod-orders-001', 'Pedidos', 'Gestión de pedidos', 'core'::"ModuleType", 'ShoppingCart', 'active', NOW(), NOW()),
  ('mod-customers-001', 'Clientes', 'Base de datos de clientes', 'core'::"ModuleType", 'Users', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASO 6: VERIFICAR DATOS INSERTADOS
-- ============================================================

-- Verificar que se insertaron los módulos
SELECT id, name, type, status FROM public.modules WHERE type = 'core'::"ModuleType" ORDER BY created_at;

-- Contar total de módulos
SELECT COUNT(*) as total_modules FROM public.modules;

-- ============================================================
-- LISTO - AHORA DEBERÍAS VER 4 MÓDULOS CORE
-- ============================================================
