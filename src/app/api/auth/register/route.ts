// =============================================
// MINIMENU - Auth Register API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  businessName: string;
  phone: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, name, businessName, phone } = body;

    // Validate required fields
    if (!email || !password || !name || !businessName) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Get or create default plan (free plan)
    let defaultPlan = await db.plan.findFirst({
      where: { slug: 'gratis' },
    });

    if (!defaultPlan) {
      defaultPlan = await db.plan.create({
        data: {
          name: 'Gratis',
          slug: 'gratis',
          description: 'Plan gratuito para comenzar',
          price: 0,
          currency: 'COP',
          period: 'MONTHLY',
          features: 'Hasta 50 productos,1 usuario,Soporte por email',
          isActive: true,
          isPublic: true,
          isPopular: false,
          order: 0,
          icon: 'zap',
          color: '#8b5cf6',
          maxUsers: 1,
          maxProducts: 50,
          maxCategories: 5,
        },
      });
    }

    // Generate unique slug for business
    const baseSlug = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let slugCounter = 1;

    while (await db.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create business and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create business first
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
          ownerId: 'temp',
          ownerName: name,
          ownerEmail: email.toLowerCase(),
          phone: phone || '',
          address: '',
          planId: defaultPlan!.id,
          status: 'ACTIVE',
          primaryColor: '#8b5cf6',
          secondaryColor: '#ffffff',
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
          role: 'BUSINESS_ADMIN',
          businessId: business.id,
        },
      });

      // Update business with correct ownerId
      await tx.business.update({
        where: { id: business.id },
        data: { ownerId: user.id },
      });

      return { user, business };
    });

    // Create session
    const sessionData = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      businessId: result.user.businessId,
      businessName: result.business.name,
    };

    // Response with cookie
    const response = NextResponse.json({
      success: true,
      data: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        businessId: result.user.businessId,
        businessName: result.business.name,
      },
      message: 'Cuenta creada exitosamente',
    });

    // Set session cookie
    response.cookies.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la cuenta. Por favor intente nuevamente.' },
      { status: 500 }
    );
  }
}
