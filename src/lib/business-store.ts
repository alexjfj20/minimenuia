/**
 * Business Store - Shared storage for business profile data (Isolated for SaaS)
 * v3.0 - Isolated by businessId to prevent data leakage between tenants
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// INTERFACES
// ============================================================================

export interface PaymentMethodConfig {
  id: string;
  name: string;
  icon: string;
  phone: string;
  accountHolder: string;
  qrImage: string | null;
  enabled: boolean;
}

export interface BusinessProfile {
  id: string;
  name: string;
  description?: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  slug: string;
  iva?: number;
  empaque?: number;
  valorEmpaqueUnitario?: number;
  domicilio?: number;
  impoconsumo?: number;
  // Imágenes del negocio
  avatar?: string | null;
  banner?: string | null;
  bannerEnabled?: boolean;
  // Franja Hero Sutil
  heroImageUrl?: string | null;
  showHeroBanner?: boolean;
  // Favicon (Icono de Favoritos)
  favicon?: string | null;
  // Propina Voluntaria
  tipEnabled?: boolean;
  tipPercentageDefault?: number;
  tipOnlyOnPremise?: boolean;
  // Métodos de Pago
  paymentMethods?: PaymentMethodConfig[];
  updatedAt: string;
}

// ============================================================================
// FILE PATHS
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');

// ============================================================================
// DEFAULT PROFILE
// ============================================================================

const DEFAULT_PROFILE: BusinessProfile = {
  id: 'default',
  name: 'Mi Negocio',
  description: '',
  phone: '',
  address: '',
  primaryColor: '#8b5cf6',
  secondaryColor: '#ffffff',
  logo: null,
  slug: 'mi-negocio',
  iva: 0,
  empaque: 0,
  valorEmpaqueUnitario: 0,
  domicilio: 0,
  impoconsumo: 0,
  avatar: null,
  banner: null,
  bannerEnabled: true,
  heroImageUrl: null,
  showHeroBanner: false,
  favicon: null,
  tipEnabled: true,
  tipPercentageDefault: 10,
  tipOnlyOnPremise: true,
  paymentMethods: [
    { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
    { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true }
  ],
  updatedAt: new Date().toISOString()
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getProfilePath(businessId: string): string {
  // We use a specific file for each business to ensure isolation
  return path.join(DATA_DIR, `profile_${businessId}.json`);
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

// ============================================================================
// EXPORTED FUNCTIONS (SaaS ISOLATED)
// ============================================================================

/**
 * Get the business profile for a specific businessId
 */
export async function getBusinessProfileAsync(businessId: string): Promise<BusinessProfile> {
  if (!businessId) {
    console.error('[Business Store] businessId is required for getBusinessProfileAsync');
    return { ...DEFAULT_PROFILE };
  }

  const profilePath = getProfilePath(businessId);
  try {
    const data = await fs.readFile(profilePath, 'utf-8');
    const parsed = JSON.parse(data);
    return { ...DEFAULT_PROFILE, ...parsed, id: businessId };
  } catch {
    // If no file, return default but with the correct ID
    return { ...DEFAULT_PROFILE, id: businessId };
  }
}

/**
 * Update the business profile for a specific businessId
 */
export async function updateBusinessProfileAsync(businessId: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
  if (!businessId) {
    throw new Error('businessId is required for updateBusinessProfileAsync');
  }

  const currentProfile = await getBusinessProfileAsync(businessId);
  const updatedProfile = {
    ...currentProfile,
    ...updates,
    id: businessId,
    updatedAt: new Date().toISOString()
  };

  await ensureDataDir();
  const profilePath = getProfilePath(businessId);
  await fs.writeFile(profilePath, JSON.stringify(updatedProfile, null, 2), 'utf-8');

  console.log('[Business Store] Saved isolated profile for:', businessId);
  return updatedProfile;
}

/**
 * Sync compatibility function (not recommended for SaaS)
 */
export function getBusinessProfile(): BusinessProfile {
  return { ...DEFAULT_PROFILE };
}

export function updateBusinessProfile(updates: Partial<BusinessProfile>): BusinessProfile {
  console.warn('[Business Store] Sync update called in SaaS mode. Use updateBusinessProfileAsync instead.');
  return { ...DEFAULT_PROFILE, ...updates };
}

export function getDefaultProfile(): BusinessProfile {
  return { ...DEFAULT_PROFILE };
}
