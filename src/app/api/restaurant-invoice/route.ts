import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderType, PaymentStatus, OrderStatus, Currency } from '@prisma/client';

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
    const restaurantOrders = await db.order.findMany({
      where: {
        businessId: businessId,
        orderType: 'RESTAURANT'
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Convert database orders to invoice format
    const invoices: RestaurantInvoiceType[] = restaurantOrders.map(order => ({
      id: order.id,
      businessId: order.businessId,
      invoiceNumber: order.orderNumber || order.invoiceNumber || `ORD-${order.id.slice(-6)}`,
      customerName: order.customerName,
      customerPhone: order.customerPhone || undefined,
      items: order.items.map(item => ({
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
      createdAt: order.createdAt.toISOString(),
      notes: order.notes || undefined,
      source: order.invoiceNumber ? 'tpv' : 'cart'
    }));

    console.log(`[Restaurant Invoice API] GET from DB for business ${businessId}: ${invoices.length} invoices`);

    return NextResponse.json({
      success: true,
      invoices: invoices
    });
  } catch (error) {
    console.error('[Restaurant Invoice API] Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas de la base de datos' },
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

    // Create a new order to represent this invoice
    const newOrder = await db.order.create({
      data: {
        businessId: body.businessId,
        orderNumber: body.invoiceNumber || `TPV-${Date.now()}`,
        invoiceNumber: body.invoiceNumber,
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
        items: {
          create: body.items.map(item => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          }))
        }
      },
      include: {
        items: true
      }
    });

    const responseInvoice: RestaurantInvoiceType = {
      ...body,
      id: newOrder.id,
      createdAt: newOrder.createdAt.toISOString(),
      source: 'tpv' as const
    };

    return NextResponse.json({
      success: true,
      invoice: responseInvoice
    });
  } catch (error) {
    console.error('[Restaurant Invoice API] Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la factura en la base de datos' },
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
    await db.order.delete({
      where: {
        id,
        businessId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Factura eliminada correctamente'
    });
  } catch (error) {
    console.error('[Restaurant Invoice API] Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar factura de la base de datos' },
      { status: 500 }
    );
  }
}
