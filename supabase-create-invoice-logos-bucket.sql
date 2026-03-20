-- Crear bucket para logos de facturas en Supabase Storage
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear el bucket 'invoice-logos' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-logos',
  'invoice-logos',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 2097152;

-- 2. Eliminar políticas existentes si hay conflictos
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir logos" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar sus logos" ON storage.objects;

-- 3. Crear política para permitir inserts (cualquier usuario autenticado puede subir al bucket invoice-logos)
CREATE POLICY "Usuarios autenticados pueden subir logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-logos'
);

-- 4. Crear política para permitir lectura pública
CREATE POLICY "Cualquiera puede ver logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoice-logos');

-- 5. Crear política para permitir actualizaciones (upsert)
CREATE POLICY "Usuarios autenticados pueden actualizar sus logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoice-logos'
);

-- 6. Crear política para permitir eliminaciones
CREATE POLICY "Usuarios autenticados pueden eliminar sus logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-logos'
);

-- 7. Habilitar RLS en la tabla storage.objects (por si acaso)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Nota: Después de ejecutar este script, verifica en Supabase Storage
-- que el bucket 'invoice-logos' esté configurado como público
