import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[SuperAdmin Businesses API] Fetching all businesses with service role...');

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[SuperAdmin Businesses API] Supabase error:', error.message);
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    console.log('[SuperAdmin Businesses API] Found:', data?.length ?? 0, 'businesses');
    return NextResponse.json({ success: true, data: data ?? [], error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[SuperAdmin Businesses API] Exception:', message);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
