// =============================================
// MINIMENU - Credentials Verification API
// =============================================
// Este endpoint verifica si las credenciales de Supabase son correctas

import { NextResponse } from 'next/server';

interface CredentialCheck {
  field: string;
  currentValue: string;
  expectedValue: string;
  isCorrect: boolean;
  fix?: string;
}

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  // Valores ESPERADOS (correctos)
  const expectedDatabaseUrl = 'postgresql://postgres.qsymkskyiaemvynumfal:MinimenuIA159%24@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
  const expectedDirectUrl = 'postgresql://postgres.qsymkskyiaemvynumfal:MinimenuIA159%24@db.qsymkskyiaemvynumfal.supabase.co:5432/postgres';

  // Función para enmascarar credenciales
  const maskUrl = (url: string): string => {
    if (!url) return 'NO CONFIGURADO';
    try {
      const parsed = new URL(url);
      // Enmascarar contraseña
      const maskedPassword = parsed.password ? '***' + parsed.password.slice(-2) : 'sin-password';
      return `${parsed.protocol}//${parsed.username}:${maskedPassword}@${parsed.host}${parsed.pathname}`;
    } catch {
      return 'URL INVÁLIDA';
    }
  };

  // Función para extraer información de la URL
  const parseUrl = (url: string) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return {
        user: parsed.username,
        host: parsed.hostname,
        port: parsed.port,
        database: parsed.pathname.replace('/', ''),
        hasPassword: !!parsed.password,
        passwordEncoded: parsed.password?.includes('%24') || parsed.password?.includes('$'),
      };
    } catch {
      return null;
    }
  };

  const checks: CredentialCheck[] = [];

  // Verificar DATABASE_URL
  const dbInfo = parseUrl(databaseUrl);
  const expectedDbInfo = parseUrl(expectedDatabaseUrl);

  checks.push({
    field: 'DATABASE_URL - Host',
    currentValue: dbInfo?.host || 'NO CONFIGURADO',
    expectedValue: expectedDbInfo?.host || '',
    isCorrect: dbInfo?.host === expectedDbInfo?.host,
    fix: dbInfo?.host !== expectedDbInfo?.host 
      ? `Cambia el host a: ${expectedDbInfo?.host}` 
      : undefined,
  });

  checks.push({
    field: 'DATABASE_URL - Puerto',
    currentValue: dbInfo?.port || 'NO CONFIGURADO',
    expectedValue: expectedDbInfo?.port || '',
    isCorrect: dbInfo?.port === expectedDbInfo?.port,
    fix: dbInfo?.port !== expectedDbInfo?.port 
      ? `El puerto debe ser ${expectedDbInfo?.port} para el pooler de Supabase` 
      : undefined,
  });

  checks.push({
    field: 'DATABASE_URL - Usuario',
    currentValue: dbInfo?.user || 'NO CONFIGURADO',
    expectedValue: expectedDbInfo?.user || '',
    isCorrect: dbInfo?.user === expectedDbInfo?.user,
    fix: dbInfo?.user !== expectedDbInfo?.user 
      ? `El usuario debe ser: ${expectedDbInfo?.user}` 
      : undefined,
  });

  // Verificar DIRECT_URL
  const directInfo = parseUrl(directUrl);

  checks.push({
    field: 'DIRECT_URL - Host',
    currentValue: directInfo?.host || 'NO CONFIGURADO',
    expectedValue: 'db.qsymkskyiaemvynumfal.supabase.co',
    isCorrect: directInfo?.host === 'db.qsymkskyiaemvynumfal.supabase.co',
    fix: directInfo?.host !== 'db.qsymkskyiaemvynumfal.supabase.co'
      ? 'Cambia el host a: db.qsymkskyiaemvynumfal.supabase.co'
      : undefined,
  });

  checks.push({
    field: 'DIRECT_URL - Puerto',
    currentValue: directInfo?.port || 'NO CONFIGURADO',
    expectedValue: '5432',
    isCorrect: directInfo?.port === '5432',
    fix: directInfo?.port !== '5432'
      ? 'El puerto debe ser 5432 para conexión directa'
      : undefined,
  });

  // Verificar si las URLs coinciden exactamente
  const databaseUrlCorrect = databaseUrl === expectedDatabaseUrl;
  const directUrlCorrect = directUrl === expectedDirectUrl;

  const allCorrect = databaseUrlCorrect && directUrlCorrect;

  // Generar instrucciones de corrección
  const fixInstructions: string[] = [];
  
  if (!databaseUrlCorrect) {
    fixInstructions.push('1. En Vercel, actualiza DATABASE_URL a:');
    fixInstructions.push(`   ${expectedDatabaseUrl}`);
  }
  
  if (!directUrlCorrect) {
    fixInstructions.push('2. En Vercel, actualiza DIRECT_URL a:');
    fixInstructions.push(`   ${expectedDirectUrl}`);
  }

  if (!allCorrect) {
    fixInstructions.push('');
    fixInstructions.push('Pasos para corregir:');
    fixInstructions.push('1. Ve a Vercel Dashboard > Tu Proyecto > Settings > Environment Variables');
    fixInstructions.push('2. Elimina las variables DATABASE_URL y DIRECT_URL existentes');
    fixInstructions.push('3. Crea nuevas variables con los valores correctos de arriba');
    fixInstructions.push('4. Haz clic en "Save" y luego redeploya el proyecto');
  }

  return NextResponse.json({
    success: allCorrect,
    message: allCorrect 
      ? '✅ Las credenciales están configuradas correctamente' 
      : '❌ Las credenciales NO coinciden con las esperadas',
    checks,
    currentValues: {
      DATABASE_URL: maskUrl(databaseUrl),
      DIRECT_URL: maskUrl(directUrl),
    },
    expectedValues: {
      DATABASE_URL: maskUrl(expectedDatabaseUrl),
      DIRECT_URL: maskUrl(expectedDirectUrl),
    },
    urlsMatch: {
      DATABASE_URL: databaseUrlCorrect,
      DIRECT_URL: directUrlCorrect,
    },
    fixInstructions: allCorrect ? undefined : fixInstructions,
    timestamp: new Date().toISOString(),
  });
}
