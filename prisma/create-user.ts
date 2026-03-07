// =============================================
// Create User Script - juan@restaurante.com
// =============================================

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('👤 Creando usuario juan@restaurante.com...\n');

  const hashedPassword = await bcrypt.hash('demo123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'juan@restaurante.com' },
    update: {
      name: 'Juan Restaurante',
      password: hashedPassword,
      role: UserRole.BUSINESS_ADMIN,
      businessId: 'business-1',
    },
    create: {
      id: 'user-juan-restaurante',
      email: 'juan@restaurante.com',
      name: 'Juan Restaurante',
      password: hashedPassword,
      role: UserRole.BUSINESS_ADMIN,
      businessId: 'business-1',
    },
  });

  console.log(`   ✅ Usuario creado/actualizado`);
  console.log(`   📧 Email: ${user.email}`);
  console.log(`   🔑 Contraseña: demo123`);
  console.log(`   👤 Nombre: ${user.name}`);
  console.log(`   🏷️  Rol: ${user.role}`);
  console.log(`   🏪 Business ID: ${user.businessId}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
