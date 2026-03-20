// =============================================
// MINIMENU - Auth Login API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar usuario en la base de datos usando el cliente admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar usuario en la base de datos
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*, businesses!users_businessId_fkey(id, name, slug)')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError || !user) {
      console.error('[Login] User query error:', userError);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const business = user.businesses;

    // Verificar contraseña
    console.log('[Login] User found:', user.id, 'email:', user.email);

    if (!user.password || typeof user.password !== 'string') {
      console.error('[Login] Invalid password format in database');
      return NextResponse.json(
        { success: false, error: 'Error de configuración de usuario' },
        { status: 500 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Iniciar sesión en Supabase Auth
    // Esto creará una sesión válida que getSession() podrá recuperar
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (authError || !authData.user) {
      console.error('[Login] Supabase Auth error:', authError);
      // Si falla Supabase Auth pero la contraseña es válida,
      // el usuario puede no estar en auth.users - continuar con cookie
    }

    // Crear sesión simple (en producción usar JWT o next-auth completo)
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      businessName: business?.name ?? null,
    };

    // Respuesta con cookie de sesión
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        businessName: business?.name ?? null,
      },
      message: 'Inicio de sesión exitoso',
    });

    // Establecer cookie de sesión (httpOnly para seguridad)
    response.cookies.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
