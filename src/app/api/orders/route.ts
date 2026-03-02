import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus, OrderType, Currency } from '@prisma/client';

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

    // Build filter
    const where: {
      businessId: string;
      orderType?: OrderType;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = { businessId };

    if (orderType) {
      where.orderType = orderType;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[Orders API] GET orders for business ${businessId}: ${orders.length} found`);

    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('[Orders API] Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener pedidos' },
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

    // Create order with items
    const order = await db.order.create({
      data: {
        businessId: body.businessId,
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
        items: {
          create: body.items.map((item: OrderItemInput) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes || null
          }))
        }
      },
      include: {
        items: true
      }
    });

    console.log(`[Orders API] Created order ${order.id} for business ${body.businessId}`);

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('[Orders API] Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear pedido' },
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
    const updateData: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      paymentMethod?: string;
      driverName?: string;
      notes?: string;
    } = {};

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

    const order = await db.order.update({
      where: { id: body.id },
      data: updateData,
      include: {
        items: true
      }
    });

    console.log(`[Orders API] Updated order ${body.id}`);

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('[Orders API] Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar pedido' },
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

    // Delete order items first (cascade)
    await db.orderItem.deleteMany({
      where: { orderId: id }
    });

    // Delete order
    await db.order.delete({
      where: { id }
    });

    console.log(`[Orders API] Deleted order ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Pedido eliminado correctamente'
    });
  } catch (error) {
    console.error('[Orders API] Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar pedido' },
      { status: 500 }
    );
  }
}
