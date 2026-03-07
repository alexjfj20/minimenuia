/**
 * Script de migración para asignar números de pedido ORD-XXXX a pedidos existentes
 * Ejecutar con: bun run prisma/migrations/add-order-numbers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🔍 Buscando pedidos sin número de pedido...');
  
  // Obtener todos los pedidos ordenados por fecha de creación
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true
    }
  });
  
  console.log(`📊 Total de pedidos encontrados: ${orders.length}`);
  
  // Filtrar pedidos sin número
  const ordersWithoutNumber = orders.filter(order => !order.orderNumber);
  
  if (ordersWithoutNumber.length === 0) {
    console.log('✅ Todos los pedidos ya tienen número asignado.');
    return;
  }
  
  console.log(`📝 Pedidos sin número: ${ordersWithoutNumber.length}`);
  
  // Obtener el último número de pedido usado
  const ordersWithNumber = orders.filter(order => order.orderNumber);
  let maxNumber = 0;
  
  for (const order of ordersWithNumber) {
    const match = order.orderNumber?.match(/^ORD-(\d{4})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  
  console.log(`🔢 Último número de pedido usado: ORD-${String(maxNumber).padStart(4, '0')}`);
  
  // Asignar números a pedidos sin número
  let nextNumber = maxNumber + 1;
  
  for (const order of ordersWithoutNumber) {
    const orderNumber = `ORD-${String(nextNumber).padStart(4, '0')}`;
    
    await prisma.order.update({
      where: { id: order.id },
      data: { orderNumber }
    });
    
    console.log(`✅ Pedido ${order.id} → ${orderNumber}`);
    nextNumber++;
  }
  
  console.log(`\n🎉 Migración completada. Se asignaron ${ordersWithoutNumber.length} números de pedido.`);
}

main()
  .catch((error: Error) => {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
