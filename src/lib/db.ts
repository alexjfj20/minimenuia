// =============================================
// MINIMENU - Prisma Database Client
// =============================================
// Optimizado para Vercel/Serverless con Supabase Pooler

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('[Prisma] Error: DATABASE_URL is not defined in environment variables.');
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

// En desarrollo, usar una sola instancia para evitar múltiples conexiones
// En producción (serverless), crear nueva instancia por cada invocación
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Función para verificar conexión
export async function checkDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
  details?: unknown;
}> {
  try {
    // Intentar una consulta simple
    await db.$queryRaw`SELECT 1 as test`;
    
    return {
      success: true,
      message: 'Database connection successful',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error?.constructor?.name || 'Unknown';
    
    return {
      success: false,
      message: 'Database connection failed',
      error: errorMessage,
      details: {
        type: errorType,
        // No exponer información sensible
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    };
  }
}

// Función para desconectar limpiamente (útil en serverless)
export async function disconnectDatabase(): Promise<void> {
  try {
    await db.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}
