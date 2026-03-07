// =============================================
// MINIMENU - Database Diagnostic API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { db, checkDatabaseConnection } from '@/lib/db';

interface DiagnosticResult {
  step: string;
  status: 'ok' | 'error' | 'warning' | 'info';
  message: string;
  details?: unknown;
}

export async function GET(): Promise<NextResponse> {
  console.log('[DB Diagnostic] Starting comprehensive database diagnostic...');
  const results: DiagnosticResult[] = [];
  const startTime = Date.now();

  // ==========================================
  // PASO 1: Verificar Variables de Entorno
  // ==========================================
  console.log('[DB Diagnostic] Step 1: Checking environment variables...');
  
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const nodeEnv = process.env.NODE_ENV;

  // Función para parsear URL de forma segura
  const parseDbUrl = (url: string | undefined): {
    hasUrl: boolean;
    protocol: string | null;
    host: string | null;
    port: string | null;
    database: string | null;
  } => {
    if (!url) {
      return { hasUrl: false, protocol: null, host: null, port: null, database: null };
    }
    try {
      const parsed = new URL(url);
      return {
        hasUrl: true,
        protocol: parsed.protocol,
        host: parsed.hostname,
        port: parsed.port,
        database: parsed.pathname.replace('/', ''),
      };
    } catch {
      return { hasUrl: false, protocol: null, host: null, port: null, database: null };
    }
  };

  const dbUrlInfo = parseDbUrl(databaseUrl);
  const directUrlInfo = parseDbUrl(directUrl);

  results.push({
    step: 'Environment Variables',
    status: databaseUrl ? 'ok' : 'error',
    message: databaseUrl 
      ? `DATABASE_URL configured (port: ${dbUrlInfo.port})` 
      : 'DATABASE_URL is NOT configured!',
    details: {
      nodeEnv,
      databaseUrl: {
        exists: !!databaseUrl,
        protocol: dbUrlInfo.protocol,
        host: dbUrlInfo.host,
        port: dbUrlInfo.port,
        database: dbUrlInfo.database,
        // Verificar si es pooler
        isPooler: dbUrlInfo.host?.includes('pooler') || false,
        correctPort: dbUrlInfo.port === '6543',
      },
      directUrl: {
        exists: !!directUrl,
        protocol: directUrlInfo.protocol,
        host: directUrlInfo.host,
        port: directUrlInfo.port,
        database: directUrlInfo.database,
      },
    }
  });

  // Si no hay DATABASE_URL, no continuar
  if (!databaseUrl) {
    return NextResponse.json({
      success: false,
      message: 'DATABASE_URL is not configured. Please set it in Vercel Environment Variables.',
      results,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }

  // ==========================================
  // PASO 2: Verificar Conexión a la Base de Datos
  // ==========================================
  console.log('[DB Diagnostic] Step 2: Testing database connection...');

  const connectionTest = await checkDatabaseConnection();
  
  results.push({
    step: 'Database Connection',
    status: connectionTest.success ? 'ok' : 'error',
    message: connectionTest.message,
    details: connectionTest.details,
  });

  if (!connectionTest.success) {
    // Si falla la conexión, intentar dar información útil
    results.push({
      step: 'Troubleshooting',
      status: 'info',
      message: 'Connection failed. Common causes:',
      details: {
        cause1: 'DATABASE_URL uses wrong port (should be 6543 for pooler)',
        cause2: 'Password not URL-encoded ($ should be %24)',
        cause3: 'IP not whitelisted in Supabase',
        cause4: 'Database tables not created yet',
        suggestion: 'Run the SQL script in Supabase SQL Editor to create tables',
      }
    });

    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: connectionTest.error,
      results,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }

  // ==========================================
  // PASO 3: Verificar si las tablas existen
  // ==========================================
  console.log('[DB Diagnostic] Step 3: Checking if tables exist...');

  const tablesToCheck = [
    { name: 'users', model: 'user' },
    { name: 'plans', model: 'plan' },
    { name: 'businesses', model: 'business' },
    { name: 'orders', model: 'order' },
    { name: 'products', model: 'product' },
    { name: 'categories', model: 'category' },
  ];

  for (const table of tablesToCheck) {
    try {
      // Usar $queryRaw para verificar si la tabla existe
      const tableCheck = await db.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table.name}
        ) as exists
      `;

      const exists = tableCheck[0]?.exists ?? false;

      if (exists) {
        // Contar registros
        let count = -1;
        try {
          // @ts-expect-error - Dynamic model access
          count = await db[table.model].count();
        } catch {
          count = 0;
        }

        results.push({
          step: `Table: ${table.name}`,
          status: 'ok',
          message: `Table exists with ${count} records`,
          details: { exists, count }
        });
      } else {
        results.push({
          step: `Table: ${table.name}`,
          status: 'error',
          message: `Table does NOT exist! Run the SQL init script.`,
          details: { exists }
        });
      }
    } catch (tableError) {
      results.push({
        step: `Table: ${table.name}`,
        status: 'error',
        message: 'Error checking table',
        details: tableError instanceof Error ? tableError.message : String(tableError)
      });
    }
  }

  // ==========================================
  // PASO 4: Verificar Plan Gratuito
  // ==========================================
  console.log('[DB Diagnostic] Step 4: Checking default plan...');

  try {
    const freePlan = await db.plan.findFirst({
      where: { slug: 'gratis' }
    });

    results.push({
      step: 'Default Plan (gratis)',
      status: freePlan ? 'ok' : 'warning',
      message: freePlan 
        ? `Free plan exists (id: ${freePlan.id})` 
        : 'Free plan does NOT exist. Run POST /api/db/init to create it.',
      details: freePlan ? { id: freePlan.id, name: freePlan.name } : null
    });
  } catch (planError) {
    results.push({
      step: 'Default Plan (gratis)',
      status: 'error',
      message: 'Could not check for default plan (table may not exist)',
      details: planError instanceof Error ? planError.message : String(planError)
    });
  }

  // ==========================================
  // PASO 5: Verificar Super Admin
  // ==========================================
  console.log('[DB Diagnostic] Step 5: Checking super admin...');

  try {
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    results.push({
      step: 'Super Admin',
      status: superAdmin ? 'ok' : 'warning',
      message: superAdmin 
        ? `Super admin exists (email: ${superAdmin.email})` 
        : 'Super admin does NOT exist',
      details: superAdmin ? { id: superAdmin.id, email: superAdmin.email } : null
    });
  } catch (adminError) {
    results.push({
      step: 'Super Admin',
      status: 'error',
      message: 'Could not check for super admin (table may not exist)',
      details: adminError instanceof Error ? adminError.message : String(adminError)
    });
  }

  // ==========================================
  // Resultado Final
  // ==========================================
  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  console.log('[DB Diagnostic] Completed in', Date.now() - startTime, 'ms');

  return NextResponse.json({
    success: !hasErrors,
    message: hasErrors 
      ? 'Database diagnostic found errors' 
      : hasWarnings 
        ? 'Database connected but some items need attention'
        : 'All checks passed!',
    results,
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    nextSteps: hasErrors 
      ? '1. Verify DATABASE_URL in Vercel (port 6543 for pooler)\n2. Run SQL init script in Supabase\n3. Redeploy in Vercel'
      : 'Database is ready!',
  });
}

// POST para inicializar datos
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[DB Init] Starting initialization...');
  const results: DiagnosticResult[] = [];

  try {
    // Verificar conexión primero
    const connectionTest = await checkDatabaseConnection();
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Cannot initialize.',
        error: connectionTest.error,
        results,
      }, { status: 500 });
    }

    // Crear plan gratuito si no existe
    try {
      const existingPlan = await db.plan.findFirst({
        where: { slug: 'gratis' },
      });

      if (!existingPlan) {
        const newPlan = await db.plan.create({
          data: {
            name: 'Gratis',
            slug: 'gratis',
            description: 'Plan gratuito para comenzar',
            price: 0,
            currency: 'COP',
            period: 'MONTHLY',
            features: 'Hasta 50 productos,1 usuario,Soporte por email',
            isActive: true,
            isPublic: true,
            isPopular: false,
            order: 0,
            icon: 'zap',
            color: '#8b5cf6',
            maxUsers: 1,
            maxProducts: 50,
            maxCategories: 5,
          },
        });
        
        results.push({
          step: 'Create Free Plan',
          status: 'ok',
          message: 'Free plan created successfully',
          details: { id: newPlan.id }
        });
      } else {
        results.push({
          step: 'Create Free Plan',
          status: 'ok',
          message: 'Free plan already exists',
          details: { id: existingPlan.id }
        });
      }
    } catch (planError) {
      results.push({
        step: 'Create Free Plan',
        status: 'error',
        message: 'Failed to create free plan',
        details: planError instanceof Error ? planError.message : String(planError)
      });
    }

    // Crear planes adicionales
    const additionalPlans = [
      { name: 'Básico', slug: 'basico', price: 29000, color: '#3b82f6', maxUsers: 3, maxProducts: 200, maxCategories: 10 },
      { name: 'Pro', slug: 'pro', price: 59000, color: '#8b5cf6', maxUsers: 10, maxProducts: 999999, maxCategories: 999 },
    ];

    for (const planData of additionalPlans) {
      try {
        const existing = await db.plan.findFirst({ where: { slug: planData.slug } });
        
        if (!existing) {
          await db.plan.create({
            data: {
              ...planData,
              description: `Plan ${planData.name}`,
              currency: 'COP',
              period: 'MONTHLY',
              features: 'Features here',
              isActive: true,
              isPublic: true,
              isPopular: false,
              order: 0,
              icon: 'star',
            }
          });
          
          results.push({
            step: `Create ${planData.name} Plan`,
            status: 'ok',
            message: `${planData.name} plan created`
          });
        } else {
          results.push({
            step: `Create ${planData.name} Plan`,
            status: 'ok',
            message: `${planData.name} plan already exists`
          });
        }
      } catch (err) {
        results.push({
          step: `Create ${planData.name} Plan`,
          status: 'warning',
          message: `Could not create ${planData.name} plan`,
          details: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Initialization completed',
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Initialization failed',
      error: error instanceof Error ? error.message : String(error),
      results
    }, { status: 500 });
  }
}
