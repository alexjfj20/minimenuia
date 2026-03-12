// =============================================
// MINIMENU - Auth Register API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  businessName: string;
  phone: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[Register API] Starting registration process...');

  try {
    const body: RegisterRequest = await request.json();
    const { email, password, name, businessName, phone } = body;

    console.log('[Register API] Received data:', { email, name, businessName, phone: phone ? 'provided' : 'not provided' });

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

    // Check if user already exists
    console.log('[Register API] Checking if user exists...');
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      console.log('[Register API] User already exists:', email);
      return NextResponse.json(
        { success: false, error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Get or create default plan (free plan)
    console.log('[Register API] Getting default plan...');
    let { data: defaultPlan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', 'gratis')
      .maybeSingle();

    if (!defaultPlan) {
      console.log('[Register API] Creating default plan...');
      const { data: newPlan, error: planError } = await supabaseAdmin
        .from('plans')
        .insert({
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
        })
        .select()
        .single();

      if (planError) {
        console.error('[Register API] Error creating plan:', planError);
        return NextResponse.json(
          { success: false, error: 'Error al crear plan gratuito' },
          { status: 500 }
        );
      }
      defaultPlan = newPlan;
      console.log('[Register API] Default plan created:', defaultPlan.id);
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

    // Check slug uniqueness
    while (true) {
      const { data: existingBusiness } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (!existingBusiness) break;
      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }
    console.log('[Register API] Generated slug:', slug);

    // Hash password
    console.log('[Register API] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create business and user
    console.log('[Register API] Creating business and user...');
    
    // Create business first
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: businessName,
        slug,
        ownerId: 'temp',
        ownerName: name,
        ownerEmail: email.toLowerCase(),
        phone: phone || '',
        address: '',
        planId: defaultPlan.id,
        status: 'ACTIVE',
        primaryColor: '#8b5cf6',
        secondaryColor: '#ffffff',
      })
      .select()
      .single();

    if (businessError) {
      console.error('[Register API] Error creating business:', businessError);
      return NextResponse.json(
        { success: false, error: 'Error al crear el negocio' },
        { status: 500 }
      );
    }
    console.log('[Register API] Business created:', business.id);

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: 'BUSINESS_ADMIN',
        businessId: business.id,
      })
      .select()
      .single();

    if (userError) {
      console.error('[Register API] Error creating user:', userError);
      // Rollback: delete business
      await supabaseAdmin.from('businesses').delete().eq('id', business.id);
      return NextResponse.json(
        { success: false, error: 'Error al crear el usuario' },
        { status: 500 }
      );
    }
    console.log('[Register API] User created:', user.id);

    // Update business with correct ownerId
    await supabaseAdmin
      .from('businesses')
      .update({ ownerId: user.id })
      .eq('id', business.id);

    console.log('[Register API] Registration successful for:', email);

    // Create session
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      businessName: business.name,
    };

    // Response with cookie
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        businessName: business.name,
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
    return NextResponse.json(
      { success: false, error: 'Error al crear la cuenta. Por favor intente nuevamente.' },
      { status: 500 }
    );
  }
}
