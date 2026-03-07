/**
 * Script para verificar y actualizar la estructura de la tabla orders
 * Ejecutar con: bun run prisma/migrations/fix-order-number.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🔍 Verificando estructura de la tabla orders...');
  
  // Ver si el campo orderNumber ya existe
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
  
  // Verificar si ya tienen orderNumber
  const ordersWithNumber = orders.filter(o => o.orderNumber !== null);
  const ordersWithoutNumber = orders.filter(o => o.orderNumber === null);
  
  console.log(`✅ Con número: ${ordersWithNumber.length}`);
  console.log(`❌ Sin número: ${ordersWithoutNumber.length}`);
  
  // Si hay pedidos sin número, asignar números
  if (ordersWithoutNumber.length > 0) {
    // Obtener el máximo número actual
    let maxNumber = 0;
    for (const order of ordersWithNumber) {
      if (order.orderNumber) {
        const match = order.orderNumber.match(/^ORD-(\d{4})$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
    
    console.log(`🔢 Último número usado: ORD-${String(maxNumber).padStart(4, '0')}`);
    
    let nextNumber = maxNumber + 1;
    
    for (const order of ordersWithoutNumber) {
      const orderNumber = `ORD-${String(nextNumber).padStart(4, '0')}`;
      
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: { orderNumber }
        });
        console.log(`✅ Actualizado ${order.id} → ${orderNumber}`);
        nextNumber++;
      } catch (error) {
        console.error(`❌ Error actualizando ${order.id}:`, error);
      }
    }
    
    console.log(`\n🎉 Migración completada. Se asignaron ${ordersWithoutNumber.length} números de pedido.`);
  } else {
    console.log('\n✅ Todos los pedidos ya tienen número asignado.');
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
