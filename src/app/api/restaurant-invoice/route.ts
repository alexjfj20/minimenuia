import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { OrderType, PaymentStatus, OrderStatus, Currency } from '@/types/database';
import { generateNextOrderNumber } from '@/lib/order-utils';

// Invoice type definition
interface InvoiceItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface RestaurantInvoiceType {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: string;
  notes?: string;
  source?: 'tpv' | 'cart'; // Origin: TPV or Shopping Cart
}

// GET - Fetch all invoices (filtered by businessId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId es requerido para obtener facturas' },
        { status: 400 }
      );
    }

    // Fetch all RESTAURANT orders from database for this specific business
    const { data: restaurantOrders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('businessId', businessId)
      .eq('orderType', 'RESTAURANT')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[Restaurant Invoice API] Supabase error:', error);
      throw new Error(error.message);
    }

    // Convert database orders to invoice format
    const invoices: RestaurantInvoiceType[] = (restaurantOrders || []).map(order => ({
      id: order.id,
      businessId: order.businessId,
      invoiceNumber: order.orderNumber || order.invoiceNumber || `ORD-${order.id.slice(-6)}`,
      customerName: order.customerName,
      customerPhone: order.customerPhone || undefined,
      items: (order.items || []).map((item: any) => ({
        productId: item.productId,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      paymentMethod: (order.paymentMethod?.toLowerCase() === 'efectivo' || order.paymentMethod?.toLowerCase() === 'cash' ? 'cash' :
        order.paymentMethod?.toLowerCase() === 'tarjeta' || order.paymentMethod?.toLowerCase() === 'card' ? 'card' :
          order.paymentMethod?.toLowerCase() === 'transferencia' || order.paymentMethod?.toLowerCase() === 'transfer' ? 'transfer' : 'cash') as 'cash' | 'card' | 'transfer',
      status: order.paymentStatus === 'PAID' ? 'paid' :
        order.paymentStatus === 'REFUNDED' || order.status === 'CANCELLED' ? 'cancelled' : 'pending',
      createdAt: new Date(order.createdAt).toISOString(),
      notes: order.notes || undefined,
      source: order.invoiceNumber ? 'tpv' : 'cart'
    }));

    console.log(`[Restaurant Invoice API] GET from DB for business ${businessId}: ${invoices.length} invoices`);

    return NextResponse.json({
      success: true,
      invoices: invoices
    });
  } catch (error: any) {
    console.error('[Restaurant Invoice API] Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas de la base de datos: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new invoice in the database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RestaurantInvoiceType;

    if (!body.businessId) {
      return NextResponse.json({ success: false, error: 'businessId es requerido' }, { status: 400 });
    }

    console.log('[Restaurant Invoice API] Creating invoice in DB:', body.invoiceNumber, 'for business:', body.businessId);

    // Generate unique order number for this invoice (separate from invoice number)
    const orderNumber = await generateNextOrderNumber(body.businessId);
    console.log('[Restaurant Invoice API] Generated order number:', orderNumber);

    // 1. Create a new order to represent this invoice
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        businessId: body.businessId,
        orderNumber,  // Unique order number (ORD-0001, ORD-0002, etc.)
        invoiceNumber: body.invoiceNumber,  // Invoice number (FAC-0001, FAC-0002, etc.)
        customerName: body.customerName || 'Cliente General',
        customerPhone: body.customerPhone || null,
        subtotal: body.subtotal,
        tax: body.tax,
        total: body.total,
        currency: Currency.COP,
        orderType: OrderType.RESTAURANT,
        status: body.status === 'cancelled' ? OrderStatus.CANCELLED : OrderStatus.DELIVERED,
        paymentStatus: body.status === 'paid' ? PaymentStatus.PAID : PaymentStatus.PENDING,
        paymentMethod: body.paymentMethod === 'cash' ? 'Efectivo' :
          body.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia',
        notes: body.notes || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Restaurant Invoice API] Error creating order in Supabase:', orderError);
      throw new Error(orderError.message);
    }

    // 2. Create items
    const itemsToInsert = body.items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error('[Restaurant Invoice API] Error creating items in Supabase:', itemsError);
      await supabase.from('orders').delete().eq('id', newOrder.id);
      throw new Error(itemsError.message);
    }

    const responseInvoice: RestaurantInvoiceType = {
      ...body,
      id: newOrder.id,
      createdAt: new Date(newOrder.createdAt).toISOString(),
      source: 'tpv' as const
    };

    return NextResponse.json({
      success: true,
      invoice: responseInvoice
    });
  } catch (error: any) {
    console.error('[Restaurant Invoice API] Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la factura en la base de datos: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete an invoice
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const businessId = searchParams.get('businessId');

    if (!id || !businessId) {
      return NextResponse.json(
        { success: false, error: 'ID y businessId son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[Restaurant Invoice API] Deleting invoice ${id} for business ${businessId}`);

    // Strict filtering by businessId for security
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('businessId', businessId);

    if (error) {
      console.error('[Restaurant Invoice API] Error deleting invoice in Supabase:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Factura eliminada correctamente'
    });
  } catch (error: any) {
    console.error('[Restaurant Invoice API] Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar factura de la base de datos: ' + error.message },
      { status: 500 }
    );
  }
}
