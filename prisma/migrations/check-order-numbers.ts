/**
 * Script para verificar y actualizar orderNumbers duplicados o NULL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🔍 Verificando orderNumbers...');
  
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  console.log(`📊 Total de pedidos: ${orders.length}`);
  
  for (const order of orders) {
    console.log(`  - ${order.id}: orderNumber="${order.orderNumber}"`);
  }
  
  // Verificar duplicados y NULL
  const orderNumbers = orders.map(o => o.orderNumber);
  const nulls = orderNumbers.filter(n => n === null);
  const duplicates = orderNumbers.filter((n, i) => n !== null && orderNumbers.indexOf(n) !== i);
  
  console.log(`\n📊 NULL: ${nulls.length}`);
  console.log(`📊 Duplicados: ${duplicates.length}`);
  
  // Si hay NULL o duplicados, reasignar todos
  if (nulls.length > 0 || duplicates.length > 0) {
    console.log('\n🔧 Reasignando números de pedido...');
    
    let counter = 1;
    for (const order of orders) {
      const orderNumber = `ORD-${String(counter).padStart(4, '0')}`;
      
      await prisma.order.update({
        where: { id: order.id },
        data: { orderNumber }
      });
      console.log(`  ✅ ${order.id} → ${orderNumber}`);
      counter++;
    }
  }
  
  // Verificar resultado final
  const finalOrders = await prisma.order.findMany({
    select: { id: true, orderNumber: true },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log('\n✅ Estado final:');
  for (const order of finalOrders) {
    console.log(`  - ${order.id}: "${order.orderNumber}"`);
  }
}

main()
  .catch((error: Error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
