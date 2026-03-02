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

interface RestoreRequest {
  backupData: {
    metadata: BackupMetadata;
    data: {
      products?: unknown[];
      categories?: unknown[];
      profile?: unknown;
      [key: string]: unknown;
    };
  };
  confirmationCode: string;
}

interface RestoreResponse {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    products: number;
    categories: number;
    profile: boolean;
  };
}

// ============================================================================
// FILE-BASED STORAGE PATHS
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const PROFILE_FILE = path.join(DATA_DIR, 'business_profile.json');
const BACKUP_HISTORY_FILE = path.join(DATA_DIR, 'backup_history.json');

// ============================================================================
// POST - Restaurar backup desde archivo JSON
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<RestoreResponse>> {
  try {
    const body: RestoreRequest = await request.json();
    
    console.log('[Restore API] Processing restore request...');

    // Validar código de confirmación
    if (body.confirmationCode !== 'RESTAURAR') {
      return NextResponse.json({
        success: false,
        error: 'Código de confirmación incorrecto. Debe escribir RESTAURAR.'
      }, { status: 400 });
    }

    // Validar estructura del backup
    if (!body.backupData?.metadata || !body.backupData?.data) {
      return NextResponse.json({
        success: false,
        error: 'Estructura de backup inválida. Falta metadata o data.'
      }, { status: 400 });
    }

    const { metadata, data } = body.backupData;

    // Validar que sea de MINIMENU
    if (metadata.app !== 'MINIMENU') {
      return NextResponse.json({
        success: false,
        error: 'Este backup no es compatible con MINIMENU.'
      }, { status: 400 });
    }

    // Validar versión
    if (metadata.version !== '1.0') {
      console.warn('[Restore API] Backup version mismatch:', metadata.version);
    }

    // Crear backup automático antes de restaurar (por seguridad)
    try {
      const currentProducts = await fs.readFile(PRODUCTS_FILE, 'utf-8').catch(() => '{}');
      const currentProfile = await fs.readFile(PROFILE_FILE, 'utf-8').catch(() => '{}');
      
      const preRestoreBackup = {
        metadata: {
          version: '1.0',
          app: 'MINIMENU',
          type: 'pre-restore-auto',
          createdAt: new Date().toISOString(),
          reason: 'Backup automático antes de restaurar'
        },
        data: {
          products: JSON.parse(currentProducts || '{}'),
          profile: JSON.parse(currentProfile || '{}')
        }
      };

      const preRestoreFile = path.join(DATA_DIR, `pre_restore_${Date.now()}.json`);
      await fs.writeFile(preRestoreFile, JSON.stringify(preRestoreBackup, null, 2), 'utf-8');
      console.log('[Restore API] Pre-restore backup created');
    } catch (e) {
      console.warn('[Restore API] Could not create pre-restore backup:', e);
    }

    // Restaurar productos y categorías
    let productsCount = 0;
    let categoriesCount = 0;
    let profileRestored = false;

    if (data.products || data.categories) {
      const productsData = {
        products: data.products || [],
        categories: data.categories || [],
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(productsData, null, 2), 'utf-8');
      productsCount = (data.products as unknown[])?.length || 0;
      categoriesCount = (data.categories as unknown[])?.length || 0;
      console.log('[Restore API] Restored', productsCount, 'products and', categoriesCount, 'categories');
    }

    // Restaurar perfil
    if (data.profile) {
      const profileData = {
        ...data.profile,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(PROFILE_FILE, JSON.stringify(profileData, null, 2), 'utf-8');
      profileRestored = true;
      console.log('[Restore API] Restored profile');
    }

    // Guardar en historial
    try {
      let history: unknown[] = [];
      try {
        const historyData = await fs.readFile(BACKUP_HISTORY_FILE, 'utf-8');
        history = JSON.parse(historyData);
      } catch {
        history = [];
      }

      history.unshift({
        fileName: `restore_${Date.now()}.json`,
        type: 'restore',
        originalBackupDate: metadata.createdAt,
        totalRecords: metadata.totalRecords,
        restoredAt: new Date().toISOString(),
        businessName: metadata.businessName
      });

      // Mantener solo los últimos 50 registros
      if (history.length > 50) {
        history = history.slice(0, 50);
      }

      await fs.writeFile(BACKUP_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Restore API] Could not update history:', e);
    }

    console.log('[Restore API] Restore completed successfully');

    return NextResponse.json({
      success: true,
      message: `Restauración completada: ${productsCount} productos, ${categoriesCount} categorías`,
      stats: {
        products: productsCount,
        categories: categoriesCount,
        profile: profileRestored
      }
    });

  } catch (error) {
    console.error('[Restore API] Error restoring backup:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al restaurar el backup. Revisa la consola para más detalles.'
    }, { status: 500 });
  }
}
