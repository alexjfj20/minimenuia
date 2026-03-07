// =============================================
// MINIMENU - Database Initialization API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar secret para autorización
    const body = await request.json().catch(() => ({}));
    const secret = body.secret;

    // En producción, requerir un secret para evitar acceso no autorizado
    if (process.env.NODE_ENV === 'production' && secret !== process.env.INIT_SECRET) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const results: { step: string; status: string; message: string }[] = [];

    // 1. Crear o verificar plan gratuito
    try {
      const existingPlan = await db.plan.findFirst({
        where: { slug: 'gratis' },
      });

      if (!existingPlan) {
        await db.plan.create({
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
        results.push({ step: 'Plan gratuito', status: 'created', message: 'Plan gratuito creado exitosamente' });
      } else {
        results.push({ step: 'Plan gratuito', status: 'exists', message: 'Plan gratuito ya existe' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      results.push({ step: 'Plan gratuito', status: 'error', message: errorMsg });
    }

    // 2. Verificar si el super admin existe
    try {
      const superAdminEmail = 'auditsemseo@gmail.com';
      const existingAdmin = await db.user.findUnique({
        where: { email: superAdminEmail },
      });

      if (!existingAdmin) {
        results.push({ step: 'Super Admin', status: 'not_exists', message: 'Super admin no existe - crear manualmente' });
      } else {
        results.push({ step: 'Super Admin', status: 'exists', message: 'Super admin ya existe' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      results.push({ step: 'Super Admin', status: 'error', message: errorMsg });
    }

    return NextResponse.json({
      success: true,
      message: 'Inicialización completada',
      results,
    });
  } catch (error) {
    console.error('Error en inicialización de BD:', error);
    return NextResponse.json(
      { success: false, error: 'Error en inicialización', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    // Health check de la base de datos
    const results: { table: string; count: number }[] = [];

    try {
      const userCount = await db.user.count();
      results.push({ table: 'users', count: userCount });
    } catch {
      results.push({ table: 'users', count: -1 });
    }

    try {
      const planCount = await db.plan.count();
      results.push({ table: 'plans', count: planCount });
    } catch {
      results.push({ table: 'plans', count: -1 });
    }

    try {
      const businessCount = await db.business.count();
      results.push({ table: 'businesses', count: businessCount });
    } catch {
      results.push({ table: 'businesses', count: -1 });
    }

    try {
      const orderCount = await db.order.count();
      results.push({ table: 'orders', count: orderCount });
    } catch {
      results.push({ table: 'orders', count: -1 });
    }

    const allTablesOk = results.every((r) => r.count >= 0);

    return NextResponse.json({
      success: allTablesOk,
      message: allTablesOk ? 'Base de datos conectada correctamente' : 'Algunas tablas no existen',
      results,
    });
  } catch (error) {
    console.error('Error en health check de BD:', error);
    return NextResponse.json(
      { success: false, error: 'Error de conexión a la base de datos', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
