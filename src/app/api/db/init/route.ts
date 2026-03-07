// =============================================
// MINIMENU - Database Diagnostic API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface DiagnosticResult {
  step: string;
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: unknown;
}

export async function GET(): Promise<NextResponse> {
  const results: DiagnosticResult[] = [];
  let overallSuccess = true;

  // 1. Check environment variables
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const nodeEnv = process.env.NODE_ENV;

  results.push({
    step: 'Environment',
    status: databaseUrl ? 'ok' : 'error',
    message: databaseUrl ? 'DATABASE_URL is set' : 'DATABASE_URL is NOT set',
    details: {
      hasDatabaseUrl: !!databaseUrl,
      hasDirectUrl: !!directUrl,
      nodeEnv,
      databaseUrlPrefix: databaseUrl ? databaseUrl.substring(0, 30) + '...' : null,
      directUrlPrefix: directUrl ? directUrl.substring(0, 30) + '...' : null,
    }
  });

  if (!databaseUrl) {
    overallSuccess = false;
    results.push({
      step: 'Connection Test',
      status: 'error',
      message: 'Cannot test connection without DATABASE_URL'
    });
    
    return NextResponse.json({
      success: false,
      message: 'Environment variables not configured',
      results
    }, { status: 500 });
  }

  // 2. Test database connection
  try {
    console.log('[DB Diagnostic] Testing connection...');
    await db.$queryRaw`SELECT 1 as test`;
    
    results.push({
      step: 'Connection Test',
      status: 'ok',
      message: 'Database connection successful'
    });
  } catch (connError) {
    overallSuccess = false;
    const errorMsg = connError instanceof Error ? connError.message : String(connError);
    
    results.push({
      step: 'Connection Test',
      status: 'error',
      message: 'Database connection failed',
      details: {
        error: errorMsg,
        errorType: connError?.constructor?.name || 'Unknown'
      }
    });

    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      results
    }, { status: 500 });
  }

  // 3. Check if tables exist
  const tables = ['users', 'plans', 'businesses', 'orders', 'products', 'categories'];
  
  for (const table of tables) {
    try {
      // Try to count records in each table
      let count = -1;
      
      if (table === 'users') {
        count = await db.user.count();
      } else if (table === 'plans') {
        count = await db.plan.count();
      } else if (table === 'businesses') {
        count = await db.business.count();
      } else if (table === 'orders') {
        count = await db.order.count();
      } else if (table === 'products') {
        count = await db.product.count();
      } else if (table === 'categories') {
        count = await db.category.count();
      }

      results.push({
        step: `Table: ${table}`,
        status: 'ok',
        message: `Table exists with ${count} records`,
        details: { count }
      });
    } catch (tableError) {
      overallSuccess = false;
      const errorMsg = tableError instanceof Error ? tableError.message : String(tableError);
      
      results.push({
        step: `Table: ${table}`,
        status: 'error',
        message: `Table may not exist or has schema issues`,
        details: {
          error: errorMsg,
          errorType: tableError?.constructor?.name || 'Unknown'
        }
      });
    }
  }

  // 4. Check for default plan
  try {
    const freePlan = await db.plan.findFirst({
      where: { slug: 'gratis' }
    });

    results.push({
      step: 'Default Plan',
      status: freePlan ? 'ok' : 'warning',
      message: freePlan ? 'Free plan exists' : 'Free plan does NOT exist - run init first',
      details: freePlan ? { id: freePlan.id, name: freePlan.name } : null
    });
  } catch (planError) {
    results.push({
      step: 'Default Plan',
      status: 'error',
      message: 'Could not check for default plan',
      details: planError instanceof Error ? planError.message : String(planError)
    });
  }

  // 5. Check for super admin
  try {
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    results.push({
      step: 'Super Admin',
      status: superAdmin ? 'ok' : 'warning',
      message: superAdmin ? 'Super admin exists' : 'Super admin does NOT exist',
      details: superAdmin ? { id: superAdmin.id, email: superAdmin.email } : null
    });
  } catch (adminError) {
    results.push({
      step: 'Super Admin',
      status: 'error',
      message: 'Could not check for super admin',
      details: adminError instanceof Error ? adminError.message : String(adminError)
    });
  }

  return NextResponse.json({
    success: overallSuccess,
    message: overallSuccess ? 'All checks passed' : 'Some checks failed',
    results,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const results: DiagnosticResult[] = [];

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'init';

    if (action === 'init') {
      // Create default plan if not exists
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
            step: 'Create Plan',
            status: 'ok',
            message: 'Free plan created successfully',
            details: { id: newPlan.id }
          });
        } else {
          results.push({
            step: 'Create Plan',
            status: 'ok',
            message: 'Free plan already exists',
            details: { id: existingPlan.id }
          });
        }
      } catch (planError) {
        results.push({
          step: 'Create Plan',
          status: 'error',
          message: 'Failed to create free plan',
          details: planError instanceof Error ? planError.message : String(planError)
        });
      }

      // Create basic and pro plans
      const plansToCreate = [
        {
          name: 'Básico',
          slug: 'basico',
          description: 'Plan básico para pequeños negocios',
          price: 29000,
          features: 'Hasta 200 productos,3 usuarios,Soporte prioritario',
          color: '#3b82f6',
          maxUsers: 3,
          maxProducts: 200,
          maxCategories: 10,
        },
        {
          name: 'Pro',
          slug: 'pro',
          description: 'Plan profesional para negocios en crecimiento',
          price: 59000,
          features: 'Productos ilimitados,10 usuarios,Soporte 24/7',
          color: '#8b5cf6',
          maxUsers: 10,
          maxProducts: 999999,
          maxCategories: 999,
        }
      ];

      for (const planData of plansToCreate) {
        try {
          const existing = await db.plan.findFirst({
            where: { slug: planData.slug }
          });

          if (!existing) {
            await db.plan.create({
              data: {
                ...planData,
                currency: 'COP',
                period: 'MONTHLY',
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
      results,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
