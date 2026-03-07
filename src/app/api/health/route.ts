// =============================================
// MINIMENU - Health Check API
// =============================================
// Endpoint simple para verificar el estado de la aplicación

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  // Valores correctos esperados
  const correctDatabaseUrl = 'postgresql://postgres.qsymkskyiaemvynumfal:MinimenuIA159%24@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
  const correctDirectUrl = 'postgresql://postgres.qsymkskyiaemvynumfal:MinimenuIA159%24@db.qsymkskyiaemvynumfal.supabase.co:5432/postgres';

  // Función para enmascarar URL (ocultar contraseña)
  const maskUrl = (url: string): string => {
    if (!url) return 'NO CONFIGURADO';
    try {
      const parsed = new URL(url);
      const maskedPassword = parsed.password ? '****' + parsed.password.slice(-2) : 'sin-password';
      return `${parsed.protocol}//${parsed.username}:${maskedPassword}@${parsed.host}${parsed.pathname}`;
    } catch {
      return 'URL INVÁLIDA';
    }
  };

  // Extraer información de las URLs
  const parseUrlInfo = (url: string) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return {
        user: parsed.username,
        host: parsed.hostname,
        port: parsed.port,
        database: parsed.pathname.replace('/', ''),
      };
    } catch {
      return null;
    }
  };

  const dbInfo = parseUrlInfo(databaseUrl);
  const directInfo = parseUrlInfo(directUrl);

  // Verificar si las credenciales son correctas
  const isDatabaseUrlCorrect = databaseUrl === correctDatabaseUrl;
  const isDirectUrlCorrect = directUrl === correctDirectUrl;
  const allCorrect = isDatabaseUrlCorrect && isDirectUrlCorrect;

  // Generar lista de problemas
  const issues: string[] = [];

  if (!databaseUrl) {
    issues.push('DATABASE_URL no está configurada');
  } else if (!isDatabaseUrlCorrect) {
    if (dbInfo?.host !== 'aws-0-us-east-1.pooler.supabase.com') {
      issues.push(`DATABASE_URL tiene host incorrecto: ${dbInfo?.host} (debe ser: aws-0-us-east-1.pooler.supabase.com)`);
    }
    if (dbInfo?.port !== '6543') {
      issues.push(`DATABASE_URL tiene puerto incorrecto: ${dbInfo?.port} (debe ser: 6543)`);
    }
    if (dbInfo?.user !== 'postgres.qsymkskyiaemvynumfal') {
      issues.push(`DATABASE_URL tiene usuario incorrecto: ${dbInfo?.user}`);
    }
  }

  if (!directUrl) {
    issues.push('DIRECT_URL no está configurada');
  } else if (!isDirectUrlCorrect) {
    if (directInfo?.host !== 'db.qsymkskyiaemvynumfal.supabase.co') {
      issues.push(`DIRECT_URL tiene host incorrecto: ${directInfo?.host} (debe ser: db.qsymkskyiaemvynumfal.supabase.co)`);
    }
    if (directInfo?.port !== '5432') {
      issues.push(`DIRECT_URL tiene puerto incorrecto: ${directInfo?.port} (debe ser: 5432)`);
    }
  }

  return NextResponse.json({
    status: allCorrect ? 'OK' : 'ERROR',
    message: allCorrect
      ? '✅ Las credenciales están configuradas correctamente'
      : '❌ Las credenciales NO son correctas',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    credentials: {
      databaseUrl: maskUrl(databaseUrl),
      directUrl: maskUrl(directUrl),
    },
    expected: {
      databaseUrl: maskUrl(correctDatabaseUrl),
      directUrl: maskUrl(correctDirectUrl),
    },
    comparison: {
      databaseUrlMatch: isDatabaseUrlCorrect,
      directUrlMatch: isDirectUrlCorrect,
    },
    issues: issues.length > 0 ? issues : undefined,
    fixInstructions: allCorrect ? undefined : {
      step1: 'Ve a Vercel Dashboard > Tu Proyecto > Settings > Environment Variables',
      step2: 'Elimina las variables DATABASE_URL y DIRECT_URL existentes',
      step3: 'Crea DATABASE_URL con este valor EXACTO:',
      databaseUrlValue: correctDatabaseUrl,
      step4: 'Crea DIRECT_URL con este valor EXACTO:',
      directUrlValue: correctDirectUrl,
      step5: 'Guarda y haz Redeploy del proyecto',
    },
  });
}
