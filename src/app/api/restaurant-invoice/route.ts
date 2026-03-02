import { NextRequest, NextResponse } from 'next/server';

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
}

// In-memory storage for invoices (in production, use a database)
let invoices: RestaurantInvoiceType[] = [];

// GET - Fetch all invoices
export async function GET() {
  try {
    console.log('[Restaurant Invoice API] GET invoices:', invoices.length);
    
    return NextResponse.json({
      success: true,
      invoices: invoices
    });
  } catch (error) {
    console.error('[Restaurant Invoice API] Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}

// POST - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RestaurantInvoiceType;
    console.log('[Restaurant Invoice API] Creating invoice:', body.invoiceNumber);
    
    const newInvoice: RestaurantInvoiceType = {
      ...body,
      createdAt: body.createdAt || new Date().toISOString()
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
    
    invoices = invoices.filter(inv => inv.id !== id);
    
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
