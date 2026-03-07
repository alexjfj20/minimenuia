// =============================================
// MINIMENU - Auth Login API (con pg directo)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[Login API] Starting login process...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log('[Login API] Login attempt for:', email);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Find user with business info
      const userResult = await client.query(
        `SELECT u.id, u.email, u.name, u.password, u.role, u."businessId",
                b.name as "businessName", b.slug as "businessSlug"
         FROM users u
         LEFT JOIN businesses b ON u."businessId" = b.id
         WHERE u.email = $1`,
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        console.log('[Login API] User not found:', email);
        return NextResponse.json(
          { success: false, error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        console.log('[Login API] Invalid password for:', email);
        return NextResponse.json(
          { success: false, error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      console.log('[Login API] Login successful for:', email);

      // Create session data
      const sessionData = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        businessName: user.businessName || null,
      };

      const response = NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.businessId,
          businessName: user.businessName || null,
        },
        message: 'Inicio de sesión exitoso',
      });

      // Set session cookie
      response.cookies.set('session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
