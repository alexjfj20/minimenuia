# Configuración de Supabase Storage para Logos de Facturas

## Problema
El error `[Invoice Editor] Upload error: {}` o `new row violates row-level security policy` ocurre porque:
1. El bucket `invoice-logos` no existe en Supabase Storage, O
2. Las políticas de seguridad (RLS) están bloqueando el upload

## ⚡ Solución Rápida (RECOMENDADA)

### Usar el script DEFINITIVO

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Navega a **SQL Editor** (en el menú lateral)
3. Haz clic en **New query**
4. Copia y pega el contenido completo del archivo `supabase-fix-invoice-logos-bucket-final.sql`
5. Haz clic en **Run** o presiona Ctrl+Enter
6. Verifica que el resultado muestre **4 políticas** creadas

**Importante:** 
- Debes estar logueado como el **dueño del proyecto** (no solo un colaborador)
- Si ves el error "must be owner of table objects", usa la **Opción B** abajo

Este script:
- ✅ Crea el bucket `invoice-logos` si no existe
- ✅ Configura el bucket como público
- ✅ Elimina TODAS las políticas conflictivas existentes
- ✅ Crea 4 políticas permisivas (INSERT, SELECT, UPDATE, DELETE)
- ✅ Verifica que las políticas se crearon correctamente

---

## Opción A: Script SQL (Dueño del proyecto)

Si eres el dueño del proyecto, usa el script `supabase-fix-invoice-logos-bucket-final.sql` como se describe arriba.

---

## Opción B: Configurar manualmente desde la UI (Si no tienes permisos SQL)

Si no puedes ejecutar SQL, configura el bucket manualmente:

### Paso 1: Crear el bucket

1. Ve a **Storage** en el menú lateral
2. Haz clic en **New bucket**
3. Configura:
   - **Name**: `invoice-logos`
   - **Public bucket**: ✅ Activado (¡MUY IMPORTANTE!)
   - **File size limit**: `2097152` (2MB)
4. Haz clic en **Create bucket**

### Paso 2: Crear las 4 políticas

Ve a la pestaña **Policies** del bucket y crea cada política haciendo clic en **New Policy** → **Create a policy from scratch**:

**Política 1 - INSERT:**
- Policy name: `invoice_logos_insert`
- Policy action: `INSERT`
- Policy target: `authenticated`
- Policy definition (WITH CHECK): `bucket_id = 'invoice-logos'`

**Política 2 - SELECT:**
- Policy name: `invoice_logos_select`
- Policy action: `SELECT`
- Policy target: `public`
- Policy definition (USING): `bucket_id = 'invoice-logos'`

**Política 3 - UPDATE:**
- Policy name: `invoice_logos_update`
- Policy action: `UPDATE`
- Policy target: `authenticated`
- Policy definition (USING): `bucket_id = 'invoice-logos'`

**Política 4 - DELETE:**
- Policy name: `invoice_logos_delete`
- Policy action: `DELETE`
- Policy target: `authenticated`
- Policy definition (USING): `bucket_id = 'invoice-logos'`

### Paso 3: Alternativa SQL para las políticas

Si puedes ejecutar SQL pero no crear el bucket, primero crea el bucket desde la UI y luego ejecuta este SQL para las políticas:

```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "invoice_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_select" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_delete" ON storage.objects;

-- Crear políticas
CREATE POLICY "invoice_logos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoice-logos');
CREATE POLICY "invoice_logos_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'invoice-logos');
CREATE POLICY "invoice_logos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'invoice-logos');
CREATE POLICY "invoice_logos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'invoice-logos');
```

---

## Verificación

### Paso 1: Verificar el bucket

1. Ve a **Storage** en el menú lateral
2. Deberías ver el bucket `invoice-logos` en la lista
3. El bucket debe tener:
   - ✅ Ícono de "mundo" (público)
   - Tamaño máximo: 2MB
   - Tipos permitidos: PNG, JPG, SVG

### Paso 2: Verificar las políticas

1. Haz clic en el bucket `invoice-logos`
2. Ve a la pestaña **Policies**
3. Deberías ver 4 políticas:
   - `invoice_logos_insert` (INSERT) - Para usuarios autenticados
   - `invoice_logos_select` (SELECT) - Público
   - `invoice_logos_update` (UPDATE) - Para usuarios autenticados
   - `invoice_logos_delete` (DELETE) - Para usuarios autenticados

### Paso 3: Probar el upload

1. Ve a **Editor de Factura** en tu aplicación
2. Sección **Logo** → Haz clic en **Subir Imagen**
3. Selecciona un archivo PNG, JPG o SVG (< 2MB)
4. Deberías ver: ✅ "Logo subido correctamente"

---

## Mensajes de Error y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "must be owner of table objects" | No tienes permisos de owner | Usa la Opción B (UI) o pide al dueño que ejecute el SQL |
| "new row violates row-level security policy" | Políticas RLS bloqueando | Ejecuta `supabase-fix-invoice-logos-bucket-final.sql` |
| "El bucket invoice-logos no existe" | Bucket no creado | Crea el bucket desde la UI o ejecuta el SQL |
| "No tienes permisos" | Políticas faltantes | Verifica que las 4 políticas existen |
| "Error de conexión" | Problemas de red | Verifica tu internet |
| "Solo se permiten archivos PNG, JPG o SVG" | Tipo de archivo inválido | Usa PNG, JPG o SVG |
| "El archivo no puede superar los 2MB" | Archivo muy grande | Comprime la imagen |

---

## Troubleshooting Avanzado

### Error RLS persiste después de ejecutar el script

1. **Verifica que las políticas existen:**
   - Ve a Storage → `invoice-logos` → Policies
   - Deberías ver exactamente 4 políticas

2. **Verifica que el bucket es público:**
   - Ve a Storage → `invoice-logos` → Configuration
   - "Public bucket" debe estar activado (verde)

3. **Elimina TODAS las políticas y recrea:**
   ```sql
   -- Eliminar todas
   DROP POLICY IF EXISTS "invoice_logos_insert" ON storage.objects;
   DROP POLICY IF EXISTS "invoice_logos_select" ON storage.objects;
   DROP POLICY IF EXISTS "invoice_logos_update" ON storage.objects;
   DROP POLICY IF EXISTS "invoice_logos_delete" ON storage.objects;
   
   -- Recrear
   CREATE POLICY "invoice_logos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoice-logos');
   CREATE POLICY "invoice_logos_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'invoice-logos');
   CREATE POLICY "invoice_logos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'invoice-logos');
   CREATE POLICY "invoice_logos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'invoice-logos');
   ```

4. **Recarga la página del navegador:**
   - Presiona Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

### El bucket existe pero es privado

1. Ve a **Storage** → `invoice-logos` → **Configuration**
2. Activa **Public bucket**
3. Guarda los cambios

### No eres el dueño del proyecto

Si eres un colaborador y no tienes permisos para ejecutar SQL:

1. **Opción 1:** Pide al dueño del proyecto que ejecute el script `supabase-fix-invoice-logos-bucket-final.sql`
2. **Opción 2:** Configura el bucket manualmente desde la UI (ver Opción B arriba)

### Políticas duplicadas o conflictivas

Ejecuta este script para limpiar:

```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "invoice_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_select" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "invoice_logos_delete" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir logos" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar sus logos" ON storage.objects;
```

Luego ejecuta `supabase-fix-invoice-logos-bucket-final.sql` nuevamente.

---

## Archivos Relacionados

- `supabase-fix-invoice-logos-bucket-final.sql` - Script SQL DEFINITIVO (RECOMENDADO)
- `supabase-fix-invoice-logos-bucket.sql` - Script SQL anterior (no usar)
- `supabase-create-invoice-logos-bucket.sql` - Script SQL básico
- `STORAGE-CONFIG.md` - Esta documentación
- `src/app/dashboard/configuracion/factura/page.tsx` - Componente Editor de Factura
