import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[SuperAdmin Modules API] Fetching all modules with service role...');

    const { data, error } = await supabaseAdmin
      .from('modules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SuperAdmin Modules API] Supabase error:', error.message);
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    console.log('[SuperAdmin Modules API] Found:', data?.length ?? 0, 'modules');
    return NextResponse.json({ success: true, data: data ?? [], error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[SuperAdmin Modules API] Exception:', message);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
