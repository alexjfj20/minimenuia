// Test directo de conexión a base de datos
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL || '';

  // Crear conexión directa con pg (sin Prisma)
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db, current_user as user');
    client.release();

    return NextResponse.json({
      success: true,
      message: '✅ Conexión exitosa a la base de datos',
      data: result.rows[0],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      diagnosis: {
        possibleCauses: [
          'El proyecto Supabase está pausado - ve a Supabase Dashboard y haz clic en "Restore"',
          'La contraseña es incorrecta - verifica en Supabase Settings > Database',
          'La región es incorrecta - verifica que sea aws-0-us-east-1',
          'IP no autorizada - ve a Supabase Settings > Database > Connection Pooling',
        ],
        solution: [
          '1. Ve a https://supabase.com/dashboard/project/qsymkskyiaemvynumfal/settings/database',
          '2. Verifica que el proyecto esté activo',
          '3. Haz clic en "Reset database password" si es necesario',
          '4. Copia el nuevo connection string',
          '5. Actualiza las variables en Vercel',
          '6. Haz REDeploy en Vercel (importante)',
        ],
      },
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
