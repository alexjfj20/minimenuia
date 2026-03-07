/**
 * Business Store - Shared storage for business profile data
 * This module provides a single source of truth for business profile data
 * that can be shared between different API routes.
 * 
 * v2.0 - With file persistence for payment methods sync
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
  logo?: string | null;
  banner?: string | null;
  bannerEnabled?: boolean;
  // Franja Hero Sutil
  heroImageUrl?: string | null;
  showHeroBanner?: boolean;
  // Favicon (Icono de Favoritos) - 16x16 o 32x32 píxeles
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
const PROFILE_FILE = path.join(DATA_DIR, 'business_profile.json');

// ============================================================================
// DEFAULT PROFILE
// ============================================================================

const DEFAULT_PROFILE: BusinessProfile = {
  id: 'business-1',
  name: 'Restaurante El Sabor',
  description: 'El mejor sabor de la ciudad',
  phone: '+57 300 123 4567',
  address: 'Calle 123 #45-67, Bogotá',
  primaryColor: '#8b5cf6',
  secondaryColor: '#ffffff',
  logo: null,
  slug: 'restaurante-el-sabor',
  iva: 19,
  empaque: 3000,
  valorEmpaqueUnitario: 500,
  domicilio: 3000,
  impoconsumo: 8,
  // Imágenes del negocio
  avatar: null,
  banner: null,
  bannerEnabled: true,
  // Franja Hero Sutil
  heroImageUrl: null,
  showHeroBanner: false,
  // Favicon (Icono de Favoritos)
  favicon: null,
  // Propina Voluntaria - Configuración por defecto
  tipEnabled: true,
  tipPercentageDefault: 10,
  tipOnlyOnPremise: true,
  // Métodos de Pago - Configuración por defecto (v2 - matching admin panel)
  paymentMethods: [
    { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
    { id: 'brepb', name: 'BRE-B', icon: '🔵', phone: '', accountHolder: '', qrImage: null, enabled: false },
    { id: 'daviplata', name: 'Daviplata', icon: '🔴', phone: '', accountHolder: '', qrImage: null, enabled: false },
    { id: 'bancolombia', name: 'Bancolombia', icon: '🟡', phone: '', accountHolder: '', qrImage: null, enabled: false },
    { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true }
  ],
  updatedAt: new Date().toISOString()
};

// ============================================================================
// IN-MEMORY STORAGE (SINGLETON) with Lazy Loading
// ============================================================================

let currentProfile: BusinessProfile | null = null;
let isInitialized = false;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function readProfileFromFile(): Promise<BusinessProfile> {
  try {
    const data = await fs.readFile(PROFILE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    console.log('[Business Store] Loaded profile from file:', parsed.name);
    console.log('[Business Store] Payment methods from file:', parsed.paymentMethods?.map((m: PaymentMethodConfig) => `${m.name}(${m.enabled ? 'on' : 'off'})`).join(', '));
    return parsed;
  } catch {
    console.log('[Business Store] No profile file found, using defaults');
    return { ...DEFAULT_PROFILE };
  }
}

async function writeProfileToFile(profile: BusinessProfile): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
    console.log('[Business Store] Saved profile to file:', profile.name);
    console.log('[Business Store] Payment methods saved:', profile.paymentMethods?.map(m => `${m.name}(${m.enabled ? 'on' : 'off'})`).join(', '));
  } catch (error) {
    console.error('[Business Store] Error writing profile file:', error);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeStore(): Promise<void> {
  if (isInitialized) return;
  
  console.log('[Business Store] Initializing...');
  currentProfile = await readProfileFromFile();
  isInitialized = true;
  console.log('[Business Store] Initialized with profile:', currentProfile.name);
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Get the current business profile (sync - uses cached data)
 * For first call, will return default profile until initialize() is called
 */
export function getBusinessProfile(): BusinessProfile {
  if (!currentProfile) {
    console.log('[Business Store] No cached profile, returning defaults');
    return { ...DEFAULT_PROFILE };
  }
  return currentProfile;
}

/**
 * Get the current business profile (async - ALWAYS reads from file for latest data)
 * FIX v3.1: Always read from file to ensure we have the latest data after saves
 */
export async function getBusinessProfileAsync(): Promise<BusinessProfile> {
  // Always read from file to get the latest data
  // This ensures that updates from other API calls are reflected
  currentProfile = await readProfileFromFile();
  isInitialized = true;
  return currentProfile ?? { ...DEFAULT_PROFILE };
}

/**
 * Update the business profile and persist to file
 */
export async function updateBusinessProfileAsync(updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
  await initializeStore();
  
  currentProfile = {
    ...(currentProfile ?? DEFAULT_PROFILE),
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Persist to file
  await writeProfileToFile(currentProfile);
  
  return currentProfile;
}

/**
 * Update the business profile (sync - for backward compatibility)
 * Note: Does not persist to file, use async version for persistence
 */
export function updateBusinessProfile(updates: Partial<BusinessProfile>): BusinessProfile {
  currentProfile = {
    ...(currentProfile ?? DEFAULT_PROFILE),
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Fire and forget file write
  writeProfileToFile(currentProfile).catch(console.error);
  
  return currentProfile;
}

/**
 * Get the default profile (for reference/reset)
 */
export function getDefaultProfile(): BusinessProfile {
  return { ...DEFAULT_PROFILE };
}

/**
 * Force reload profile from file
 */
export async function reloadProfile(): Promise<BusinessProfile> {
  currentProfile = await readProfileFromFile();
  return currentProfile;
}
