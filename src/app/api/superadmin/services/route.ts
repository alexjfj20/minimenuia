import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[SuperAdmin Services API] Fetching all services with service role...');

    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SuperAdmin Services API] Supabase error:', error.message);
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    console.log('[SuperAdmin Services API] Found:', data?.length ?? 0, 'services');
    return NextResponse.json({ success: true, data: data ?? [], error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[SuperAdmin Services API] Exception:', message);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
