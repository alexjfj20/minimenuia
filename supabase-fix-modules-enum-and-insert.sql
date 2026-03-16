-- ============================================================
-- CORREGIR TABLA modules Y AGREGAR DATOS
-- ============================================================
-- Problema: El ENUM ModuleType no acepta 'core'
-- Solución: Eliminar restricción antigua y crear ENUM correcto
-- ============================================================

-- ============================================================
-- PASO 1: ELIMINAR RESTRICCIÓN CHECK ANTIGUA (si existe)
-- ============================================================

-- Verificar y eliminar restricción check antigua en type
ALTER TABLE public.modules
DROP CONSTRAINT IF EXISTS modules_type_check;

ALTER TABLE public.modules
DROP CONSTRAINT IF EXISTS modules_type_check1;

-- ============================================================
-- PASO 2: CREAR O REEMPLAZAR ENUM ModuleType
-- ============================================================

-- Crear el tipo ENUM si no existe
DO $$ BEGIN
    CREATE TYPE "ModuleType" AS ENUM ('core', 'addon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- PASO 3: CAMBIAR COLUMNA type A USAR EL ENUM CORRECTO
-- ============================================================

-- Cambiar el tipo de la columna type a ModuleType
ALTER TABLE public.modules
ALTER COLUMN type TYPE "ModuleType" USING 
  CASE 
    WHEN type = 'core' THEN 'core'::"ModuleType"
    WHEN type = 'addon' THEN 'addon'::"ModuleType"
    ELSE 'addon'::"ModuleType"
  END;

-- Establecer valor por defecto
ALTER TABLE public.modules
ALTER COLUMN type SET DEFAULT 'addon'::"ModuleType";

-- ============================================================
-- PASO 4: INSERTAR MÓDULOS CORE
-- ============================================================

-- Insertar módulos core usando UUIDs específicos para evitar conflictos
INSERT INTO public.modules (id, name, description, type, icon, status, created_at, updated_at)
VALUES 
  ('mod-dashboard-001', 'Dashboard', 'Panel de control principal', 'core'::"ModuleType", 'LayoutDashboard', 'active', NOW(), NOW()),
  ('mod-products-001', 'Productos', 'Gestión de productos y menú', 'core'::"ModuleType", 'Package', 'active', NOW(), NOW()),
  ('mod-orders-001', 'Pedidos', 'Gestión de pedidos', 'core'::"ModuleType", 'ShoppingCart', 'active', NOW(), NOW()),
  ('mod-customers-001', 'Clientes', 'Base de datos de clientes', 'core'::"ModuleType", 'Users', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASO 5: VERIFICAR DATOS INSERTADOS
-- ============================================================

-- Verificar que se insertaron los módulos
SELECT id, name, type, status FROM public.modules WHERE type = 'core'::"ModuleType";

-- ============================================================
-- NOTA: Tabla system_services
-- ============================================================
-- La tabla system_services está vacía porque no se está usando.
-- Los servicios ahora se guardan en la tabla 'services' que ya tiene datos.
-- No es necesario hacer nada con system_services.
-- ============================================================

-- ============================================================
-- NOTA: Tabla integrations
-- ============================================================
-- La tabla integrations no existe. Si la necesitas, ejecuta:
-- CREATE TABLE public.integrations (...);
-- Por ahora no la creamos porque no hay funcionalidad definida.
-- ============================================================
