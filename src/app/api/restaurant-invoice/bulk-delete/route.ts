import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    // Delete from Supabase (orders table for RESTAURANT type)
    const { data: result, error: deleteError } = await supabaseAdmin
      .from('orders')
      .delete()
      .in('id', ids)
      .eq('orderType', 'RESTAURANT')
      .select();

    if (deleteError) {
      console.error('[Bulk Delete API] Database error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar facturas' },
        { status: 500 }
      );
    }

    const deletedCount = result?.length || ids.length;
    console.log('[Bulk Delete API] Deleted from database:', deletedCount);

    // Return success
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} factura(s) eliminada(s) correctamente`
    });
  } catch (error) {
    console.error('[Bulk Delete API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar facturas' },
      { status: 500 }
    );
  }
}
