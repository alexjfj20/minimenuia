// =============================================
// MINIMENU - Auth Logout API
// =============================================

import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });

    // Eliminar cookie de sesión
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
