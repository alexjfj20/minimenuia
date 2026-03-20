import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UpdateNotificationsPayload } from '@/types/perfil';

function getSessionFromCookie(request: NextRequest): { userId: string; role: string; email: string } | null {
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie?.value) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (session.userId && session.role && session.email) {
      return {
        userId: session.userId,
        role: session.role,
        email: session.email
      };
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'super_admin',
    'BUSINESS_ADMIN': 'admin',
    'STAFF': 'employee',
    'ADMIN': 'admin',
    'EMPLOYEE': 'employee'
  };
  return roleMap[role.toUpperCase()] || role.toLowerCase();
}

async function getUserFromRequest(request: NextRequest) {
  const sessionFromCookie = getSessionFromCookie(request);
  if (sessionFromCookie) {
    return {
      id: sessionFromCookie.userId,
      email: sessionFromCookie.email,
      role: sessionFromCookie.role
    };
  }
  return null;
}

async function ensureAdminProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: existingProfile } = await supabaseAdmin
    .from('admin_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingProfile) {
    await supabaseAdmin
      .from('admin_profiles')
      .insert({
        id: userId,
        full_name: 'Super Admin',
        display_name: 'Super Admin',
        company_name: 'MINIMENU',
        timezone: 'America/Bogota',
        language: 'es'
      });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const normalizedRole = normalizeRole(user.role);
    
    if (normalizedRole !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de super_admin.' }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await ensureAdminProfile(supabaseAdmin, user.id);

    const body: UpdateNotificationsPayload = await request.json();

    if (
      typeof body.emailNotifications !== 'boolean' ||
      typeof body.systemAlerts !== 'boolean' ||
      typeof body.newBusinessAlerts !== 'boolean' ||
      typeof body.paymentAlerts !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Campos booleanos inválidos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('admin_profiles')
      .update({
        email_notifications: body.emailNotifications,
        system_alerts: body.systemAlerts,
        new_business_alerts: body.newBusinessAlerts,
        payment_alerts: body.paymentAlerts
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : 'Error') }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'Error') || 'Error interno' }, { status: 500 });
  }
}
