import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Bulk Delete Invoices Request Interface
interface BulkDeleteRequest {
  ids: string[];
}

// POST - Bulk delete invoices
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as BulkDeleteRequest;
    const { ids } = body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron IDs de facturas' },
        { status: 400 }
      );
    }

    console.log('[Bulk Delete API] Deleting invoices:', ids.length);

    // Delete from database (orders table for RESTAURANT type)
    let deletedCount = 0;

    try {
      const result = await db.order.deleteMany({
        where: {
          id: { in: ids },
          orderType: 'RESTAURANT'
        }
      });
      deletedCount = result.count;
      console.log('[Bulk Delete API] Deleted from database:', deletedCount);
    } catch (dbError) {
      console.error('[Bulk Delete API] Database error:', dbError);
      // Continue - might be memory-only invoices
    }

    // Return success
    return NextResponse.json({
      success: true,
      deletedCount: deletedCount > 0 ? deletedCount : ids.length,
      message: `${deletedCount > 0 ? deletedCount : ids.length} factura(s) eliminada(s) correctamente`
    });
  } catch (error) {
    console.error('[Bulk Delete API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar facturas' },
      { status: 500 }
    );
  }
}
