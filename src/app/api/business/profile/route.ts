import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// INTERFACES
// ============================================================================

interface BusinessProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  slug: string;
  updatedAt: string;
}

interface ProfileResponse {
  success: boolean;
  data?: BusinessProfile;
  error?: string;
}

interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string | null;
}

// ============================================================================
// FILE-BASED STORAGE
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');
const PROFILE_FILE = path.join(DATA_DIR, 'business_profile.json');

const DEFAULT_PROFILE: BusinessProfile = {
  id: 'business-1',
  name: 'Restaurante El Sabor',
  phone: '+57 300 123 4567',
  address: 'Calle 123 #45-67, Bogotá',
  primaryColor: '#8b5cf6',
  secondaryColor: '#ffffff',
  logo: null,
  slug: 'restaurante-el-sabor',
  updatedAt: new Date().toISOString()
};

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function readProfile(): Promise<BusinessProfile> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PROFILE_FILE, 'utf-8');
    return JSON.parse(data) as BusinessProfile;
  } catch {
    // File doesn't exist, return default and create it
    await writeProfile(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  }
}

async function writeProfile(profile: BusinessProfile): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
}

// ============================================================================
// GET - Obtener perfil del negocio
// ============================================================================

export async function GET(): Promise<NextResponse<ProfileResponse>> {
  try {
    const profile = await readProfile();
    
    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('[Profile API] Error reading profile:', error);
    
    return NextResponse.json({
      success: true,
      data: DEFAULT_PROFILE
    });
  }
}

// ============================================================================
// PUT - Actualizar perfil del negocio
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const body: UpdateProfileRequest = await request.json();
    
    // Read current profile
    const currentProfile = await readProfile();
    
    // Update with new values
    const updatedProfile: BusinessProfile = {
      ...currentProfile,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
      ...(body.secondaryColor !== undefined && { secondaryColor: body.secondaryColor }),
      ...(body.logo !== undefined && { logo: body.logo }),
      updatedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!updatedProfile.name?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del negocio es requerido'
      }, { status: 400 });
    }

    // Save to file
    await writeProfile(updatedProfile);

    console.log('[Profile API] Profile updated successfully:', updatedProfile.name);

    return NextResponse.json({
      success: true,
      data: updatedProfile
    });

  } catch (error) {
    console.error('[Profile API] Error updating profile:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el perfil'
    }, { status: 500 });
  }
}
