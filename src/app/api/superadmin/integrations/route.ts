import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[SuperAdmin Integrations API] Fetching all integrations with service role...');

    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .order('name', { ascending: false });

    if (error) {
      console.error('[SuperAdmin Integrations API] Supabase error:', error.message);
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    console.log('[SuperAdmin Integrations API] Found:', data?.length ?? 0, 'integrations');
    return NextResponse.json({ success: true, data: data ?? [], error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[SuperAdmin Integrations API] Exception:', message);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
