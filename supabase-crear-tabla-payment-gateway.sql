-- ============================================================
-- TABLA PAYMENT_GATEWAY - Configuración de Pasarelas de Pago
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Crear tabla payment_gateway
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

-- Habilitar RLS
ALTER TABLE public.payment_gateway ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "authenticated_select" ON public.payment_gateway;
DROP POLICY IF EXISTS "service_role_all" ON public.payment_gateway;
DROP POLICY IF EXISTS "super_admin_all" ON public.payment_gateway;

-- Permitir lectura a todos los autenticados
CREATE POLICY "authenticated_select"
  ON public.payment_gateway
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir todo a service_role
CREATE POLICY "service_role_all"
  ON public.payment_gateway
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Permitir todo a super admin
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

-- Función para obtener configuración
CREATE OR REPLACE FUNCTION public.get_payment_gateway()
RETURNS TABLE (
  id UUID,
  stripe_enabled BOOLEAN,
  stripe_mode VARCHAR,
  stripe_public_key TEXT,
  stripe_secret_key TEXT,
  stripe_instructions TEXT,
  mercado_pago_enabled BOOLEAN,
  mercado_pago_mode VARCHAR,
  mercado_pago_public_key TEXT,
  mercado_pago_secret_key TEXT,
  mercado_pago_instructions TEXT,
  paypal_enabled BOOLEAN,
  paypal_mode VARCHAR,
  paypal_public_key TEXT,
  paypal_secret_key TEXT,
  paypal_instructions TEXT,
  nequi_enabled BOOLEAN,
  nequi_account_number VARCHAR,
  nequi_account_holder VARCHAR,
  nequi_instructions TEXT,
  nequi_qr_code_url TEXT,
  bancolombia_enabled BOOLEAN,
  bancolombia_account_number VARCHAR,
  bancolombia_account_holder VARCHAR,
  bancolombia_instructions TEXT,
  bancolombia_qr_code_url TEXT,
  daviplata_enabled BOOLEAN,
  daviplata_account_number VARCHAR,
  daviplata_account_holder VARCHAR,
  daviplata_instructions TEXT,
  daviplata_qr_code_url TEXT,
  bre_b_enabled BOOLEAN,
  bre_b_account_number VARCHAR,
  bre_b_account_holder VARCHAR,
  bre_b_instructions TEXT,
  bre_b_qr_code_url TEXT,
  hotmart_enabled BOOLEAN,
  hotmart_instructions TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.payment_gateway LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_gateway'
ORDER BY ordinal_position;

-- ============================================================
-- LISTO - TABLA CREADA
-- ============================================================
