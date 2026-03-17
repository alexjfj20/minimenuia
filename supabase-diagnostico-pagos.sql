-- ============================================================
-- DIAGNÓSTICO - Configuración de Pagos
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Verificar si existe la tabla payment_gateway
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'payment_gateway'
) as tabla_existe;

-- 2. Si existe, ver datos
SELECT 
  id,
  stripe_enabled,
  nequi_enabled,
  bancolombia_enabled,
  hotmart_enabled,
  created_at,
  updated_at
FROM payment_gateway
LIMIT 1;

-- 3. Si NO existe, crear la tabla
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

-- 4. Insertar fila por defecto si no existe
INSERT INTO public.payment_gateway DEFAULT VALUES
ON CONFLICT (id) DO NOTHING;

-- 5. Habilitar RLS
ALTER TABLE public.payment_gateway ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS
DROP POLICY IF EXISTS "authenticated_select" ON public.payment_gateway;
DROP POLICY IF EXISTS "service_role_all" ON public.payment_gateway;
DROP POLICY IF EXISTS "super_admin_all" ON public.payment_gateway;

CREATE POLICY "authenticated_select"
  ON public.payment_gateway
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_role_all"
  ON public.payment_gateway
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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

-- 7. Verificar configuración actual
SELECT 
  'stripe' as pasarela,
  stripe_enabled as habilitado
FROM payment_gateway
UNION ALL
SELECT 'nequi', nequi_enabled
FROM payment_gateway
UNION ALL
SELECT 'bancolombia', bancolombia_enabled
FROM payment_gateway
UNION ALL
SELECT 'hotmart', hotmart_enabled
FROM payment_gateway;

-- ============================================================
-- LISTO - TABLA CREADA Y CONFIGURADA
-- ============================================================
