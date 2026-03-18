-- ============================================================
-- DOCUMENTACIÓN: MIGRACIÓN DE PASARELAS DE PAGO A SUPABASE
-- ============================================================
-- Estado: ✅ COMPLETADO
-- Fecha: 2026-03-17
-- ============================================================

-- ============================================================
-- 1. TABLA REQUERIDA: payment_gateway
-- ============================================================
-- Esta tabla ya fue creada. Si necesitas recrearla:

CREATE TABLE IF NOT EXISTS public.payment_gateway (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe
  stripe_enabled BOOLEAN DEFAULT false,
  stripe_mode VARCHAR(50) DEFAULT 'sandbox',
  stripe_public_key TEXT DEFAULT '',
  stripe_secret_key TEXT DEFAULT '',
  stripe_instructions TEXT DEFAULT '',
  
  -- Mercado Pago
  mercado_pago_enabled BOOLEAN DEFAULT false,
  mercado_pago_mode VARCHAR(50) DEFAULT 'sandbox',
  mercado_pago_public_key TEXT DEFAULT '',
  mercado_pago_secret_key TEXT DEFAULT '',
  mercado_pago_instructions TEXT DEFAULT '',
  
  -- PayPal
  paypal_enabled BOOLEAN DEFAULT false,
  paypal_mode VARCHAR(50) DEFAULT 'sandbox',
  paypal_public_key TEXT DEFAULT '',
  paypal_secret_key TEXT DEFAULT '',
  paypal_instructions TEXT DEFAULT '',
  
  -- Nequi
  nequi_enabled BOOLEAN DEFAULT false,
  nequi_account_number VARCHAR(50) DEFAULT '',
  nequi_account_holder VARCHAR(100) DEFAULT '',
  nequi_instructions TEXT DEFAULT '',
  nequi_qr_code_url TEXT DEFAULT NULL,
  
  -- Bancolombia
  bancolombia_enabled BOOLEAN DEFAULT false,
  bancolombia_account_number VARCHAR(50) DEFAULT '',
  bancolombia_account_holder VARCHAR(100) DEFAULT '',
  bancolombia_instructions TEXT DEFAULT '',
  bancolombia_qr_code_url TEXT DEFAULT NULL,
  
  -- Daviplata
  daviplata_enabled BOOLEAN DEFAULT false,
  daviplata_account_number VARCHAR(50) DEFAULT '',
  daviplata_account_holder VARCHAR(100) DEFAULT '',
  daviplata_instructions TEXT DEFAULT '',
  daviplata_qr_code_url TEXT DEFAULT NULL,
  
  -- BRE-B
  bre_b_enabled BOOLEAN DEFAULT false,
  bre_b_account_number VARCHAR(50) DEFAULT '',
  bre_b_account_holder VARCHAR(100) DEFAULT '',
  bre_b_instructions TEXT DEFAULT '',
  bre_b_qr_code_url TEXT DEFAULT NULL,
  
  -- Hotmart
  hotmart_enabled BOOLEAN DEFAULT false,
  hotmart_instructions TEXT DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar fila por defecto (si no existe)
INSERT INTO public.payment_gateway DEFAULT VALUES
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================

ALTER TABLE public.payment_gateway ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a todos los autenticados
CREATE POLICY "authenticated_select"
  ON public.payment_gateway
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir todo a service_role (para operaciones del backend)
CREATE POLICY "service_role_all"
  ON public.payment_gateway
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Permitir todo a super_admin
CREATE POLICY "super_admin_all"
  ON public.payment_gateway
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'SUPER_ADMIN'
    )
  );

-- ============================================================
-- 3. VERIFICACIÓN DE MIGRACIÓN
-- ============================================================
-- Ejecutar para verificar que todo está correcto

-- Verificar si existe la tabla
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'payment_gateway'
) as tabla_existe;

-- Verificar datos en la tabla
SELECT 
  id,
  hotmart_enabled,
  nequi_enabled,
  nequi_account_number,
  bancolombia_enabled,
  bancolombia_account_number,
  updated_at
FROM payment_gateway;

-- Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'payment_gateway'
ORDER BY policyname;

-- ============================================================
-- 4. IMPLEMENTACIÓN ACTUAL
-- ============================================================
-- La migración YA ESTÁ COMPLETADA en los siguientes archivos:

-- Backend (API):
-- - src/app/api/payment-config/route.ts (GET/POST desde Supabase)

-- Servicio:
-- - src/services/api.ts (paymentConfigService usa Supabase)

-- Frontend:
-- - src/components/minimenu/SuperAdminPanel.tsx (usa el servicio)
-- - src/components/minimenu/BusinessAdminPanel.tsx (lee desde API)

-- Contexto Global:
-- - src/contexts/ToastContext.tsx (notificaciones)
-- - src/app/layout.tsx (ToastProvider)

-- ============================================================
-- 5. FLUJO DE DATOS
-- ============================================================
/*
Super Admin Panel (Pagos Tab)
    ↓
    ↓ [Guardar Configuración]
    ↓
paymentConfigService.update(config)
    ↓
    ↓ [POST /api/payment-config]
    ↓
supabase.from('payment_gateway').upsert(config)
    ↓
    ↓ [Tabla: payment_gateway]
    ↓
Datos persistidos en Supabase ✅

---

Admin Panel (Suscripción → Planes)
    ↓
    ↓ [Seleccionar Plan]
    ↓
fetch('/api/payment-config')
    ↓
    ↓ [GET /api/payment-config]
    ↓
supabase.from('payment_gateway').select('*')
    ↓
    ↓ [Datos desde Supabase]
    ↓
Muestra métodos de pago configurados ✅
*/

-- ============================================================
-- 6. COMANDOS ÚTILES
-- ============================================================

-- Limpiar configuración (resetear todo)
UPDATE payment_gateway 
SET 
  stripe_enabled = false,
  nequi_enabled = false,
  bancolombia_enabled = false,
  hotmart_enabled = false,
  updated_at = NOW();

-- Verificar último update
SELECT 
  'Hotmart' as pasarela, 
  hotmart_enabled as enabled, 
  updated_at 
FROM payment_gateway
UNION ALL
SELECT 'Nequi', nequi_enabled, updated_at FROM payment_gateway
UNION ALL
SELECT 'Bancolombia', bancolombia_enabled, updated_at FROM payment_gateway;

-- ============================================================
-- 7. VERIFICACIÓN FINAL
-- ============================================================

DO $$
DECLARE
  tabla_existe BOOLEAN;
  tiene_datos BOOLEAN;
  rls_habilitado BOOLEAN;
BEGIN
  -- Verificar tabla
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'payment_gateway'
  ) INTO tabla_existe;
  
  -- Verificar datos
  SELECT EXISTS (
    SELECT 1 FROM payment_gateway
  ) INTO tiene_datos;
  
  -- Verificar RLS
  SELECT rowsecurity INTO rls_habilitado
  FROM pg_tables 
  WHERE tablename = 'payment_gateway';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICACIÓN DE MIGRACIÓN';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tabla payment_gateway existe: %', tabla_existe;
  RAISE NOTICE 'Tabla tiene datos: %', tiene_datos;
  RAISE NOTICE 'RLS habilitado: %', rls_habilitado;
  RAISE NOTICE '============================================';
  
  IF tabla_existe AND tiene_datos THEN
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
  ELSE
    RAISE NOTICE '❌ ERROR: Verificar migración';
  END IF;
  
  RAISE NOTICE '============================================';
END $$;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
