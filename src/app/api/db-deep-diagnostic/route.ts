// Diagnóstico profundo de conexión a Supabase
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  // Extraer información detallada
  const analyzeUrl = (url: string, name: string) => {
    if (!url) return { name, error: 'No configurada' };

    try {
      const parsed = new URL(url);
      return {
        name,
        protocol: parsed.protocol,
        username: parsed.username,
        passwordLength: parsed.password?.length || 0,
        passwordHasDollar: parsed.password?.includes('$') || false,
        passwordHasEncodedDollar: parsed.password?.includes('%24') || false,
        host: parsed.hostname,
        port: parsed.port,
        database: parsed.pathname.replace('/', ''),
      };
    } catch (e) {
      return { name, error: 'URL inválida', details: String(e) };
    }
  };

  const dbAnalysis = analyzeUrl(databaseUrl, 'DATABASE_URL');
  const directAnalysis = analyzeUrl(directUrl, 'DIRECT_URL');

  // Verificar si el proyecto de Supabase existe
  const projectId = 'qsymkskyiaemvynumfal';

  // Crear URL de prueba con contraseña conocida
  const expectedUrl = `postgresql://postgres.${projectId}:MinimenuIA159%24@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  // Comparar
  const comparison = {
    currentLength: databaseUrl.length,
    expectedLength: expectedUrl.length,
    lengthsMatch: databaseUrl.length === expectedUrl.length,
    exactMatch: databaseUrl === expectedUrl,
    charDiff: databaseUrl.length - expectedUrl.length,
  };

  // Detectar problemas
  const issues: string[] = [];

  if (comparison.charDiff !== 0) {
    issues.push(`Las longitudes no coinciden. Diferencia: ${comparison.charDiff} caracteres`);
  }

  if (!comparison.exactMatch) {
    // Encontrar dónde difieren
    for (let i = 0; i < Math.max(databaseUrl.length, expectedUrl.length); i++) {
      if (databaseUrl[i] !== expectedUrl[i]) {
        issues.push(`Diferencia en posición ${i}: actual='${databaseUrl[i] || 'FIN'}' vs esperado='${expectedUrl[i] || 'FIN'}'`);
        if (issues.length > 5) break;
      }
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    currentCredentials: dbAnalysis,
    directCredentials: directAnalysis,
    comparison,
    issues: issues.length > 0 ? issues : ['Las URLs coinciden exactamente'],
    exactMatch: comparison.exactMatch,
    possibleCauses: comparison.exactMatch ? [
      'La contraseña en Supabase puede ser diferente a MinimenuIA159$',
      'El proyecto de Supabase puede estar pausado o eliminado',
      'El usuario de base de datos puede haber sido cambiado',
      'Puede haber restricciones de IP en Supabase',
    ] : [
      'Las URLs no coinciden exactamente',
      'Verifica que copiaste el valor correcto en Vercel',
    ],
    nextSteps: [
      '1. Ve a Supabase Dashboard (https://supabase.com)',
      '2. Selecciona el proyecto qsymkskyiaemvynumfal',
      '3. Ve a Settings > Database',
      '4. Verifica la contraseña actual de la base de datos',
      '5. Si es diferente, actualiza DATABASE_URL y DIRECT_URL en Vercel',
    ],
  });
}
