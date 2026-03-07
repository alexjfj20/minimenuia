// =============================================
// MINIMENU - Business Profile API
// =============================================
// Obtiene el perfil del negocio desde la base de datos
// usando el businessId del usuario autenticado

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

// ============================================================================
// INTERFACES
// ============================================================================

interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  businessId: string | null;
  businessName: string | null;
}

interface BusinessProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  slug: string;
  status: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  updatedAt: string;
}

// ============================================================================
// GET - Obtener perfil del negocio del usuario autenticado
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  // Obtener businessId de la sesión
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  let session: SessionData;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Sesión inválida' },
      { status: 401 }
    );
  }

  const businessId = session.businessId;

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'Usuario sin negocio asociado' },
      { status: 400 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();

    try {
      // Obtener el negocio desde la base de datos
      const result = await client.query(
        `SELECT id, name, slug, phone, address, "primaryColor", "secondaryColor", 
                logo, status, "ownerId", "ownerName", "ownerEmail", "updatedAt"
         FROM businesses 
         WHERE id = $1`,
        [businessId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Negocio no encontrado' },
          { status: 404 }
        );
      }

      const row = result.rows[0];
      const profile: BusinessProfile = {
        id: row.id,
        name: row.name || '',
        phone: row.phone || '',
        address: row.address || '',
        primaryColor: row.primaryColor || '#8b5cf6',
        secondaryColor: row.secondaryColor || '#ffffff',
        logo: row.logo || null,
        slug: row.slug || '',
        status: row.status || 'ACTIVE',
        ownerId: row.ownerId || '',
        ownerName: row.ownerName || '',
        ownerEmail: row.ownerEmail || '',
        updatedAt: row.updatedAt || new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: profile,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Business Profile API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el perfil' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// ============================================================================
// PUT - Actualizar perfil del negocio
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  // Obtener businessId de la sesión
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  let session: SessionData;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Sesión inválida' },
      { status: 401 }
    );
  }

  const businessId = session.businessId;

  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'Usuario sin negocio asociado' },
      { status: 400 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const body = await request.json();
    const { name, phone, address, primaryColor, secondaryColor, logo } = body;

    const client = await pool.connect();

    try {
      // Construir query de actualización
      const updates: string[] = [];
      const values: (string | null)[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex}`);
        values.push(phone);
        paramIndex++;
      }
      if (address !== undefined) {
        updates.push(`address = $${paramIndex}`);
        values.push(address);
        paramIndex++;
      }
      if (primaryColor !== undefined) {
        updates.push(`"primaryColor" = $${paramIndex}`);
        values.push(primaryColor);
        paramIndex++;
      }
      if (secondaryColor !== undefined) {
        updates.push(`"secondaryColor" = $${paramIndex}`);
        values.push(secondaryColor);
        paramIndex++;
      }
      if (logo !== undefined) {
        updates.push(`logo = $${paramIndex}`);
        values.push(logo);
        paramIndex++;
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No hay campos para actualizar' },
          { status: 400 }
        );
      }

      // Agregar updatedAt
      updates.push(`"updatedAt" = NOW()`);

      // Agregar businessId como último parámetro
      values.push(businessId);

      const query = `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      
      await client.query(query, values);

      // Obtener el perfil actualizado
      const result = await client.query(
        `SELECT id, name, slug, phone, address, "primaryColor", "secondaryColor", 
                logo, status, "ownerId", "ownerName", "ownerEmail", "updatedAt"
         FROM businesses 
         WHERE id = $1`,
        [businessId]
      );

      const row = result.rows[0];
      const profile: BusinessProfile = {
        id: row.id,
        name: row.name || '',
        phone: row.phone || '',
        address: row.address || '',
        primaryColor: row.primaryColor || '#8b5cf6',
        secondaryColor: row.secondaryColor || '#ffffff',
        logo: row.logo || null,
        slug: row.slug || '',
        status: row.status || 'ACTIVE',
        ownerId: row.ownerId || '',
        ownerName: row.ownerName || '',
        ownerEmail: row.ownerEmail || '',
        updatedAt: row.updatedAt || new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: profile,
        message: 'Perfil actualizado correctamente',
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Business Profile API] Error updating:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
