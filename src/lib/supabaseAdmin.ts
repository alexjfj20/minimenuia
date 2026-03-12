import { createClient } from '@supabase/supabase-js';

// Cliente administrativo para operaciones de servidor que requieren bypass de RLS
// Usa la SERVICE_ROLE_KEY que tiene permisos totales sobre la base de datos
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
