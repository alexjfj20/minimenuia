import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we don't reveal that information
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.'
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // In a real application, you would send an email here
    // For demo purposes, we log the reset link
    console.log(`
      ========================================
      PASSWORD RESET REQUEST
      ========================================
      User: ${user.email}
      Reset Token: ${resetToken}
      Reset Link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}
      Expires: ${resetTokenExpiry.toISOString()}
      ========================================
    `);

    return NextResponse.json({
      success: true,
      message: 'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
