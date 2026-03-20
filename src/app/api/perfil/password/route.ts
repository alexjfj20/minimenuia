import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UpdatePasswordPayload } from '@/types/perfil';

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

    const body: UpdatePasswordPayload = await request.json();

    if (body.newPassword !== body.confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 });
    }

    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres' }, { status: 400 });
    }

    if (!/[A-Z]/.test(body.newPassword) || !/[a-z]/.test(body.newPassword) || !/[0-9]/.test(body.newPassword)) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener letras mayúsculas, minúsculas y números' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: body.newPassword
    });

    if (error) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : 'Error') }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'Error') || 'Error interno' }, { status: 500 });
  }
}
