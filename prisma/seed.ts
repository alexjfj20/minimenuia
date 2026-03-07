// =============================================
// MINIMENU - Database Seed Script
// =============================================

import { PrismaClient, UserRole, BusinessStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // =============================================
  // Crear Planes
  // =============================================
  console.log('📦 Creando planes...');

  const plans = [
    {
      id: 'plan-basico',
      name: 'Básico',
      slug: 'basico',
      description: 'Perfecto para pequeños negocios que están comenzando.',
      price: 49900,
      features: JSON.stringify([
        'Menú digital ilimitado',
        'Hasta 50 productos',
        'Código QR incluido',
        'Soporte por email',
        'Actualizaciones gratuitas',
      ]),
      maxUsers: 1,
      maxProducts: 50,
      maxCategories: 5,
      isPopular: false,
      order: 1,
    },
    {
      id: 'plan-profesional',
      name: 'Profesional',
      slug: 'profesional',
      description: 'Ideal para negocios en crecimiento con más necesidades.',
      price: 99000,
      features: JSON.stringify([
        'Todo del plan Básico',
        'Hasta 200 productos',
        'Pedidos online',
        'Sistema de reservas',
        'Soporte prioritario',
        'Análisis básico',
      ]),
      maxUsers: 3,
      maxProducts: 200,
      maxCategories: 15,
      isPopular: true,
      order: 2,
    },
    {
      id: 'plan-empresarial',
      name: 'Empresarial',
      slug: 'empresarial',
      description: 'Para negocios grandes con necesidades avanzadas.',
      price: 199000,
      features: JSON.stringify([
        'Todo del plan Profesional',
        'Productos ilimitados',
        'Programa de lealtad',
        'Integraciones premium',
        'API personalizada',
        'Soporte 24/7',
        'Múltiples sucursales',
      ]),
      maxUsers: 10,
      maxProducts: 1000,
      maxCategories: 50,
      isPopular: false,
      order: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }
  console.log(`   ✅ ${plans.length} planes creados/actualizados\n`);

  // =============================================
  // Crear Negocio por Defecto (Business)
  // =============================================
  console.log('🏪 Creando negocio por defecto...');

  const defaultBusiness = await prisma.business.upsert({
    where: { id: 'business-1' },
    update: {
      name: 'Restaurante El Sabor',
      slug: 'restaurant-user-admin-1',
      ownerId: 'user-super-admin',
      ownerName: 'Super Admin',
      ownerEmail: 'auditsemseo@gmail.com',
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67, Bogotá',
      planId: 'plan-profesional',
      status: BusinessStatus.ACTIVE,
    },
    create: {
      id: 'business-1',
      name: 'Restaurante El Sabor',
      slug: 'restaurant-user-admin-1',
      ownerId: 'user-super-admin',
      ownerName: 'Super Admin',
      ownerEmail: 'auditsemseo@gmail.com',
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67, Bogotá',
      planId: 'plan-profesional',
      status: BusinessStatus.ACTIVE,
    },
  });

  console.log(`   ✅ Negocio creado: ${defaultBusiness.name} (${defaultBusiness.id})\n`);

  // =============================================
  // Crear Módulos
  // =============================================
  console.log('🧩 Creando módulos...');

  const modules = [
    {
      id: 'mod-menu',
      name: 'Menú Digital',
      description: 'Menú digital interactivo con código QR y gestión de productos.',
      type: 'CORE',
      icon: 'utensils',
      status: 'ACTIVE',
    },
    {
      id: 'mod-pedidos',
      name: 'Pedidos Online',
      description: 'Sistema de pedidos online con seguimiento en tiempo real.',
      type: 'CORE',
      icon: 'shopping-bag',
      status: 'ACTIVE',
    },
    {
      id: 'mod-qr',
      name: 'Código QR',
      description: 'Generación y personalización de códigos QR para tu negocio.',
      type: 'CORE',
      icon: 'qr-code',
      status: 'ACTIVE',
    },
    {
      id: 'mod-reservas',
      name: 'Reservas',
      description: 'Sistema de reservaciones con calendario y confirmación automática.',
      type: 'ADDON',
      icon: 'calendar',
      status: 'ACTIVE',
    },
    {
      id: 'mod-lealtad',
      name: 'Programa de Lealtad',
      description: 'Sistema de puntos y recompensas para clientes frecuentes.',
      type: 'ADDON',
      icon: 'star',
      status: 'ACTIVE',
    },
    {
      id: 'mod-analisis',
      name: 'Análisis y Reportes',
      description: 'Dashboard con métricas de ventas y comportamiento de clientes.',
      type: 'ADDON',
      icon: 'bar-chart-3',
      status: 'ACTIVE',
    },
    {
      id: 'mod-whatsapp',
      name: 'Integración WhatsApp',
      description: 'Envío automático de confirmaciones y actualizaciones por WhatsApp.',
      type: 'ADDON',
      icon: 'message-circle',
      status: 'ACTIVE',
    },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: mod,
      create: mod,
    });
  }
  console.log(`   ✅ ${modules.length} módulos creados/actualizados\n`);

  // =============================================
  // Crear Servicios del Sistema
  // =============================================
  console.log('⚙️ Creando servicios del sistema...');

  const services = [
    {
      id: 'srv-soporte',
      name: 'Soporte Premium',
      description: 'Soporte técnico prioritario 24/7 con respuesta en menos de 2 horas.',
      price: 49900,
      billingType: 'MONTHLY',
      status: 'ACTIVE',
    },
    {
      id: 'srv-capacitacion',
      name: 'Capacitación Personalizada',
      description: 'Sesión de capacitación one-on-one para el equipo del negocio.',
      price: 150000,
      billingType: 'ONE_TIME',
      status: 'ACTIVE',
    },
    {
      id: 'srv-migracion',
      name: 'Migración de Datos',
      description: 'Servicio de migración de datos desde otros sistemas de gestión.',
      price: 200000,
      billingType: 'ONE_TIME',
      status: 'ACTIVE',
    },
    {
      id: 'srv-dominio',
      name: 'Dominio Personalizado',
      description: 'Configuración de dominio personalizado para tu menú digital.',
      price: 29900,
      billingType: 'MONTHLY',
      status: 'ACTIVE',
    },
  ];

  for (const service of services) {
    await prisma.systemService.upsert({
      where: { id: service.id },
      update: service,
      create: service,
    });
  }
  console.log(`   ✅ ${services.length} servicios creados/actualizados\n`);

  // =============================================
  // Crear Super Admin
  // =============================================
  console.log('👤 Creando Super Admin...');

  const superAdminPassword = await bcrypt.hash('Azul134$', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'auditsemseo@gmail.com' },
    update: {
      name: 'Super Admin',
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      id: 'user-super-admin',
      email: 'auditsemseo@gmail.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`   ✅ Super Admin creado/actualizado`);
  console.log(`   📧 Email: ${superAdmin.email}`);
  console.log(`   🔑 Contraseña: Azul134$\n`);

  // =============================================
  // Crear Pasarelas de Pago
  // =============================================
  console.log('💳 Creando pasarelas de pago...');

  const gateways = [
    {
      id: 'gw-stripe',
      name: 'stripe',
      displayName: 'Stripe',
      type: 'API',
      enabled: false,
      mode: 'SANDBOX',
      instructions: 'Serás redirigido a la plataforma segura de Stripe para completar el pago.',
    },
    {
      id: 'gw-mercadopago',
      name: 'mercadopago',
      displayName: 'Mercado Pago',
      type: 'API',
      enabled: false,
      mode: 'SANDBOX',
      instructions: 'Serás redirigido a Mercado Pago para completar tu pago de forma segura.',
    },
    {
      id: 'gw-paypal',
      name: 'paypal',
      displayName: 'PayPal',
      type: 'API',
      enabled: false,
      mode: 'SANDBOX',
      instructions: 'Serás redirigido a PayPal para completar tu pago de forma segura.',
    },
    {
      id: 'gw-nequi',
      name: 'nequi',
      displayName: 'Nequi',
      type: 'MANUAL',
      enabled: true,
      accountHolder: 'MINIMENU SAS',
      accountId: '3001234567',
      instructions: 'Realiza la transferencia al número indicado y envía el comprobante por WhatsApp.',
    },
    {
      id: 'gw-bancolombia',
      name: 'bancolombia',
      displayName: 'Bancolombia',
      type: 'MANUAL',
      enabled: true,
      accountHolder: 'MINIMENU SAS',
      accountId: '123-456789-01',
      instructions: 'Realiza la transferencia desde tu app Bancolombia y envía el comprobante.',
    },
    {
      id: 'gw-daviplata',
      name: 'daviplata',
      displayName: 'Daviplata',
      type: 'MANUAL',
      enabled: false,
      instructions: 'Realiza la transferencia desde tu app Daviplata.',
    },
    {
      id: 'gw-breb',
      name: 'breb',
      displayName: 'BRE-B',
      type: 'MANUAL',
      enabled: false,
      instructions: 'Escanea el código QR o realiza la transferencia desde la app BRE-B.',
    },
  ];

  for (const gateway of gateways) {
    await prisma.paymentGateway.upsert({
      where: { id: gateway.id },
      update: gateway,
      create: gateway,
    });
  }
  console.log(`   ✅ ${gateways.length} pasarelas de pago creadas/actualizadas\n`);

  console.log('✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
