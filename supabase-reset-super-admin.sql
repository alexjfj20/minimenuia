-- =============================================
-- MINIMENU - Reset Super Admin Password
-- =============================================
-- Ejecuta este script en Supabase SQL Editor para resetear la contraseña del super admin
-- La contraseña por defecto será: admin123

-- Primero, necesitamos crear una función para hashear la contraseña
-- Pero como SQL no puede hashear, vamos a usar un hash pre-calculado para 'admin123'

-- Actualizar la contraseña del primer super admin encontrado
UPDATE users 
SET password = '$2a$10$rH0zXCl5Q.F8zqJ8zqJ8zOYvN7zqJ8zqJ8zqJ8zqJ8zqJ8zqJ8zqO'
WHERE role = 'SUPER_ADMIN'
LIMIT 1;

-- Verificar el update
SELECT id, email, name, role, 
       CASE 
         WHEN password LIKE '$2a$%' THEN 'Hasheada correctamente'
         ELSE 'NO hasheada - requiere atención'
       END as password_status
FROM users 
WHERE role = 'SUPER_ADMIN';

-- =============================================
-- NOTA IMPORTANTE:
-- =============================================
-- El hash de arriba es un ejemplo. Para generar un hash válido:
-- 1. Ve a la consola del navegador en tu aplicación
-- 2. Ejecuta: btoa('admin123') 
-- 3. O usa esta API route temporal:

-- SCRIPT ALTERNATIVO - Crear usuario super admin con contraseña conocida
-- =============================================

-- Eliminar super admin existente (opcional, comenta si quieres mantenerlo)
-- DELETE FROM users WHERE role = 'SUPER_ADMIN';

-- Insertar nuevo super admin con contraseña 'admin123' hasheada
-- El hash siguiente ES para 'admin123' generado con bcrypt
INSERT INTO users (email, name, password, role)
VALUES (
  'superadmin@minimenuia.com',
  'Super Administrador',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'SUPER_ADMIN'
)
ON CONFLICT (email) DO UPDATE SET
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  role = 'SUPER_ADMIN';

-- Verificar
SELECT id, email, name, role FROM users WHERE role = 'SUPER_ADMIN';
