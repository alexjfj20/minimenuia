-- =============================================
-- MINIMENU - Supabase Database Initialization
-- =============================================
-- Ejecutar este script en Supabase SQL Editor
-- =============================================

-- Habilitar extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Insertar Plan Gratuito por defecto
-- =============================================
-- Usamos un CUID simulado (formato compatible con Prisma)

INSERT INTO plans (id, name, slug, description, price, currency, period, features, "isActive", "isPublic", "isPopular", "order", icon, color, "maxUsers", "maxProducts", "maxCategories", "createdAt", "updatedAt")
VALUES (
    'clx_plan_gratis_001',
    'Gratis',
    'gratis',
    'Plan gratuito para comenzar',
    0,
    'COP',
    'MONTHLY',
    'Hasta 50 productos,1 usuario,Soporte por email',
    true,
    true,
    false,
    0,
    'zap',
    '#8b5cf6',
    1,
    50,
    5,
    NOW(),
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Verificar que el plan fue creado
-- =============================================

SELECT id, name, slug FROM plans WHERE slug = 'gratis';
