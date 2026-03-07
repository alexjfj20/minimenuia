// Test conexión con región correcta: aws-1-us-east-2
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

interface TestResult {
  name: string;
  url: string;
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function GET(): Promise<NextResponse> {
  const password = 'Azul1340134';
  const projectId = 'qsymkskyiaemvynumfal';

  // La región correcta es aws-1-us-east-2 según el test anterior
  const variations = [
    {
      name: 'Pooler aws-1-us-east-2 con usuario completo',
      url: `postgresql://postgres.${projectId}:${password}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`,
    },
    {
      name: 'Direct aws-1-us-east-2',
      url: `postgresql://postgres.${projectId}:${password}@db.${projectId}.supabase.co:5432/postgres`,
    },
  ];

  const results: TestResult[] = [];

  for (const variation of variations) {
    const pool = new Pool({
      connectionString: variation.url,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await pool.connect();
      const result = await client.query('SELECT 1 as test');
      client.release();

      results.push({
        name: variation.name,
        url: variation.url.replace(password, '****'),
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        name: variation.name,
        url: variation.url.replace(password, '****'),
        success: false,
        error: errorMessage,
      });
    } finally {
      await pool.end();
    }
  }

  // URLs correctas para la región aws-1-us-east-2
  const correctPoolerUrl = `postgresql://postgres.${projectId}:TU_CONTRASEÑA@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;
  const correctDirectUrl = `postgresql://postgres.${projectId}:TU_CONTRASEÑA@db.${projectId}.supabase.co:5432/postgres`;

  return NextResponse.json({
    discovery: {
      region: 'aws-1-us-east-2',
      message: 'Tu proyecto está en la región aws-1-us-east-2, NO en aws-0-us-east-1',
    },
    results,
    correctUrls: {
      DATABASE_URL: correctPoolerUrl.replace('TU_CONTRASEÑA', '****'),
      DIRECT_URL: correctDirectUrl.replace('TU_CONTRASEÑA', '****'),
    },
    instructions: [
      '1. Ve a Supabase Dashboard > Settings > Database',
      '2. Busca "Connection string" o "Connection pooling"',
      '3. Verifica que la región sea aws-1-us-east-2',
      '4. Copia la contraseña correcta',
      '5. Actualiza Vercel con:',
      '',
      '   DATABASE_URL=postgresql://postgres.qsymkskyiaemvynumfal:TU_CONTRASEÑA@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
      '',
      '   DIRECT_URL=postgresql://postgres.qsymkskyiaemvynumfal:TU_CONTRASEÑA@db.qsymkskyiaemvynumfal.supabase.co:5432/postgres',
    ],
  });
}
