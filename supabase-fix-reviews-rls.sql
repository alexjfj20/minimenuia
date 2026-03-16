-- ============================================================
-- MÓDULO DE RESEÑAS Y FIDELIZACIÓN - CORRECCIÓN RLS
-- ============================================================
-- Este script corrige las políticas RLS para permitir INSERT
-- ============================================================

-- ============================================================
-- PASO 1: ELIMINAR POLÍTICAS EXISTENTES
-- ============================================================

-- Eliminar políticas de reviews
DROP POLICY IF EXISTS "authenticated_select_reviews" ON public.reviews;
DROP POLICY IF EXISTS "authenticated_insert_reviews" ON public.reviews;
DROP POLICY IF EXISTS "public_select_reviews" ON public.reviews;
DROP POLICY IF EXISTS "public_insert_reviews" ON public.reviews;

-- Eliminar políticas de loyalty_points
DROP POLICY IF EXISTS "authenticated_select_own_loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "authenticated_insert_loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "authenticated_update_own_loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "public_select_loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "public_insert_loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "public_update_loyalty" ON public.loyalty_points;

-- ============================================================
-- PASO 2: CREAR POLÍTICAS CORRECTAS PARA reviews
-- ============================================================

-- Política para SELECT (cualquiera puede ver reseñas)
CREATE POLICY "public_select_reviews"
  ON public.reviews
  FOR SELECT
  TO public
  USING (true);

-- Política para INSERT (cualquiera puede dejar reseña)
CREATE POLICY "public_insert_reviews"
  ON public.reviews
  FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================================
-- PASO 3: CREAR POLÍTICAS CORRECTAS PARA loyalty_points
-- ============================================================

-- Política para SELECT (cada cliente ve sus propios puntos)
CREATE POLICY "public_select_loyalty"
  ON public.loyalty_points
  FOR SELECT
  TO public
  USING (true);

-- Política para INSERT (crear registro de puntos)
CREATE POLICY "public_insert_loyalty"
  ON public.loyalty_points
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para UPDATE (actualizar puntos propios)
CREATE POLICY "public_update_loyalty"
  ON public.loyalty_points
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PASO 4: VERIFICAR POLÍTICAS CREADAS
-- ============================================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('reviews', 'loyalty_points')
ORDER BY tablename, policyname;

-- ============================================================
-- LISTO - AHORA DEBERÍA FUNCIONAR EL INSERT
-- ============================================================
