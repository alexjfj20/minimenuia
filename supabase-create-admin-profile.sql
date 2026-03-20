-- Tabla de perfil extendido del super admin
-- (Supabase ya tiene auth.users, esta tabla extiende con datos extra)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  company_name TEXT DEFAULT 'MINIMENU',
  company_website TEXT DEFAULT '',
  timezone TEXT DEFAULT 'America/Bogota',
  language TEXT DEFAULT 'es',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  system_alerts BOOLEAN NOT NULL DEFAULT true,
  new_business_alerts BOOLEAN NOT NULL DEFAULT true,
  payment_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_admin_profiles_id ON public.admin_profiles(id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_admin_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_profile_updated_at ON public.admin_profiles;
CREATE TRIGGER trigger_admin_profile_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_profile_timestamp();

-- RLS: solo el propio super_admin accede a su perfil
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_own_profile" ON public.admin_profiles;
CREATE POLICY "admin_own_profile"
  ON public.admin_profiles
  FOR ALL
  USING (id = auth.uid());

-- Insertar perfil automáticamente al crear usuario super_admin
CREATE OR REPLACE FUNCTION public.create_admin_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data ->> 'role' = 'super_admin' THEN
    INSERT INTO public.admin_profiles (id, full_name, display_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Super Admin')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_admin_profile ON auth.users;
CREATE TRIGGER trigger_create_admin_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_admin_profile_on_signup();

-- Registrar el perfil del super_admin actual si ya existe
INSERT INTO public.admin_profiles (id, full_name, display_name)
SELECT
  id,
  COALESCE(raw_user_meta_data ->> 'full_name', ''),
  COALESCE(raw_user_meta_data ->> 'display_name', 'Super Admin')
FROM auth.users
WHERE raw_user_meta_data ->> 'role' = 'super_admin'
ON CONFLICT (id) DO NOTHING;
