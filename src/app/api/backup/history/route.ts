import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// INTERFACES
// ============================================================================

interface BackupHistoryItem {
  fileName: string;
  type: 'manual' | 'auto' | 'restore';
  totalRecords?: number;
  createdAt: string;
  businessName?: string;
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
  hour: string;
  email: string;
  updatedAt?: string;
}

interface HistoryResponse {
  success: boolean;
  data?: {
    history: BackupHistoryItem[];
    schedule: ScheduleConfig | null;
    lastBackup: string | null;
  };
  error?: string;
}

// ============================================================================
// FILE-BASED STORAGE PATHS
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');
const BACKUP_HISTORY_FILE = path.join(DATA_DIR, 'backup_history.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'backup_schedule.json');

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
// GET - Obtener historial y configuración
// ============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<HistoryResponse>> {
  try {
    console.log('[Backup History API] Fetching history...');

    // Leer historial
    const history = await readJSON<BackupHistoryItem[]>(BACKUP_HISTORY_FILE, []);
    
    // Leer configuración de programación
    const schedule = await readJSON<ScheduleConfig | null>(SCHEDULE_FILE, null);

    // Determinar último backup
    const lastBackup = history.length > 0 ? history[0].createdAt : null;

    console.log('[Backup History API] Found', history.length, 'history items');

    return NextResponse.json({
      success: true,
      data: {
        history,
        schedule,
        lastBackup
      }
    });

  } catch (error) {
    console.error('[Backup History API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el historial'
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Limpiar historial
// ============================================================================

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index');

    const history = await readJSON<BackupHistoryItem[]>(BACKUP_HISTORY_FILE, []);

    if (index !== null) {
      const idx = parseInt(index, 10);
      if (!isNaN(idx) && idx >= 0 && idx < history.length) {
        history.splice(idx, 1);
      }
    } else {
      // Limpiar todo el historial
      history.length = 0;
    }

    await fs.writeFile(BACKUP_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Backup History API] Error deleting:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar del historial'
    }, { status: 500 });
  }
}
