import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { OrderStatus, PaymentStatus, OrderType, Currency } from '@/types/database';
import { generateNextOrderNumber } from '@/lib/order-utils';

// =============================================
// Interfaces
// =============================================

interface OrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface CreateOrderInput {
  businessId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerNotes?: string;
  orderType: OrderType;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  neighborhood?: string;
  estimatedDelivery?: string;
  invoiceNumber?: string;
  notes?: string;
  items: OrderItemInput[];
}

interface UpdateOrderInput {
  id: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  driverName?: string;
  notes?: string;
}

// =============================================
// GET - List Orders
// =============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const orderType = searchParams.get('orderType') as OrderType | null;
    const status = searchParams.get('status') as OrderStatus | null;
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Validar formato UUID para evitar error 500 de Supabase/Postgres
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      console.warn(`[Orders API] Intento de acceso con businessId inválido: ${businessId}`);
      return NextResponse.json(
        { success: false, error: 'Formato de businessId inválido' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('businessId', businessId);

    if (orderType) {
      query = query.eq('orderType', orderType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (paymentStatus) {
      query = query.eq('paymentStatus', paymentStatus);
    }

    if (dateFrom) {
      query = query.gte('createdAt', new Date(dateFrom).toISOString());
    }

    if (dateTo) {
      query = query.lte('createdAt', new Date(dateTo).toISOString());
    }

    const { data: orders, error } = await query.order('createdAt', { ascending: false });

    if (error) {
      console.error('[Orders API] Supabase error:', error);
      throw new Error(error.message);
    }

    console.log(`[Orders API] GET orders for business ${businessId}: ${orders?.length || 0} found`);

    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    console.error('[Orders API] Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener pedidos: ' + error.message },
      { status: 500 }
    );
  }
}

// =============================================
// POST - Create Order
// =============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateOrderInput = await request.json();

    // Validate required fields
    if (!body.businessId || !body.customerName || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: businessId, customerName, items' },
        { status: 400 }
      );
    }

    // Generate order number with retry logic to handle race conditions
    // Use sequential order number: ORD-0001, ORD-0002, etc.
    const MAX_RETRIES = 10;
    let order: { id: string; orderNumber: string } | null = null;
    let orderNumber: string | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Generate sequential order number based on business order count
        orderNumber = await generateNextOrderNumber(body.businessId);
        console.log(`[Orders API] Generated order number: ${orderNumber} (attempt ${attempt})`);

        // 1. Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            businessId: body.businessId,
            orderNumber,
            customerName: body.customerName,
            customerPhone: body.customerPhone || null,
            customerEmail: body.customerEmail || null,
            customerAddress: body.customerAddress || null,
            customerNotes: body.customerNotes || null,
            orderType: body.orderType || OrderType.RESTAURANT,
            subtotal: body.subtotal || 0,
            deliveryFee: body.deliveryFee || 0,
            tax: body.tax || 0,
            total: body.total,
            currency: Currency.COP,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: body.paymentMethod || null,
            neighborhood: body.neighborhood || null,
            estimatedDelivery: body.estimatedDelivery || null,
            invoiceNumber: body.invoiceNumber || null,
            notes: body.notes || null,
          })
          .select('id, orderNumber')
          .single();

        if (orderError) {
          console.error(`[Orders API] Insert error (attempt ${attempt}):`, orderError);
          lastError = orderError.message;
          
          // Check if it's a duplicate key error - retry with new number
          if (orderError.code === '23505') {
            if (attempt < MAX_RETRIES) {
              console.warn(`[Orders API] Duplicate order number ${orderNumber} (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
              // Small delay to reduce collision probability
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 10));
              continue;
            } else {
              console.error('[Orders API] Failed to create order after', MAX_RETRIES, 'attempts due to duplicates. Last orderNumber:', orderNumber);
              throw new Error('No se pudo crear el pedido después de múltiples intentos (duplicados)');
            }
          }
          // For non-duplicate errors, throw immediately
          console.error('[Orders API] Non-retryable error:', orderError);
          throw new Error(orderError.message);
        }

        order = orderData;
        console.log('[Orders API] Order created successfully:', order.id, orderNumber);
        break;
      } catch (error: any) {
        lastError = error.message;
        // Only retry on duplicate key errors
        if (error.message?.includes('duplicate key') && attempt < MAX_RETRIES) {
          console.warn(`[Orders API] Duplicate detected (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 10));
          continue;
        }
        // For other errors, throw immediately
        console.error('[Orders API] Exception:', error);
        throw error;
      }
    }

    if (!order || !orderNumber) {
      const errorMsg = lastError || 'No se pudo generar un número de pedido único después de múltiples intentos';
      console.error('[Orders API] Final failure:', errorMsg);
      throw new Error(errorMsg);
    }

    // 2. Create order items with full order data fetch
    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single();

    if (fetchError || !fullOrder) {
      throw new Error('No se pudo obtener los datos completos del pedido');
    }
    const itemsToInsert = body.items.map((item: OrderItemInput) => ({
      orderId: fullOrder.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      notes: item.notes || null
    }));

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error('[Orders API] Error creating order items in Supabase:', itemsError);
      // Optional: rollback order creation? Supabase doesn't support easy transactions across calls
      // but we could try to delete the order if items fail.
      await supabase.from('orders').delete().eq('id', fullOrder.id);
      throw new Error(itemsError.message);
    }

    const completeOrder = { ...fullOrder, items };

    console.log(`[Orders API] Created order ${fullOrder.id} (${orderNumber}) for business ${body.businessId}`);

    return NextResponse.json({
      success: true,
      data: completeOrder
    });
  } catch (error: any) {
    console.error('[Orders API] Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear pedido: ' + error.message },
      { status: 500 }
    );
  }
}

// =============================================
// PUT - Update Order
// =============================================

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpdateOrderInput = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID del pedido es requerido' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.paymentStatus;
    }
    if (body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.paymentMethod;
    }
    if (body.driverName !== undefined) {
      updateData.driverName = body.driverName;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', body.id)
      .select('*, items:order_items(*)')
      .single();

    if (error) {
      console.error('[Orders API] Error updating order in Supabase:', error);
      throw new Error(error.message);
    }

    console.log(`[Orders API] Updated order ${body.id}`);

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('[Orders API] Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar pedido: ' + error.message },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE - Delete Order
// =============================================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del pedido es requerido' },
        { status: 400 }
      );
    }

    // Delete order (with ON DELETE CASCADE in DB, order_items will be deleted automatically)
    // If not, we should delete them manually. Prisma's schema says onDelete: Cascade.
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Orders API] Error deleting order in Supabase:', error);
      throw new Error(error.message);
    }

    console.log(`[Orders API] Deleted order ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Pedido eliminado correctamente'
    });
  } catch (error: any) {
    console.error('[Orders API] Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar pedido: ' + error.message },
      { status: 500 }
    );
  }
}
