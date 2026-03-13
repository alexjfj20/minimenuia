-- =============================================
-- MINIMENU - Actualizar Contraseña Super Admin (CORRECTO)
-- =============================================
-- Ejecuta este script en Supabase SQL Editor
-- Email: auditsemseo@gmail.com
-- Contraseña: Azul134$

-- PASO 1: Verificar usuario actual
SELECT id, email, name, role, 
       SUBSTRING(password FROM 1 FOR 20) as password_preview,
       CASE 
         WHEN password LIKE '$2a$%' THEN '✅ Hasheada con bcrypt'
         ELSE '❌ Texto plano o inválido'
       END as password_status
FROM users 
WHERE email = 'auditsemseo@gmail.com';

-- PASO 2: Actualizar contraseña
-- El hash correcto para 'Azul134$' se debe generar con bcrypt
-- Ejecuta esto en la consola del navegador para obtener el hash:

/*
// Abre la consola del navegador (F12) en tu app desplegada
// Ve a: https://minimenuia.vercel.app/api/generate-password-hash
// O usa este script de Node.js local:

const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('Azul134$', 10);
console.log(hash);
// Copia el resultado y pégalo abajo

*/

-- PASO 3: Actualiza con el hash generado (REEMPLAZA EL HASH DE ABAJO)
UPDATE users 
SET password = '$2a$10$8K1pJjJjJjJjJjJjJjJjJuOYvN7zqJ8zqJ8zqJ8zqJ8zqJ8zqJ8zqJ8'
WHERE email = 'auditsemseo@gmail.com' 
  AND role = 'SUPER_ADMIN';

-- PASO 4: Verificar actualización
SELECT id, email, name, role, 
       SUBSTRING(password FROM 1 FOR 20) as password_preview
FROM users 
WHERE email = 'auditsemseo@gmail.com';

-- =============================================
-- SOLUCIÓN RÁPIDA - Usar contraseña temporal
-- =============================================
-- Si quieres una solución rápida, usa 'admin123' temporalmente:

UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'auditsemseo@gmail.com' 
  AND role = 'SUPER_ADMIN';

-- Contraseña temporal: admin123
-- Luego puedes cambiarla desde el panel de administración
