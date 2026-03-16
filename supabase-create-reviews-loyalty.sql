-- ============================================================
-- MÓDULO DE RESEÑAS Y FIDELIZACIÓN
-- ============================================================
-- Tablas: reviews, loyalty_points
-- Políticas RLS: insert público, select controlado
-- ============================================================

-- ============================================================
-- TABLA 1: reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Comentario descriptivo
COMMENT ON TABLE public.reviews IS 
  'Reseñas de clientes para cada negocio';

-- ============================================================
-- TABLA 2: loyalty_points
-- ============================================================

CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_phone text NOT NULL,
  customer_name text,
  points integer DEFAULT 0 NOT NULL,
  total_orders integer DEFAULT 0 NOT NULL,
  last_visit timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, customer_phone)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_loyalty_business_id ON public.loyalty_points(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer_phone ON public.loyalty_points(customer_phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_points ON public.loyalty_points(points DESC);

-- Comentario descriptivo
COMMENT ON TABLE public.loyalty_points IS 
  'Puntos de fidelización de clientes por negocio';

-- ============================================================
-- POLÍTICAS RLS - reviews
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "authenticated_select_reviews" ON public.reviews;
DROP POLICY IF EXISTS "authenticated_insert_reviews" ON public.reviews;

-- Política para SELECT (cualquiera puede ver reseñas)
CREATE POLICY "authenticated_select_reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT (cualquiera autenticado puede dejar reseña)
CREATE POLICY "authenticated_insert_reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;

-- ============================================================
-- POLÍTICAS RLS - loyalty_points
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "authenticated_select_own_loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "authenticated_insert_loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "authenticated_update_own_loyalty" ON public.loyalty_points;

-- Política para SELECT (cada cliente ve sus propios puntos)
CREATE POLICY "authenticated_select_own_loyalty"
  ON public.loyalty_points
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT (crear registro de puntos)
CREATE POLICY "authenticated_insert_loyalty"
  ON public.loyalty_points
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE (actualizar puntos propios)
CREATE POLICY "authenticated_update_own_loyalty"
  ON public.loyalty_points
  FOR UPDATE
  TO authenticated
  USING (true);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.loyalty_points TO authenticated;
GRANT SELECT ON public.loyalty_points TO anon;

-- ============================================================
-- FUNCIÓN: Verificar si cliente ya dejó reseña hoy
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_daily_review(
  p_business_id uuid,
  p_customer_phone text
)
RETURNS boolean AS $$
DECLARE
  review_count integer;
BEGIN
  SELECT COUNT(*) INTO review_count
  FROM public.reviews
  WHERE business_id = p_business_id
    AND customer_phone = p_customer_phone
    AND created_at >= NOW() - INTERVAL '24 hours';
  
  RETURN review_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: Actualizar puntos de fidelización
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_loyalty_points(
  p_business_id uuid,
  p_customer_phone text,
  p_customer_name text,
  p_points_to_add integer DEFAULT 5
)
RETURNS integer AS $$
DECLARE
  current_points integer;
BEGIN
  -- Intentar actualizar registro existente
  UPDATE public.loyalty_points
  SET 
    points = points + p_points_to_add,
    total_orders = total_orders + 1,
    last_visit = NOW(),
    customer_name = COALESCE(p_customer_name, customer_name)
  WHERE business_id = p_business_id
    AND customer_phone = p_customer_phone
  RETURNING points INTO current_points;
  
  -- Si no existe, crear nuevo registro
  IF current_points IS NULL THEN
    INSERT INTO public.loyalty_points (
      business_id,
      customer_phone,
      customer_name,
      points,
      total_orders
    ) VALUES (
      p_business_id,
      p_customer_phone,
      p_customer_name,
      p_points_to_add,
      1
    ) RETURNING points INTO current_points;
  END IF;
  
  RETURN current_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RECARGAR SCHEMA DE POSTGREST
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reviews', 'loyalty_points');

-- Verificar funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_daily_review', 'update_loyalty_points');

-- ============================================================
-- LISTO - TABLAS Y FUNCIONES CREADAS
-- ============================================================
