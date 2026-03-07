/**
 * Utilidades para la generación y manejo de números de pedido
 * @module lib/order-utils
 */

import { db } from './db';
import { Prisma } from '@prisma/client';

/**
 * Formato del número de pedido: ORD-0001, ORD-0002, etc.
 */
const ORDER_NUMBER_PREFIX = 'ORD';
const ORDER_NUMBER_LENGTH = 4;

/**
 * Genera el siguiente número de pedido secuencial
 * @returns Promise<string> Número de pedido en formato ORD-XXXX
 * @throws Error si no se puede generar el número
 */
export async function generateNextOrderNumber(): Promise<string> {
  try {
    // Obtener el último número de pedido
    const lastOrder = await db.order.findFirst({
      where: {
        orderNumber: {
          startsWith: ORDER_NUMBER_PREFIX
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      select: {
        orderNumber: true
      }
    });
    
    let nextNumber = 1;
    
    if (lastOrder?.orderNumber) {
      // Extraer el número del último pedido
      const match = lastOrder.orderNumber.match(/^ORD-(\d{4})$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    // Formatear el número con padding
    const paddedNumber = String(nextNumber).padStart(ORDER_NUMBER_LENGTH, '0');
    const orderNumber = `${ORDER_NUMBER_PREFIX}-${paddedNumber}`;
    
    return orderNumber;
  } catch (error) {
    console.error('[OrderUtils] Error generando número de pedido:', error);
    throw new Error('No se pudo generar el número de pedido');
  }
}

/**
 * Valida el formato de un número de pedido
 * @param orderNumber Número de pedido a validar
 * @returns boolean indicando si el formato es válido
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  const pattern = /^ORD-\d{4}$/;
  return pattern.test(orderNumber);
}

/**
 * Extrae el número secuencial de un número de pedido
 * @param orderNumber Número de pedido en formato ORD-XXXX
 * @returns número secuencial o null si el formato es inválido
 */
export function extractOrderSequence(orderNumber: string): number | null {
  const match = orderNumber.match(/^ORD-(\d{4})$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
