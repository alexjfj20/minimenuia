-- Script DEFINITIVO para configurar bucket invoice-logos
-- Ejecutar en el SQL Editor de Supabase
-- Este script verifica y corrige TODOS los aspectos de la configuración

-- ========================================
-- PASO 1: Verificar estado actual
-- ========================================

-- Mostrar buckets existentes
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'invoice-logos';

-- ========================================
-- PASO 2: Crear/actualizar el bucket
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-logos',
  'invoice-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/svg+xml'];

-- ========================================
-- PASO 3: Eliminar TODAS las políticas existentes relacionadas con logos
-- ========================================

-- Eliminar políticas con nombres conocidos
DROP POLICY IF EXISTS "invoice_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_select" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_delete" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir logos" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar sus logos" ON storage.objects;

-- Eliminar cualquier política que contenga 'logo' en el nombre (case-insensitive)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_catalog.pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname ILIKE '%logo%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Política INSERT: Cualquier usuario (público/anon) puede subir archivos al bucket invoice-logos
-- Se usa TO public porque la app usa su propio sistema de sesión, no Supabase Auth
CREATE POLICY "invoice_logos_insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'invoice-logos'
);

-- Política SELECT: CUALQUIER persona (autenticada o no) puede ver archivos del bucket
CREATE POLICY "invoice_logos_select"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'invoice-logos'
);

-- Política UPDATE: Cualquier usuario (público/anon) puede actualizar archivos del bucket
CREATE POLICY "invoice_logos_update"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'invoice-logos'
);

-- Política DELETE: Cualquier usuario (público/anon) puede eliminar archivos del bucket
CREATE POLICY "invoice_logos_delete"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'invoice-logos'
);

-- ========================================
-- PASO 5: Verificar que las políticas se crearon
-- ========================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_catalog.pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE 'invoice_logos%'
ORDER BY policyname;

-- ========================================
-- PASO 6: Mostrar configuración final
-- ========================================

SELECT 
  b.id as bucket_id,
  b.name as bucket_name,
  b.public as es_publico,
  b.file_size_limit as limite_bytes,
  COUNT(p.policyname) as numero_politicas
FROM storage.buckets b
LEFT JOIN pg_catalog.pg_policies p ON p.tablename = 'objects' AND p.policyname LIKE 'invoice_logos%'
WHERE b.id = 'invoice-logos'
GROUP BY b.id, b.name, b.public, b.file_size_limit;

-- ========================================
-- MENSAJE FINAL
-- ========================================
-- Si ves 4 políticas en el resultado y el bucket aparece como público (true),
-- la configuración es correcta.

-- PASOS SIGUIENTES:
-- 1. Ve a Storage en Supabase y verifica que el bucket 'invoice-logos' aparece
-- 2. Verifica que el bucket tiene el ícono de "mundo" (público)
-- 3. Ve a Policies y verifica que hay 4 políticas
-- 4. Prueba subir un logo en el Editor de Factura
