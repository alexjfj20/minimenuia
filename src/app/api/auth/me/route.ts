// =============================================
// MINIMENU - Auth Me API (Get Current User)
// =============================================

import { NextRequest, NextResponse } from 'next/server';

interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  businessId: string | null;
  businessName: string | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, data: null, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const sessionData: SessionData = JSON.parse(sessionCookie.value);

    return NextResponse.json({
      success: true,
      data: {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        role: sessionData.role,
        businessId: sessionData.businessId,
        businessName: sessionData.businessName,
      },
    });
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Error de sesión' },
      { status: 500 }
    );
  }
}
