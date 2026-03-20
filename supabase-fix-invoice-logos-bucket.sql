-- Script para CORREGIR errores de Row Level Security en bucket invoice-logos
-- Ejecutar en el SQL Editor de Supabase
-- Versión simplificada - NO requiere permisos de owner

-- ========================================
-- PASO 1: Asegurar que el bucket existe y es público
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
-- PASO 2: Eliminar políticas existentes (solo las que puedas eliminar)
-- ========================================

DROP POLICY IF EXISTS "invoice_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_select" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_delete" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir logos" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar sus logos" ON storage.objects;

-- ========================================
-- PASO 3: Crear políticas PERMISIVAS
-- ========================================

-- Política INSERT: Cualquier usuario autenticado puede subir archivos al bucket
CREATE POLICY "invoice_logos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-logos');

-- Política SELECT: Cualquiera puede ver archivos (público)
CREATE POLICY "invoice_logos_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoice-logos');

-- Política UPDATE: Cualquier usuario autenticado puede actualizar
CREATE POLICY "invoice_logos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoice-logos');

-- Política DELETE: Cualquier usuario autenticado puede eliminar
CREATE POLICY "invoice_logos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-logos');

-- ========================================
-- PASO 4: Verificar configuración
-- ========================================

-- Verificar que el bucket existe
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'invoice-logos';

-- ========================================
-- MENSAJE FINAL
-- ========================================
-- Si llegaste hasta aquí sin errores, el bucket está configurado correctamente.
-- Ve a Storage en Supabase y verifica que el bucket 'invoice-logos' aparece.

-- NOTA: Si ves errores de permisos, asegúrate de estar logueado como el dueño del proyecto Supabase.
