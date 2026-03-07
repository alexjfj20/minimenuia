import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Invoice type definition
interface InvoiceItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface RestaurantInvoiceType {
  id: string;
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

// In-memory storage for TPV invoices (in production, use a database)
let invoices: RestaurantInvoiceType[] = [];

// GET - Fetch all invoices (combines TPV invoices + RESTAURANT orders from database)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    // Start with TPV invoices from memory
    const allInvoices: RestaurantInvoiceType[] = [...invoices];

    // Also fetch RESTAURANT orders from database
    if (businessId) {
      try {
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
        const ordersAsInvoices: RestaurantInvoiceType[] = restaurantOrders.map(order => ({
          id: order.id,
          invoiceNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
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
          paymentMethod: (order.paymentMethod?.toLowerCase() === 'efectivo' ? 'cash' :
                         order.paymentMethod?.toLowerCase() === 'tarjeta' ? 'card' :
                         order.paymentMethod?.toLowerCase() === 'transferencia' ? 'transfer' : 'cash') as 'cash' | 'card' | 'transfer',
          status: order.paymentStatus === 'PAID' ? 'paid' :
                  order.paymentStatus === 'REFUNDED' ? 'cancelled' : 'pending',
          createdAt: order.createdAt.toISOString(),
          notes: order.notes || undefined,
          source: 'cart' as const
        }));

        // Merge: Add database orders that don't already exist in memory
        for (const orderInvoice of ordersAsInvoices) {
          if (!allInvoices.some(inv => inv.id === orderInvoice.id)) {
            allInvoices.push(orderInvoice);
          }
        }

        console.log('[Restaurant Invoice API] GET invoices:', invoices.length, 'TPV +', ordersAsInvoices.length, 'from DB =', allInvoices.length);
      } catch (dbError) {
        console.error('[Restaurant Invoice API] Error fetching from database:', dbError);
        // Continue with just TPV invoices if database fails
      }
    } else {
      console.log('[Restaurant Invoice API] GET invoices:', invoices.length, '(no businessId provided)');
    }

    // Sort by createdAt descending
    allInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      invoices: allInvoices
    });
  } catch (error) {
    console.error('[Restaurant Invoice API] Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}

// POST - Create a new invoice (from TPV)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RestaurantInvoiceType;
    console.log('[Restaurant Invoice API] Creating invoice:', body.invoiceNumber);

    const newInvoice: RestaurantInvoiceType = {
      ...body,
      createdAt: body.createdAt || new Date().toISOString(),
      source: 'tpv' as const
    };

    // Add to the beginning of the array (newest first)
    invoices = [newInvoice, ...invoices];

    return NextResponse.json({
      success: true,
      invoice: newInvoice
    });
  } catch (error) {
    console.error('[Restaurant Invoice API] Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear factura' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an invoice
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de factura requerido' },
        { status: 400 }
      );
    }

    console.log('[Restaurant Invoice API] Deleting invoice:', id);

    // Remove from memory
    invoices = invoices.filter(inv => inv.id !== id);

    // Also try to delete from database if it exists
    try {
      await db.order.delete({
        where: { id }
      });
      console.log('[Restaurant Invoice API] Also deleted from database:', id);
    } catch {
      // Order might not exist in database, that's OK
    }

    return NextResponse.json({
      success: true,
      message: 'Factura eliminada correctamente'
    });
  } catch (error) {
    console.error('[Restaurant Invoice API] Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar factura' },
      { status: 500 }
    );
  }
}
