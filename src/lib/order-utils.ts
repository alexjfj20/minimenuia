/**
 * Utilidades para la generación y manejo de números de pedido
 * @module lib/order-utils
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Formato del número de pedido: ORD-0001, ORD-0002, etc.
 */
const ORDER_NUMBER_PREFIX = 'ORD';
const ORDER_NUMBER_LENGTH = 4;

/**
 * Genera el siguiente número de pedido secuencial usando Supabase Admin
 * Obtiene el MÁXIMO orderNumber existente y lo incrementa
 * @param businessId - ID del negocio para filtrar pedidos
 * @returns Promise<string> Número de pedido en formato ORD-XXXX
 * @throws Error si no se puede generar el número
 */
export async function generateNextOrderNumber(businessId?: string): Promise<string> {
  try {
    let maxNumber = 0;

    if (businessId) {
      // Obtener TODOS los orderNumber para este negocio y encontrar el máximo
      const { data: orders, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('orderNumber')
        .eq('businessId', businessId)
        .ilike('orderNumber', `${ORDER_NUMBER_PREFIX}-%`);

      if (fetchError) {
        console.error('[OrderUtils] Error fetching orders:', fetchError);
        throw new Error(fetchError.message);
      }

      if (orders && orders.length > 0) {
        // Extraer el número más alto de TODOS los orderNumber (ORD-0001, ORD-0002, etc.)
        for (const order of orders) {
          if (order.orderNumber) {
            const match = order.orderNumber.match(/^ORD-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        }
        console.log(`[OrderUtils] Found ${orders.length} orders for business ${businessId}, max number: ${maxNumber}`);
      } else {
        console.log('[OrderUtils] No orders found for business, starting from 1');
      }
    } else {
      // Fallback: obtener todos los pedidos si no hay businessId
      const { data: orders, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('orderNumber')
        .ilike('orderNumber', `${ORDER_NUMBER_PREFIX}-%`);

      if (fetchError) {
        console.error('[OrderUtils] Error fetching all orders:', fetchError);
        throw new Error(fetchError.message);
      }

      if (orders && orders.length > 0) {
        for (const order of orders) {
          if (order.orderNumber) {
            const match = order.orderNumber.match(/^ORD-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        }
      }
    }

    const nextNumber = maxNumber + 1;

    // Formatear el número con padding (4 dígitos)
    const paddedNumber = String(nextNumber).padStart(ORDER_NUMBER_LENGTH, '0');
    const orderNumber = `${ORDER_NUMBER_PREFIX}-${paddedNumber}`;

    console.log('[OrderUtils] Generated order number:', orderNumber);
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
