// =============================================
// MINIMENU - Prisma Database Client
// =============================================
// Optimizado para Vercel/Serverless con Supabase Pooler

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configuración para Supabase con PgBouncer
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configuración importante para serverless con Supabase
    __internal: {
      engine: {
        // Usar el modo de conexión correcto para Supabase
        connection: {
          pgbouncer: true,
        },
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

// Función para verificar conexión (usando consulta simple sin prepared statement)
export async function checkDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
  details?: unknown;
}> {
  try {
    // Usar $executeRaw en lugar de $queryRaw para evitar prepared statements
    await db.$executeRaw`SELECT 1`;

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
