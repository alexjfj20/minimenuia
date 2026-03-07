// Verificar estado de la base de datos con pg directo
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({ success: false, error: 'DATABASE_URL no configurada' }, { status: 500 });
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();

    // Verificar tablas existentes
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Contar registros en cada tabla
    const tables = tablesResult.rows.map((row: { table_name: string }) => row.table_name);
    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        counts[table] = parseInt(countResult.rows[0].count);
      } catch {
        counts[table] = 0;
      }
    }

    client.release();

    return NextResponse.json({
      success: true,
      message: '✅ Base de datos conectada y funcionando',
      tables: tables,
      counts: counts,
      totalTables: tables.length,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
