// Test múltiples variaciones de conexión a Supabase
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

  // Diferentes variaciones de URL para probar
  const variations = [
    {
      name: 'Pooler con usuario completo (postgres.PROJECT_ID)',
      url: `postgresql://postgres.${projectId}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    },
    {
      name: 'Pooler con usuario simple (postgres)',
      url: `postgresql://postgres:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    },
    {
      name: 'Direct con usuario completo',
      url: `postgresql://postgres.${projectId}:${password}@db.${projectId}.supabase.co:5432/postgres`,
    },
    {
      name: 'Direct con usuario simple',
      url: `postgresql://postgres:${password}@db.${projectId}.supabase.co:5432/postgres`,
    },
    {
      name: 'Pooler región alternativa (aws-1-us-east-2)',
      url: `postgresql://postgres.${projectId}:${password}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`,
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

  // También mostrar la URL configurada en Vercel
  const vercelUrl = process.env.DATABASE_URL || 'No configurada';

  // Encontrar cuáles funcionaron
  const workingConnections = results.filter(r => r.success);

  return NextResponse.json({
    summary: {
      totalTests: results.length,
      successful: workingConnections.length,
      failed: results.length - workingConnections.length,
    },
    vercelConfig: {
      DATABASE_URL: vercelUrl.replace(password, '****').replace(/:[^:@]+@/g, ':****@'),
    },
    results,
    workingConnection: workingConnections.length > 0 ? workingConnections[0] : null,
    nextSteps: workingConnections.length > 0
      ? [`Usa esta URL en Vercel: ${workingConnections[0].url}`]
      : [
          'Ninguna variación funcionó',
          'Ve a Supabase Dashboard > Settings > Database',
          'Copia el EXACTO connection string que muestra Supabase',
          'Verifica que la región sea correcta (aws-0-us-east-1)',
          'Intenta resetear la contraseña de la base de datos',
        ],
  });
}
