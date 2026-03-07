import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// INTERFACES
// ============================================================================

interface BackupMetadata {
  version: string;
  app: string;
  businessName: string;
  businessId: string;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  collections: string[];
}

interface BackupData {
  metadata: BackupMetadata;
  data: {
    products: unknown[];
    categories: unknown[];
    profile: unknown;
    [key: string]: unknown;
  };
}

interface BackupResponse {
  success: boolean;
  data?: BackupData;
  error?: string;
}

// ============================================================================
// FILE-BASED STORAGE PATHS
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const PROFILE_FILE = path.join(DATA_DIR, 'business_profile.json');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function readJSON<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

// ============================================================================
// GET - Crear y descargar backup completo
// ============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<BackupResponse>> {
  try {
    console.log('[Backup API] Creating full backup...');

    // Leer todos los datos del negocio
    const defaultProductsData = {
      products: [],
      categories: [],
      updatedAt: new Date().toISOString()
    };

    const defaultProfile = {
      id: 'business-1',
      name: 'Mi Restaurante',
      phone: '',
      address: '',
      primaryColor: '#8b5cf6',
      secondaryColor: '#ffffff',
      logo: null,
      slug: 'mi-restaurante',
      iva: 19,
      empaque: 0,
      valorEmpaqueUnitario: 500,
      domicilio: 3000,
      updatedAt: new Date().toISOString()
    };

    const productsData = await readJSON<{
      products: unknown[];
      categories: unknown[];
      updatedAt: string;
    }>(PRODUCTS_FILE, defaultProductsData);

    const profile = await readJSON<{
      id: string;
      name: string;
      phone: string;
      address: string;
      primaryColor: string;
      secondaryColor: string;
      logo: string | null;
      slug: string;
      iva: number;
      empaque: number;
      valorEmpaqueUnitario?: number;
      domicilio?: number;
      updatedAt: string;
    }>(PROFILE_FILE, defaultProfile);

    // Calcular total de registros
    const totalRecords = 
      (productsData.products?.length || 0) + 
      (productsData.categories?.length || 0) + 
      1; // profile

    // Crear estructura del backup
    const backupData: BackupData = {
      metadata: {
        version: '1.0',
        app: 'MINIMENU',
        businessName: profile.name || 'Mi Restaurante',
        businessId: profile.id || 'business-1',
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
        totalRecords,
        collections: ['products', 'categories', 'profile']
      },
      data: {
        products: productsData.products || [],
        categories: productsData.categories || [],
        profile: profile
      }
    };

    console.log('[Backup API] Backup created with', totalRecords, 'records');

    return NextResponse.json({
      success: true,
      data: backupData
    });

  } catch (error) {
    console.error('[Backup API] Error creating backup:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al crear el backup'
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Guardar configuración de backup programado
// ============================================================================

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
  hour: string;
  email: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const body: ScheduleConfig = await request.json();
    
    console.log('[Backup API] Saving schedule config:', body);

    // Guardar configuración en archivo
    const scheduleFile = path.join(DATA_DIR, 'backup_schedule.json');
    await fs.writeFile(
      scheduleFile, 
      JSON.stringify({
        ...body,
        updatedAt: new Date().toISOString()
      }, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('[Backup API] Error saving schedule:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al guardar la programación'
    }, { status: 500 });
  }
}
