// =============================================
// MINIMENU - Health Check API
// =============================================
// Endpoint para verificar el estado de la aplicación

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  // Credenciales correctas del proyecto saasmenuia
  const correctDatabaseUrl = 'postgresql://postgres.zobvdpegchzgwntemzou:Azul134013470@aws-1-us-east-2.pooler.supabase.com:6543/postgres';
  const correctDirectUrl = 'postgresql://postgres.zobvdpegchzgwntemzou:Azul134013470@db.zobvdpegchzgwntemzou.supabase.co:5432/postgres';

  // Función para enmascarar URL (ocultar contraseña)
  const maskUrl = (url: string): string => {
    if (!url) return 'NO CONFIGURADO';
    try {
      const parsed = new URL(url);
      const maskedPassword = parsed.password ? '****' + parsed.password.slice(-3) : 'sin-password';
      return `${parsed.protocol}//${parsed.username}:${maskedPassword}@${parsed.host}${parsed.pathname}`;
    } catch {
      return 'URL INVÁLIDA';
    }
  };

  // Verificar si las variables están configuradas correctamente
  const isDatabaseUrlCorrect = databaseUrl === correctDatabaseUrl;
  const isDirectUrlCorrect = directUrl === correctDirectUrl;
  const allCorrect = isDatabaseUrlCorrect && isDirectUrlCorrect;

  return NextResponse.json({
    status: allCorrect ? 'OK' : 'ERROR',
    message: allCorrect
      ? '✅ Todas las variables de entorno están configuradas correctamente'
      : '⚠️ Las variables de entorno no coinciden con las esperadas',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    credentials: {
      databaseUrl: maskUrl(databaseUrl),
      directUrl: maskUrl(directUrl),
    },
    comparison: {
      databaseUrlMatch: isDatabaseUrlCorrect,
      directUrlMatch: isDirectUrlCorrect,
    },
    project: {
      name: 'saasmenuia',
      projectId: 'zobvdpegchzgwntemzou',
      region: 'aws-1-us-east-2',
    },
  });
}
