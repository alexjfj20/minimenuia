import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se incluyó archivo de imagen' }, { status: 400 });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo inválido. Solo JPG, PNG o WEBP' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo permitido (2MB)' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `admin-${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Error al subir la imagen al almacenamiento: ' + uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData?.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from('admin_profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar enlace de avatar en el perfil' }, { status: 500 });
    }

    return NextResponse.json({ avatarUrl: publicUrl });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'Error') || 'Error interno' }, { status: 500 });
  }
}
