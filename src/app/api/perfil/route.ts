import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UpdateProfilePayload } from '@/types/perfil';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '').trim();
}

function getSessionFromCookie(request: NextRequest): { userId: string; role: string; email: string } | null {
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie?.value) {
    console.log('[Perfil API] No session cookie');
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    
    if (session.userId && session.role && session.email) {
      return {
        userId: session.userId,
        role: session.role,
        email: session.email
      };
    }
  } catch (parseError) {
    console.error('[Perfil API] Error parsing session cookie:', parseError);
    return null;
  }
  return null;
}

async function getUserByToken(token: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role as string || ''
    };
  } catch (error) {
    console.error('[Perfil API] Error in getUserByToken:', error);
    return null;
  }
}

async function getUserFromRequest(request: NextRequest) {
  // Intentar 1: Obtener usuario desde token Bearer
  const token = extractToken(request);
  if (token) {
    const user = await getUserByToken(token);
    if (user) {
      return user;
    }
  }

  // Intentar 2: Obtener usuario desde cookie de sesión
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

function normalizeRole(role: string): string {
  // Normalizar rol a minúsculas para comparación
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'super_admin',
    'BUSINESS_ADMIN': 'admin',
    'STAFF': 'employee',
    'ADMIN': 'admin',
    'EMPLOYEE': 'employee'
  };
  return roleMap[role.toUpperCase()] || role.toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[Perfil API] Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json({ error: 'Configuración incompleta del servidor' }, { status: 500 });
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Perfil API] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Configuración incompleta del servidor' }, { status: 500 });
    }

    const user = await getUserFromRequest(request);

    if (!user) {
      console.error('[Perfil API] No authentication found');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Normalizar rol para comparación
    const normalizedRole = normalizeRole(user.role);
    
    console.log('[Perfil API] User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role,
      normalizedRole: normalizedRole
    });

    // Verificar si el usuario es super_admin (comparar normalizado)
    if (normalizedRole !== 'super_admin') {
      console.error('[Perfil API] Access denied. Role:', user.role, 'normalized:', normalizedRole);
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de super_admin.' }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar perfil existente
    let { data: profileData, error: profileError } = await supabaseAdmin
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Perfil API] Error fetching profile:', profileError);
    }

    // Si no existe perfil, crearlo automáticamente para super_admin
    if (!profileData) {
      const displayName = user.email.split('@')[0] || 'Super Admin';
      const fullName = user.email || 'Super Admin';

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('admin_profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          display_name: displayName,
          company_name: 'MINIMENU',
          timezone: 'America/Bogota',
          language: 'es'
        })
        .select()
        .single();

      if (createError) {
        console.error('[Perfil API] Error creating profile:', createError);
        return NextResponse.json({ error: 'Error al crear perfil de administrador' }, { status: 500 });
      }

      profileData = newProfile;
    }

    const profile = {
      id: profileData.id,
      fullName: profileData.full_name,
      displayName: profileData.display_name,
      email: user.email,
      phone: profileData.phone || '',
      avatarUrl: profileData.avatar_url || '',
      bio: profileData.bio || '',
      companyName: profileData.company_name || '',
      companyWebsite: profileData.company_website || '',
      timezone: profileData.timezone || '',
      language: profileData.language || '',
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at
    };

    const notifications = {
      emailNotifications: profileData.email_notifications,
      systemAlerts: profileData.system_alerts,
      newBusinessAlerts: profileData.new_business_alerts,
      paymentAlerts: profileData.payment_alerts
    };

    return NextResponse.json({ profile, notifications });
  } catch (error: unknown) {
    console.error('[Perfil API] Internal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    const body: UpdateProfilePayload = await request.json();

    if (!body.fullName || body.fullName.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre completo debe tener mínimo 2 caracteres' }, { status: 400 });
    }
    if (!body.displayName || body.displayName.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre a mostrar debe tener mínimo 2 caracteres' }, { status: 400 });
    }
    if (body.phone && !/^[+0-9\s-]{5,20}$/.test(body.phone)) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
    }
    if (body.companyWebsite && !/^https?:\/\/.*/.test(body.companyWebsite)) {
      return NextResponse.json({ error: 'Sitio web inválido (debe incluir http:// o https://)' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('admin_profiles')
      .update({
        full_name: body.fullName,
        display_name: body.displayName,
        phone: body.phone,
        bio: body.bio,
        company_name: body.companyName,
        company_website: body.companyWebsite,
        timezone: body.timezone,
        language: body.language
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
