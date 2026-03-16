# 📋 GUÍA DE CONFIGURACIÓN DE IA - MINIMENU

## ⚠️ PROBLEMA ACTUAL

Error: `Incorrect API key provided: TU_API_KEY_DE_GEMINI`

Las API Keys configuradas en Supabase tienen valores por defecto. Debes configurarlas correctamente.

---

## ✅ PASOS PARA SOLUCIONAR

### PASO 1: Ejecutar SQL en Supabase

1. Ir a https://supabase.com
2. Seleccionar tu proyecto
3. Ir a **SQL Editor**
4. Copiar y ejecutar el contenido de `supabase-use-case-column.sql`

```sql
-- Este script agrega la columna use_case
ALTER TABLE ai_models
ADD COLUMN use_case TEXT NOT NULL DEFAULT 'both'
CHECK (use_case IN ('text', 'image', 'both'));
```

---

### PASO 2: Obtener API Keys

#### Google Gemini (Recomendado - Gratis)
1. Ir a https://aistudio.google.com/app/apikey
2. Click en **"Create API Key"**
3. Copiar la API Key (empieza con `AIza...`)

#### OpenAI GPT (Opcional - Requiere créditos)
1. Ir a https://platform.openai.com/api-keys
2. Click en **"Create new secret key"**
3. Copiar la API Key (empieza con `sk-...`)

#### Groq (Opcional - Gratis, solo texto)
1. Ir a https://console.groq.com/keys
2. Crear API Key
3. Copiar la API Key

---

### PASO 3: Configurar en Super Admin Panel

1. Iniciar sesión como **Super Admin**
2. Ir a **Chatbot IA** → **Configuración Proveedores IA**
3. Click en **"Nuevo Proveedor de IA"**

#### Configurar Google Gemini:
```
Proveedor: Google Gemini
Nombre del Modelo: Gemini Pro
Modelo: gemini-1.5-flash
API Key: (pegar la API Key de Google)
Uso del modelo: Texto e Imagen
✅ Activar (toggle)
```

#### Configurar OpenAI GPT:
```
Proveedor: OpenAI GPT
Nombre del Modelo: GPT-4o Mini
Modelo: gpt-4o-mini
API Key: (pegar la API Key de OpenAI)
Uso del modelo: Texto e Imagen
✅ Activar (toggle)
```

4. Click en **"Guardar Proveedor"**

---

### PASO 4: Verificar en Supabase

1. Ir a **Table Editor** en Supabase
2. Seleccionar tabla `ai_models`
3. Verificar que hay al menos un registro con:
   - `active = true`
   - `api_key` con valor real (no "TU_API_KEY...")
   - `use_case = 'both'` o `'text'`

---

### PASO 5: Probar IA en Catálogo

1. Ir a **Productos** (Catálogo)
2. Click en **"Crear con IA (Texto)"**
3. Escribir: "Hamburguesa con queso y tomate"
4. Click en generar
5. **Resultado esperado:**
   - Nombre: "Hamburguesa Con Queso"
   - Descripción: "Deliciosa hamburguesa..."
   - Precio: 25000
   - Categoría: "Platos Principales"
   - Imagen: SVG con iniciales "HC"

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "API key not valid"
**Causa:** La API Key en Supabase es incorrecta o expiró.

**Solución:**
1. Ir a Super Admin → Chatbot IA
2. Editar el proveedor
3. Pegar nueva API Key
4. Guardar

### Error: "No hay proveedor activo para texto"
**Causa:** Ningún modelo tiene `active = true` o `use_case = 'text'/'both'`

**Solución:**
1. Ir a Super Admin → Chatbot IA
2. Activar toggle de al menos un proveedor
3. Asegurar que "Uso del modelo" sea "Texto e Imagen" o "Solo Texto"
4. Guardar

### Error: "Groq no soporta generación de imágenes"
**Causa:** Groq solo genera texto, no imágenes.

**Solución:**
- Configurar OpenAI o Google Gemini para imágenes
- O usar fallback SVG (automático)

---

## 📊 ESTADO DEL SISTEMA

| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Fallback producto | ✅ Activo | Si API falla, genera producto automático |
| Fallback imagen | ✅ Activo | Si API falla, genera SVG con iniciales |
| Guardado en Supabase | ✅ Activo | API Keys se guardan en DB |
| 4 Proveedores | ✅ Soportados | Gemini, OpenAI, Groq, Custom |

---

## 🎯 CONFIGURACIÓN RECOMENDADA

**Mínima (Gratis):**
- Google Gemini → Texto e Imagen (activo)

**Completa (Recomendada):**
- Google Gemini → Texto (activo)
- OpenAI GPT → Texto e Imagen (activo)

**Económica (Solo texto):**
- Groq → Solo Texto (activo)
- Fallback SVG para imágenes

---

## ✅ VERIFICACIÓN FINAL

Después de configurar, el log debe mostrar:

```
[generate-product] Success: Product generated
[generate-image] Image generated successfully
```

O si usa fallback:

```
[generate-product] Error de API/Red/Cuota, usando fallback
[generate-image] API Key inválida o cuota excedida, usando fallback SVG
```

**Ambos casos son EXITOSOS** - el sistema funciona con o sin IA.

---

**¿Necesitas ayuda?** Revisa los logs en consola del navegador para más detalles.
