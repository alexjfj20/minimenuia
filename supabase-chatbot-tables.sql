-- =============================================
-- MINIMENU - Tablas para Chatbot IA
-- =============================================
-- Ejecuta este script en Supabase SQL Editor para crear las tablas necesarias

-- =============================================
-- 1. Tabla ai_config (Configuración del Chatbot)
-- =============================================
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt TEXT DEFAULT 'Eres un asistente virtual de MINIMENU, una plataforma de menús digitales para restaurantes en Colombia.',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  knowledge_sources TEXT[] DEFAULT '{}',
  active_model_id UUID,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto SI NO EXISTE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ai_config LIMIT 1) THEN
    INSERT INTO ai_config (id, system_prompt, temperature, max_tokens, enabled)
    VALUES (
      gen_random_uuid(),
      'Eres un asistente virtual experto en MINIMENU, una plataforma de menús digitales para restaurantes en Colombia. Tu trabajo es ayudar a los clientes potenciales a entender los planes, precios y funcionalidades.

Información importante:
- Plan GRATIS: $0 COP/mes, 50 productos, 5 categorías, 1 usuario
- Plan BÁSICO: $29.000 COP/mes, 200 productos, 15 categorías, 3 usuarios
- Plan PROFESIONAL: $59.000 COP/mes, productos ilimitados, 10 usuarios, múltiples sedes
- Plan EMPRESARIAL: $149.000 COP/mes, usuarios ilimitados, multi-marca, integraciones POS

Sé amable, profesional y conciso en tus respuestas. Usa formato markdown para negritas (**texto**) y listas.',
      0.7,
      1000,
      true
    );
  END IF;
END $$;

-- =============================================
-- 2. Tabla ai_models (Modelos de IA)
-- =============================================
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'Google Gemini',
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key TEXT,
  base_url TEXT,
  auth_type TEXT DEFAULT 'bearer',
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar modelo de ejemplo (DEBES ACTUALIZAR CON TU API KEY REAL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ai_models LIMIT 1) THEN
    INSERT INTO ai_models (provider, name, model, api_key, active)
    VALUES (
      'Google Gemini',
      'Gemini Pro',
      'gemini-pro',
      'REEMPLAZA_CON_TU_API_KEY_DE_GEMINI',
      false
    );
  END IF;
END $$;

-- =============================================
-- 3. Tabla chatbot_faqs (Preguntas Frecuentes)
-- =============================================
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  enabled BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar FAQs de ejemplo SI NO EXISTEN
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM chatbot_faqs LIMIT 1) THEN
    INSERT INTO chatbot_faqs (question, answer, keywords, category, enabled) VALUES
    (
      '¿Qué planes tienen?',
      'Tenemos 4 planes:\n\n🆓 **Plan GRATIS** - $0 COP/mes\n• 1 Usuario\n• Hasta 50 productos\n• Hasta 5 categorías\n• Menú público con QR\n\n💜 **Plan BÁSICO** - $29.000 COP/mes\n• 3 Usuarios\n• Hasta 200 productos\n• 15 Categorías\n\n⭐ **Plan PROFESIONAL** - $59.000 COP/mes\n• 10 Usuarios\n• Productos ilimitados\n• Múltiples sedes\n\n🏢 **Plan EMPRESARIAL** - $149.000 COP/mes\n• Usuarios ilimitados\n• Multi-marca\n\n¿Te gustaría saber más sobre algún plan?',
      ARRAY['plan', 'planes', 'precio', 'precios', 'cuesta', 'valor', 'costo'],
      'planes',
      true
    ),
    (
      '¿Cómo me registro?',
      '¡Es muy fácil! Sigue estos pasos:\n\n1️⃣ Ve a la página de inicio\n2️⃣ Haz clic en "Registrarse"\n3️⃣ Ingresa tu email y contraseña\n4️⃣ Completa la información de tu negocio\n5️⃣ ¡Listo! Ya puedes comenzar\n\n¿Necesitas ayuda con el registro?',
      ARRAY['registro', 'registrar', 'registrar', 'empezar', 'comenzar', 'iniciar', 'cuenta'],
      'registro',
      true
    ),
    (
      '¿Tienen código QR?',
      '¡Sí! Cada negocio tiene su **código QR único** que:\n\n✅ Redirige a tu menú digital\n✅ Es personalizable con tu logo\n✅ Funciona en cualquier dispositivo\n✅ No requiere descarga de app\n✅ Se actualiza automáticamente\n\nPuedes descargar tu QR desde el panel en "Compartir Menú".',
      ARRAY['qr', 'codigo', 'código', 'qr', 'código qr'],
      'funcionalidades',
      true
    ),
    (
      '¿Puedo aceptar pedidos por WhatsApp?',
      '¡Sí! La integración con **WhatsApp** es una de las funciones más populares:\n\n✅ Los pedidos llegan directamente a tu WhatsApp\n✅ Puedes responder y confirmar fácilmente\n✅ No requiere app adicional\n✅ Tus clientes ya lo usan\n\n¿Quieres configurarlo?',
      ARRAY['whatsapp', 'pedido', 'pedidos', 'mensaje'],
      'funcionalidades',
      true
    ),
    (
      '¿Es gratis?',
      '¡Sí! Tenemos un **Plan GRATIS** que incluye:\n\n✅ 1 Usuario administrador\n✅ Hasta 50 productos\n✅ Hasta 5 categorías\n✅ Menú digital con QR\n✅ Pedidos por WhatsApp\n✅ Gestión básica de inventario\n\nEs perfecto para comenzar. ¿Te gustaría registrarte?',
      ARRAY['gratis', 'free', 'gratuito', 'gratis', 'costo'],
      'planes',
      true
    );
  END IF;
END $$;

-- =============================================
-- 4. Tabla library_items (Librería de Contenido)
-- =============================================
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar items de ejemplo SI NO EXISTEN
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM library_items LIMIT 1) THEN
    INSERT INTO library_items (name, type, description, keywords, enabled) VALUES
    ('Documentación de Planes', 'document', 'Información detallada sobre los planes de MINIMENU', ARRAY['plan', 'planes', 'precios', 'características'], true),
    ('Guía de Inicio', 'document', 'Cómo empezar a usar MINIMENU paso a paso', ARRAY['inicio', 'empezar', 'comenzar', 'guía', 'tutorial'], true),
    ('Funcionalidades QR', 'document', 'Todo sobre los códigos QR y su uso', ARRAY['qr', 'código', 'código qr'], true);
  END IF;
END $$;

-- =============================================
-- 5. Habilitar RLS (Row Level Security)
-- =============================================
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. Crear Políticas RLS
-- =============================================

-- ai_config políticas
DROP POLICY IF EXISTS "Allow select ai_config" ON ai_config;
CREATE POLICY "Allow select ai_config" ON ai_config FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow authenticated select ai_config" ON ai_config;
CREATE POLICY "Allow authenticated select ai_config" ON ai_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow update ai_config" ON ai_config;
CREATE POLICY "Allow update ai_config" ON ai_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow insert ai_config" ON ai_config;
CREATE POLICY "Allow insert ai_config" ON ai_config FOR INSERT TO authenticated WITH CHECK (true);

-- ai_models políticas
DROP POLICY IF EXISTS "Allow select ai_models" ON ai_models;
CREATE POLICY "Allow select ai_models" ON ai_models FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow authenticated select ai_models" ON ai_models;
CREATE POLICY "Allow authenticated select ai_models" ON ai_models FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow insert ai_models" ON ai_models;
CREATE POLICY "Allow insert ai_models" ON ai_models FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update ai_models" ON ai_models;
CREATE POLICY "Allow update ai_models" ON ai_models FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete ai_models" ON ai_models;
CREATE POLICY "Allow delete ai_models" ON ai_models FOR DELETE TO authenticated USING (true);

-- chatbot_faqs políticas
DROP POLICY IF EXISTS "Allow select chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Allow select chatbot_faqs" ON chatbot_faqs FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow authenticated select chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Allow authenticated select chatbot_faqs" ON chatbot_faqs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow insert chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Allow insert chatbot_faqs" ON chatbot_faqs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Allow update chatbot_faqs" ON chatbot_faqs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Allow delete chatbot_faqs" ON chatbot_faqs FOR DELETE TO authenticated USING (true);

-- library_items políticas
DROP POLICY IF EXISTS "Allow select library_items" ON library_items;
CREATE POLICY "Allow select library_items" ON library_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow authenticated select library_items" ON library_items;
CREATE POLICY "Allow authenticated select library_items" ON library_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow insert library_items" ON library_items;
CREATE POLICY "Allow insert library_items" ON library_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update library_items" ON library_items;
CREATE POLICY "Allow update library_items" ON library_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete library_items" ON library_items;
CREATE POLICY "Allow delete library_items" ON library_items FOR DELETE TO authenticated USING (true);

-- =============================================
-- 7. Verificar tablas creadas
-- =============================================
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS No Habilitado'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ai_config', 'ai_models', 'chatbot_faqs', 'library_items')
ORDER BY tablename;

-- =============================================
-- 8. Verificar datos insertados
-- =============================================
SELECT 'ai_config' as tabla, COUNT(*) as registros FROM ai_config
UNION ALL
SELECT 'ai_models', COUNT(*) FROM ai_models
UNION ALL
SELECT 'chatbot_faqs', COUNT(*) FROM chatbot_faqs
UNION ALL
SELECT 'library_items', COUNT(*) FROM library_items;

-- =============================================
-- 9. Mensaje de confirmación
-- =============================================
SELECT '✅ Tablas para Chatbot IA creadas exitosamente' as status;
