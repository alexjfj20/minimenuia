// =============================================
// MINIMENU - Auth Login API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
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

    // Buscar usuario en la base de datos
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*, business:businesses(id, name, slug)')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError || !user) {
      console.error('[Login] User query error:', userError);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Crear sesión simple (en producción usar JWT o next-auth completo)
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      businessName: user.business?.name ?? null,
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
        businessName: user.business?.name ?? null,
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
