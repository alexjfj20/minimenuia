// =============================================
// MINIMENU - Health Check API
// =============================================
// Endpoint para verificar el estado de la aplicación

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  // Función para enmascarar URL (ocultar contraseña)
  const maskUrl = (url: string): string => {
    if (!url) return 'NO CONFIGURADO';
    try {
      const parsed = new URL(url);
      const maskedPassword = parsed.password ? '****' : 'sin-password';
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

  // Verificar si las variables están configuradas
  const hasDatabaseUrl = !!databaseUrl && databaseUrl.includes('supabase');
  const hasDirectUrl = !!directUrl && directUrl.includes('supabase');

  return NextResponse.json({
    status: hasDatabaseUrl && hasDirectUrl ? 'CONFIGURADO' : 'PENDIENTE',
    message: hasDatabaseUrl && hasDirectUrl
      ? '✅ Las variables de entorno están configuradas'
      : '⚠️ Configura las variables DATABASE_URL y DIRECT_URL en Vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    credentials: {
      databaseUrl: maskUrl(databaseUrl),
      directUrl: maskUrl(directUrl),
    },
    config: {
      databaseUrl: {
        configured: hasDatabaseUrl,
        host: dbInfo?.host || null,
        port: dbInfo?.port || null,
      },
      directUrl: {
        configured: hasDirectUrl,
        host: directInfo?.host || null,
        port: directInfo?.port || null,
      },
    },
    setupInstructions: !hasDatabaseUrl || !hasDirectUrl ? {
      step1: 'Crea un nuevo proyecto en https://supabase.com',
      step2: 'Ve a Settings > Database',
      step3: 'Copia el Project Reference y establece una contraseña',
      step4: 'Copia los connection strings:',
      DATABASE_URL_format: 'postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres',
      DIRECT_URL_format: 'postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres',
      step5: 'Actualiza las variables en Vercel y haz Redeploy',
    } : undefined,
  });
}
