-- ============================================================
-- INSERTAR ENLACES REALES DE HOTMART EN PLANES
-- ============================================================
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Actualizar enlaces de Hotmart para cada plan
UPDATE plans 
SET "hotmartUrl" = 'https://pay.hotmart.com/D104942214C?off=7da9yu0k',
    "updatedAt" = NOW()
WHERE slug = 'gratis';

UPDATE plans 
SET "hotmartUrl" = 'https://pay.hotmart.com/D104942214C?off=f011s13t',
    "updatedAt" = NOW()
WHERE slug = 'basico';

UPDATE plans 
SET "hotmartUrl" = 'https://pay.hotmart.com/D104942214C?off=sm1o0n9q',
    "updatedAt" = NOW()
WHERE slug = 'profesional';

UPDATE plans 
SET "hotmartUrl" = 'https://pay.hotmart.com/D104942214C?off=nrxzehn1',
    "updatedAt" = NOW()
WHERE slug = 'empresarial';

-- ============================================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================================

SELECT 
  name, 
  slug, 
  "hotmartUrl",
  "updatedAt"
FROM plans 
ORDER BY "order";

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
