# Variables de Entorno Requeridas para Vercel

## Configurar en Vercel Dashboard → Project Settings → Environment Variables

### Producción (Production)
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Vista Previa (Preview)
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Desarrollo (Development)
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## Cómo obtener las variables:

1. Ve a https://supabase.com/dashboard/project/tu-proyecto
2. Settings → API
3. Copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY` (¡NO COMPARTIR!)

## ⚠️ IMPORTANTE DE SEGURIDAD

- `SUPABASE_SERVICE_ROLE_KEY` da acceso TOTAL a tu base de datos
- NUNCA la expongas en el frontend
- Solo usa en API Routes (backend)
- Rota la key si fue comprometida
