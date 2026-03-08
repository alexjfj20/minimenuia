// Test de conexión con nuevas credenciales de Supabase
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  // Nuevas credenciales del proyecto saasmenuia
  const projectId = 'zobvdpegchzgwntemzou';
  const password = 'Azul134013470';
  const region = 'aws-1-us-east-2';

  const poolerUrl = `postgresql://postgres.${projectId}:${password}@${region}.pooler.supabase.com:6543/postgres`;
  const directUrl = `postgresql://postgres.${projectId}:${password}@db.${projectId}.supabase.co:5432/postgres`;

  const pool = new Pool({
    connectionString: poolerUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db, current_user as user');
    client.release();

    return NextResponse.json({
      success: true,
      message: '✅ CONEXIÓN EXITOSA A LA BASE DE DATOS!',
      data: result.rows[0],
      credentials: {
        projectId,
        region,
      },
      correctUrls: {
        DATABASE_URL: poolerUrl,
        DIRECT_URL: directUrl,
      },
      supabaseKeys: {
        NEXT_PUBLIC_SUPABASE_URL: `https://${projectId}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYnZkcGVnY2h6Z3dudGVtem91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzI5NTcsImV4cCI6MjA4ODQ0ODk1N30.kQP-042nzTigOAhajyDUBrpjHV1jVn78Voqfk7BpjD0',
      },
      nextSteps: [
        '1. Copia estas URLs y pégalas en Vercel Environment Variables',
        '2. Haz Redeploy en Vercel',
        '3. Visita /api/db/init para crear las tablas',
      ],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      testedUrl: poolerUrl.replace(password, '****'),
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
