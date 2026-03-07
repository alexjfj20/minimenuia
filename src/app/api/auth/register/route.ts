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

interface ErrorDetails {
  message: string;
  code?: string;
  meta?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[Register API] Starting registration process...');
  
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, name, businessName, phone } = body;

    console.log('[Register API] Received data:', { 
      email, 
      name, 
      businessName, 
      phone: phone ? 'provided' : 'not provided' 
    });

    // Validate required fields
    if (!email || !password || !name || !businessName) {
      console.log('[Register API] Validation failed: missing fields');
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[Register API] Validation failed: invalid email');
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      console.log('[Register API] Validation failed: password too short');
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Check database connection first
    console.log('[Register API] Checking database connection...');
    try {
      await db.$queryRaw`SELECT 1`;
      console.log('[Register API] Database connection OK');
    } catch (dbError) {
      console.error('[Register API] Database connection failed:', dbError);
      const errorDetails: ErrorDetails = {
        message: 'Error de conexión a la base de datos',
        code: dbError instanceof Error ? 'CONNECTION_ERROR' : 'UNKNOWN',
        meta: dbError instanceof Error ? dbError.message : String(dbError)
      };
      return NextResponse.json(
        { success: false, error: 'Error de conexión a la base de datos. Por favor contacte al administrador.', details: errorDetails },
        { status: 500 }
      );
    }

    // Check if user already exists
    console.log('[Register API] Checking if user exists...');
    let existingUser;
    try {
      existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch (findError) {
      console.error('[Register API] Error checking user:', findError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al verificar usuario existente',
          details: findError instanceof Error ? findError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('[Register API] User already exists:', email);
      return NextResponse.json(
        { success: false, error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Get or create default plan (free plan)
    console.log('[Register API] Getting default plan...');
    let defaultPlan;
    try {
      defaultPlan = await db.plan.findFirst({
        where: { slug: 'gratis' },
      });
    } catch (planFindError) {
      console.error('[Register API] Error finding plan:', planFindError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al buscar plan disponible',
          details: planFindError instanceof Error ? planFindError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (!defaultPlan) {
      console.log('[Register API] Creating default plan...');
      try {
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
        console.log('[Register API] Default plan created:', defaultPlan.id);
      } catch (planCreateError) {
        console.error('[Register API] Error creating plan:', planCreateError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al crear plan gratuito',
            details: planCreateError instanceof Error ? planCreateError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else {
      console.log('[Register API] Found existing plan:', defaultPlan.id);
    }

    // Generate unique slug for business
    console.log('[Register API] Generating business slug...');
    const baseSlug = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let slugCounter = 1;

    try {
      while (await db.business.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }
    } catch (slugError) {
      console.error('[Register API] Error checking slug:', slugError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al generar slug del negocio',
          details: slugError instanceof Error ? slugError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    console.log('[Register API] Generated slug:', slug);

    // Hash password
    console.log('[Register API] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create business and user in a transaction
    console.log('[Register API] Creating business and user...');
    let result;
    try {
      result = await db.$transaction(async (tx) => {
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
        console.log('[Register API] Business created:', business.id);

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
        console.log('[Register API] User created:', user.id);

        // Update business with correct ownerId
        await tx.business.update({
          where: { id: business.id },
          data: { ownerId: user.id },
        });

        return { user, business };
      });
    } catch (txError) {
      console.error('[Register API] Transaction error:', txError);
      
      // Check if it's a Prisma error with more details
      const prismaError = txError as { code?: string; meta?: unknown; message?: string };
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al crear la cuenta en la base de datos',
          details: {
            code: prismaError.code || 'UNKNOWN',
            message: prismaError.message || 'Unknown transaction error',
            meta: prismaError.meta || null
          }
        },
        { status: 500 }
      );
    }

    console.log('[Register API] Registration successful for:', email);

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
    console.error('[Register API] Unhandled error:', error);
    
    const errorDetails: ErrorDetails = {
      message: error instanceof Error ? error.message : 'Error desconocido',
      code: 'UNHANDLED_ERROR'
    };
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear la cuenta. Por favor intente nuevamente.',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
