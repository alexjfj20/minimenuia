// Test final con región correcta aws-1-us-east-2
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const password = 'Azul1340134';
  const projectId = 'qsymkskyiaemvynumfal';

  // URL con región correcta aws-1-us-east-2
  const poolerUrl = `postgresql://postgres.${projectId}:${password}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;

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
      message: '✅ CONEXIÓN EXITOSA!',
      data: result.rows[0],
      correctUrls: {
        DATABASE_URL: `postgresql://postgres.${projectId}:${password}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`,
        DIRECT_URL: `postgresql://postgres.${projectId}:${password}@db.${projectId}.supabase.co:5432/postgres`,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      testedUrl: poolerUrl.replace(password, '****'),
      instructions: [
        'Ve a Supabase Dashboard > Settings > Database',
        'Haz clic en "Reset database password"',
        'Establece una nueva contraseña simple (solo letras y números)',
        'Copia el connection string que aparece',
        'Actualiza las variables en Vercel',
      ],
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
