// =============================================
// MINIMENU - Auth Register API (con pg directo)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  businessName: string;
  phone: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[Register API] Starting registration process...');

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
    const body: RegisterRequest = await request.json();
    const { email, password, name, businessName, phone } = body;

    console.log('[Register API] Received data:', { email, name, businessName });

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

    const client = await pool.connect();

    try {
      // Check if user already exists
      const existingUserResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUserResult.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Este email ya está registrado' },
          { status: 400 }
        );
      }

      // Get default plan
      const planResult = await client.query(
        "SELECT id FROM plans WHERE slug = 'gratis' LIMIT 1"
      );

      let planId: string;
      if (planResult.rows.length === 0) {
        // Create default plan
        const createPlanResult = await client.query(
          `INSERT INTO plans (name, slug, description, price, features, "isActive", "isPublic")
           VALUES ('Gratis', 'gratis', 'Plan gratuito', 0, '50 productos', true, true)
           RETURNING id`
        );
        planId = createPlanResult.rows[0].id;
      } else {
        planId = planResult.rows[0].id;
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

      const slugCheckResult = await client.query(
        'SELECT id FROM businesses WHERE slug = $1',
        [slug]
      );

      while (slugCheckResult.rows.length > 0) {
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
        const recheck = await client.query('SELECT id FROM businesses WHERE slug = $1', [slug]);
        if (recheck.rows.length === 0) break;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate UUIDs
      const businessIdResult = await client.query('SELECT gen_random_uuid() as id');
      const businessId = businessIdResult.rows[0].id;

      const userIdResult = await client.query('SELECT gen_random_uuid() as id');
      const userId = userIdResult.rows[0].id;

      // Create business
      await client.query(
        `INSERT INTO businesses (id, name, slug, "ownerId", "ownerName", "ownerEmail", phone, "planId", status, "primaryColor", "secondaryColor")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', '#8b5cf6', '#ffffff')`,
        [businessId, businessName, slug, userId, name, email.toLowerCase(), phone || '', planId]
      );

      // Create user
      await client.query(
        `INSERT INTO users (id, email, name, password, role, "businessId")
         VALUES ($1, $2, $3, $4, 'BUSINESS_ADMIN', $5)`,
        [userId, email.toLowerCase(), name, hashedPassword, businessId]
      );

      console.log('[Register API] Registration successful for:', email);

      // Create session data
      const sessionData = {
        userId: userId,
        email: email.toLowerCase(),
        name: name,
        role: 'BUSINESS_ADMIN',
        businessId: businessId,
        businessName: businessName,
      };

      const response = NextResponse.json({
        success: true,
        data: {
          id: userId,
          email: email.toLowerCase(),
          name: name,
          role: 'BUSINESS_ADMIN',
          businessId: businessId,
          businessName: businessName,
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

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Register API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear la cuenta',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
