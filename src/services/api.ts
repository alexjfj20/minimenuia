// =============================================
// MINIMENU - API Services (Simulated Backend)
// =============================================

import type {
  Business,
  SystemService,
  Module,
  LandingPlan,
  User,
  ApiResponse,
  GlobalPaymentConfig,
  CreateServiceData,
  CreateModuleData,
  CreatePlanData,
  UpdateServiceData,
  UpdateModuleData,
  UpdatePlanData,
  LoginCredentials,
  RegisterData,
  ServiceStatus,
  ModuleStatus,
  AIConfig,
  LibraryItem,
  AIModelConfig,
  CreateAIModelData,
  CreateLibraryItemData,
  CreateUserData,
  UpdateUserData,
  UserStatus
} from '@/types';

import * as storage from './storage';
import { integrationService } from './integration-service';

// --- Simulated Network Delay ---

const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// --- Auth Service (Database-backed) ---

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          data: null,
          error: data.error ?? 'Error al iniciar sesión',
          message: data.message ?? null,
        };
      }

      // Map database role to frontend role format
      const roleMap: Record<string, User['role']> = {
        'SUPER_ADMIN': 'super_admin',
        'BUSINESS_ADMIN': 'admin',
        'STAFF': 'employee',
      };

      const user: User = {
        id: data.data.id,
        email: data.data.email,
        name: data.data.name,
        username: data.data.name.toLowerCase().replace(/\s+/g, ''),
        role: roleMap[data.data.role] ?? 'admin',
        status: 'active',
        businessId: data.data.businessId,
        businessName: data.data.businessName,
        phone: null,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      return { success: true, data: user, error: null, message: 'Inicio de sesión exitoso' };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        data: null,
        error: 'Error de conexión',
        message: 'No se pudo conectar con el servidor',
      };
    }
  },

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        return {
          success: false,
          data: null,
          error: responseData.error ?? 'Error al registrar',
          message: responseData.message ?? null,
        };
      }

      // Map database role to frontend role format
      const roleMap: Record<string, User['role']> = {
        'SUPER_ADMIN': 'super_admin',
        'BUSINESS_ADMIN': 'admin',
        'STAFF': 'employee',
      };

      const user: User = {
        id: responseData.data.id,
        email: responseData.data.email,
        name: responseData.data.name,
        username: responseData.data.name.toLowerCase().replace(/\s+/g, ''),
        role: roleMap[responseData.data.role] ?? 'admin',
        status: 'active',
        businessId: responseData.data.businessId,
        businessName: responseData.data.businessName,
        phone: null,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      return { success: true, data: user, error: null, message: 'Cuenta creada exitosamente' };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        data: null,
        error: 'Error de conexión',
        message: 'No se pudo conectar con el servidor',
      };
    }
  },

  async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();

      return {
        success: data.success,
        data: null,
        error: data.error ?? null,
        message: data.message ?? 'Sesión cerrada',
      };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: true, data: null, error: null, message: 'Sesión cerrada' };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        return null;
      }

      // Map database role to frontend role format
      const roleMap: Record<string, User['role']> = {
        'SUPER_ADMIN': 'super_admin',
        'BUSINESS_ADMIN': 'admin',
        'STAFF': 'employee',
      };

      return {
        id: data.data.id,
        email: data.data.email,
        name: data.data.name,
        username: data.data.name.toLowerCase().replace(/\s+/g, ''),
        role: roleMap[data.data.role] ?? 'admin',
        status: 'active',
        businessId: data.data.businessId,
        businessName: data.data.businessName,
        phone: null,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }
};

// --- Business Service ---

export const businessService = {
  async getAll(): Promise<ApiResponse<Business[]>> {
    try {
      console.log('[Business API] Fetching businesses from Supabase...');

      const response = await fetch('/api/superadmin/businesses');
      const result = await response.json() as { success: boolean; data: Business[] | null; error: string | null };

      console.log('[Business API] Response:', {
        hasData: !!result.data,
        dataLength: result.data?.length,
        hasError: !result.success,
        errorMessage: result.error
      });

      if (!result.success) {
        console.error('[Business API] Error fetching:', result.error);
        return {
          success: false,
          data: null,
          error: result.error ?? 'Error desconocido',
          message: null
        };
      }

      return { success: true, data: result.data ?? [], error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Business API] Exception:', message, error);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async getById(id: string): Promise<ApiResponse<Business | null>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { success: false, data: null, error: 'Negocio no encontrado', message: null };
      }

      return { success: true, data, error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Business API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async create(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Business>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      const newBusiness = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: inserted, error } = await supabase
        .from('businesses')
        .insert(newBusiness)
        .select()
        .single();

      if (error) {
        console.error('[Business API] Error creating:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: inserted, error: null, message: 'Negocio creado exitosamente' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Business API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async update(id: string, updates: Partial<Business>): Promise<ApiResponse<Business>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      const { data: updated, error } = await supabase
        .from('businesses')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Business API] Error updating:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: updated, error: null, message: 'Negocio actualizado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Business API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Business API] Error deleting:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: null, error: null, message: 'Negocio eliminado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Business API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  }
};

// --- System Service ---

export const systemService = {
  async getAll(): Promise<ApiResponse<SystemService[]>> {
    try {
      console.log('[System Service] Fetching services from API...');

      const response = await fetch('/api/superadmin/services');
      const result = await response.json() as { success: boolean; data: SystemService[] | null; error: string | null };

      if (!result.success) {
        console.error('[System Service] Error fetching:', result.error);
        return { success: false, data: null, error: result.error ?? 'Error desconocido', message: null };
      }

      return { success: true, data: result.data ?? [], error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[System Service] Exception:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async create(data: CreateServiceData): Promise<ApiResponse<SystemService>> {
    try {
      console.log('[System Service] Creating service:', data.name);

      const response = await fetch('/api/superadmin/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[System Service] Error creating:', result.error);
        return { success: false, data: null, error: result.error || 'Error desconocido', message: null };
      }

      return { success: true, data: result.data, error: null, message: result.message || 'Servicio creado exitosamente' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[System Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async update(id: string, updates: UpdateServiceData): Promise<ApiResponse<SystemService>> {
    try {
      const supabaseAdminModule = await import('@/lib/supabaseAdmin');
      const supabase = supabaseAdminModule.supabaseAdmin;

      const { data: updated, error } = await supabase
        .from('services')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[System Service] Error updating:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: updated, error: null, message: 'Servicio actualizado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[System Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async toggleStatus(id: string): Promise<ApiResponse<SystemService>> {
    try {
      console.log('[System Service] Toggling status for service:', id);

      const response = await fetch('/api/superadmin/services/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[System Service] Error toggling status:', result.error);
        return { success: false, data: null, error: result.error || 'Error desconocido', message: null };
      }

      return { 
        success: true, 
        data: result.data, 
        error: null, 
        message: result.message || 'Servicio actualizado' 
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[System Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const supabaseAdminModule = await import('@/lib/supabaseAdmin');
      const supabase = supabaseAdminModule.supabaseAdmin;

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[System Service] Error deleting:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: null, error: null, message: 'Servicio eliminado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[System Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async clearAll(): Promise<ApiResponse<null>> {
    try {
      const supabaseAdminModule = await import('@/lib/supabaseAdmin');
      const supabase = supabaseAdminModule.supabaseAdmin;

      const { error } = await supabase
        .from('services')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('[System Service] Error clearing all:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: null, error: null, message: 'Todos los servicios eliminados' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[System Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  }
};

// --- Module Service ---

export const moduleService = {
  async getAll(): Promise<ApiResponse<Module[]>> {
    try {
      console.log('[Module Service] Fetching modules from API...');

      const response = await fetch('/api/superadmin/modules');
      const result = await response.json() as { success: boolean; data: Module[] | null; error: string | null };

      if (!result.success) {
        console.error('[Module Service] Error fetching:', result.error);
        return { success: false, data: null, error: result.error ?? 'Error desconocido', message: null };
      }

      return { success: true, data: result.data ?? [], error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Module Service] Exception:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async create(data: CreateModuleData): Promise<ApiResponse<Module>> {
    try {
      console.log('[Module Service] Creating module:', data.name);

      const response = await fetch('/api/superadmin/modules/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[Module Service] Error creating:', result.error);
        return { success: false, data: null, error: result.error || 'Error desconocido', message: null };
      }

      return { success: true, data: result.data, error: null, message: result.message || 'Módulo creado exitosamente' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Module Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async update(id: string, updates: UpdateModuleData): Promise<ApiResponse<Module>> {
    try {
      const supabaseAdminModule = await import('@/lib/supabaseAdmin');
      const supabase = supabaseAdminModule.supabaseAdmin;

      const { data: updated, error } = await supabase
        .from('modules')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Module Service] Error updating:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: updated, error: null, message: 'Módulo actualizado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Module Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async toggleStatus(id: string): Promise<ApiResponse<Module>> {
    try {
      const supabaseAdminModule = await import('@/lib/supabaseAdmin');
      const supabase = supabaseAdminModule.supabaseAdmin;

      // Get current module
      const { data: current } = await supabase
        .from('modules')
        .select('type, status')
        .eq('id', id)
        .single();

      if (!current) {
        return { success: false, data: null, error: 'Módulo no encontrado', message: null };
      }

      // Core modules cannot be deactivated
      if (current.type === 'core') {
        return {
          success: false,
          data: null,
          error: 'No se puede desactivar',
          message: 'Los módulos core no pueden ser desactivados'
        };
      }

      const newStatus = current.status === 'active' ? 'inactive' : 'active';

      const { data: updated, error } = await supabase
        .from('modules')
        .update({
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Module Service] Error toggling status:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return {
        success: true,
        data: updated,
        error: null,
        message: `Módulo ${newStatus === 'active' ? 'activado' : 'desactivado'}`
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Module Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const supabaseAdminModule = await import('@/lib/supabaseAdmin');
      const supabase = supabaseAdminModule.supabaseAdmin;

      // Check if core module
      const { data: moduleItem } = await supabase
        .from('modules')
        .select('type')
        .eq('id', id)
        .single();

      if (moduleItem?.type === 'core') {
        return {
          success: false,
          data: null,
          error: 'No se puede eliminar',
          message: 'Los módulos core no pueden ser eliminados'
        };
      }

      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Module Service] Error deleting:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: null, error: null, message: 'Módulo eliminado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Module Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async clearAll(): Promise<ApiResponse<null>> {
    try {
      const supabaseAdminModule = await import('@/lib/supabaseAdmin');
      const supabase = supabaseAdminModule.supabaseAdmin;

      // Keep core modules only
      const { error } = await supabase
        .from('modules')
        .delete()
        .neq('type', 'core');

      if (error) {
        console.error('[Module Service] Error clearing all:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: null, error: null, message: 'Módulos addon eliminados' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Module Service] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  }
};

// --- Plan Service ---

export const planService = {
  async getAll(): Promise<ApiResponse<LandingPlan[]>> {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      
      // If no plans in Supabase, migrate from localStorage
      if (!data || data.length === 0) {
        console.log('[PlanService] No plans in Supabase, migrating from localStorage...');
        const { default: storage } = await import('./storage');
        const localPlans = storage.getPlans();
        
        if (localPlans.length > 0) {
          // Migrate each plan to Supabase
          const migratedPlans: LandingPlan[] = [];
          for (const plan of localPlans) {
            const { data: createdPlan, error: createError } = await supabase
              .from('plans')
              .insert({
                ...plan,
                features: Array.isArray(plan.features) ? plan.features : plan.features.split('\n').filter(f => f.trim()),
                isActive: plan.isActive ?? true,
                isPublic: plan.isPublic ?? true,
                order: plan.order ?? 0,
                icon: plan.icon || 'zap',
                color: plan.color || '#8b5cf6',
                maxUsers: plan.maxUsers ?? 1,
                maxProducts: plan.maxProducts ?? 50,
                maxCategories: plan.maxCategories ?? 5,
                hotmartUrl: plan.hotmartUrl || null,
                createdAt: plan.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
              .select()
              .single();
            
            if (!createError && createdPlan) {
              migratedPlans.push(createdPlan);
            }
          }
          
          console.log(`[PlanService] Migrated ${migratedPlans.length} plans to Supabase`);
          return { success: true, data: migratedPlans, error: null, message: 'Planes migrados' };
        }
      }
      
      return { success: true, data: data || [], error: null, message: null };
    } catch (error: any) {
      console.error('[PlanService] GetAll error:', error);
      return { success: false, data: [], error: error.message, message: 'Error al obtener planes' };
    }
  },

  async getById(id: string): Promise<ApiResponse<LandingPlan | null>> {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: false, data: null, error: 'Plan no encontrado', message: null };
      }

      return { success: true, data, error: null, message: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: 'Error al obtener plan' };
    }
  },

  async create(data: CreatePlanData): Promise<ApiResponse<LandingPlan>> {
    try {
      const { supabase } = await import('@/lib/supabaseClient');

      const newPlan: Omit<LandingPlan, 'id' | 'createdAt' | 'updatedAt' | 'hotmartUrl'> = {
        ...data,
        features: (() => {
          const f = data.features;
          if (Array.isArray(f)) {
            // Si el primer elemento es un JSON string, parsearlo
            if (f.length === 1 && typeof f[0] === 'string' && f[0].startsWith('[')) {
              try { return JSON.parse(f[0]) as string[]; } catch { return f; }
            }
            return f;
          }
          return String(f).split('\n').filter(Boolean);
        })(),
        isActive: data.isActive ?? true,
        isPublic: data.isPublic ?? true,
        order: data.order ?? 0,
        icon: data.icon || 'zap',
        color: data.color || '#8b5cf6',
        maxUsers: data.maxUsers ?? 1,
        maxProducts: data.maxProducts ?? 50,
        maxCategories: data.maxCategories ?? 5
        // hotmartUrl eliminado — columna no existe en Supabase
      };

      // PASO 1: INSERT sin .select().single() — evita PGRST116
      const { error: insertError } = await supabase
        .from('plans')
        .insert(newPlan);

      if (insertError) {
        console.error('[PlanService] Insert error:', JSON.stringify(insertError, null, 2));
        throw new Error(insertError.message || insertError.details || 'Error al crear plan');
      }

      // PASO 2: SELECT separado para obtener el plan creado
      const { data: createdPlan, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', newPlan.slug)
        .single();

      if (fetchError || !createdPlan) {
        console.warn('[PlanService] Insert OK, fallback local:', fetchError?.message);
        const fallback = {
          ...newPlan,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as LandingPlan;
        return { success: true, data: fallback, error: null, message: 'Plan creado exitosamente' };
      }

      return { success: true, data: createdPlan, error: null, message: 'Plan creado exitosamente' };
    } catch (error: any) {
      console.error('[PlanService] Create error:', error);
      return { success: false, data: null as any, error: error.message, message: 'Error al crear plan' };
    }
  },

  async update(id: string, updates: UpdatePlanData): Promise<ApiResponse<LandingPlan>> {
    try {
      const { supabase } = await import('@/lib/supabaseClient');

      // Build update data with only fields that likely exist in Supabase
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      // Add fields one by one with null checks
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.period !== undefined) updateData.period = updates.period;
      if (updates.maxUsers !== undefined) updateData.maxUsers = updates.maxUsers;
      if (updates.maxProducts !== undefined) updateData.maxProducts = updates.maxProducts;
      if (updates.maxCategories !== undefined) updateData.maxCategories = updates.maxCategories;
      if (updates.isPopular !== undefined) updateData.isPopular = updates.isPopular;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
      if (updates.order !== undefined) updateData.order = updates.order;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      // hotmartUrl eliminado — columna no existe en Supabase

      // Handle features - convert string to array con fix para JSON stringificado
      if (updates.features !== undefined) {
        if (typeof updates.features === 'string') {
          updateData.features = updates.features.split('\n').filter(Boolean);
        } else if (Array.isArray(updates.features)) {
          const f = updates.features;
          if (f.length === 1 && typeof f[0] === 'string' && f[0].startsWith('[')) {
            try { updateData.features = JSON.parse(f[0]) as string[]; }
            catch { updateData.features = f; }
          } else {
            updateData.features = f;
          }
        }
      }

      console.log('[PlanService] Updating plan:', id);
      console.log('[PlanService] Update data:', JSON.stringify(updateData, null, 2));

      // UPDATE separado — sin .select().single() para evitar PGRST116
      const { error: updateError } = await supabase
        .from('plans')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('[PlanService] Supabase update error:', JSON.stringify(updateError, null, 2));
        throw new Error(updateError.message || updateError.details || 'Error al actualizar el plan');
      }

      // SELECT separado para obtener la fila actualizada
      const { data: updatedPlan, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !updatedPlan) {
        // Update OK en Supabase, retornamos datos del form como fallback visual
        console.warn('[PlanService] Update OK, fallback local:', fetchError?.message);
        const fallback = { 
          ...updates,
          id,
          features: Array.isArray(updates.features) 
            ? updates.features 
            : String(updates.features ?? '').split('\n').filter(Boolean),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as LandingPlan;
        return { success: true, data: fallback, error: null, message: 'Plan actualizado' };
      }

      console.log('[PlanService] Plan updated successfully:', updatedPlan.id);
      return { success: true, data: updatedPlan, error: null, message: 'Plan actualizado' };
    } catch (error: any) {
      console.error('[PlanService] Update error:', error);
      const errorMessage = error?.message || error?.details || error?.hint || 'Error desconocido al actualizar plan';
      return { success: false, data: null as any, error: errorMessage, message: 'Error al actualizar plan' };
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, data: null, error: null, message: 'Plan eliminado' };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: 'Error al eliminar plan' };
    }
  }
};

// --- Payment Config Service ---

export const paymentConfigService = {
  async get(): Promise<ApiResponse<GlobalPaymentConfig>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      // Obtener configuración desde Supabase
      const { data: paymentData, error } = await supabase
        .from('payment_gateway')
        .select('*')
        .single();

      if (error) {
        console.error('[PaymentConfig] Error fetching from Supabase:', error);
        // Retornar configuración por defecto si hay error
        return { 
          success: true, 
          data: getDefaultPaymentConfig(), 
          error: null, 
          message: null 
        };
      }

      // Transformar datos de Supabase a formato GlobalPaymentConfig
      const config: GlobalPaymentConfig = {
        stripe: {
          enabled: paymentData.stripe_enabled || false,
          mode: (paymentData.stripe_mode as GatewayMode) || 'sandbox',
          publicKey: paymentData.stripe_public_key || '',
          secretKey: paymentData.stripe_secret_key || '',
          instructions: paymentData.stripe_instructions || ''
        },
        mercadoPago: {
          enabled: paymentData.mercado_pago_enabled || false,
          mode: (paymentData.mercado_pago_mode as GatewayMode) || 'sandbox',
          publicKey: paymentData.mercado_pago_public_key || '',
          secretKey: paymentData.mercado_pago_secret_key || '',
          instructions: paymentData.mercado_pago_instructions || ''
        },
        paypal: {
          enabled: paymentData.paypal_enabled || false,
          mode: (paymentData.paypal_mode as GatewayMode) || 'sandbox',
          publicKey: paymentData.paypal_public_key || '',
          secretKey: paymentData.paypal_secret_key || '',
          instructions: paymentData.paypal_instructions || ''
        },
        nequi: {
          enabled: paymentData.nequi_enabled || false,
          accountNumber: paymentData.nequi_account_number || '',
          accountHolder: paymentData.nequi_account_holder || '',
          instructions: paymentData.nequi_instructions || '',
          qrCodeUrl: paymentData.nequi_qr_code_url || null
        },
        bancolombia: {
          enabled: paymentData.bancolombia_enabled || false,
          accountNumber: paymentData.bancolombia_account_number || '',
          accountHolder: paymentData.bancolombia_account_holder || '',
          instructions: paymentData.bancolombia_instructions || '',
          qrCodeUrl: paymentData.bancolombia_qr_code_url || null
        },
        daviplata: {
          enabled: paymentData.daviplata_enabled || false,
          accountNumber: paymentData.daviplata_account_number || '',
          accountHolder: paymentData.daviplata_account_holder || '',
          instructions: paymentData.daviplata_instructions || '',
          qrCodeUrl: paymentData.daviplata_qr_code_url || null
        },
        breB: {
          enabled: paymentData.bre_b_enabled || false,
          accountNumber: paymentData.bre_b_account_number || '',
          accountHolder: paymentData.bre_b_account_holder || '',
          instructions: paymentData.bre_b_instructions || '',
          qrCodeUrl: paymentData.bre_b_qr_code_url || null
        },
        hotmart: {
          enabled: paymentData.hotmart_enabled || false,
          instructions: paymentData.hotmart_instructions || ''
        }
      };

      return { success: true, data: config, error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[PaymentConfig] Error:', message);
      return { 
        success: false, 
        data: getDefaultPaymentConfig(), 
        error: message, 
        message: null 
      };
    }
  },

  async update(config: GlobalPaymentConfig): Promise<ApiResponse<GlobalPaymentConfig>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      // Transformar GlobalPaymentConfig a formato de base de datos
      const dbConfig = {
        stripe_enabled: config.stripe.enabled,
        stripe_mode: config.stripe.mode,
        stripe_public_key: config.stripe.publicKey,
        stripe_secret_key: config.stripe.secretKey,
        stripe_instructions: config.stripe.instructions,
        
        mercado_pago_enabled: config.mercadoPago.enabled,
        mercado_pago_mode: config.mercadoPago.mode,
        mercado_pago_public_key: config.mercadoPago.publicKey,
        mercado_pago_secret_key: config.mercadoPago.secretKey,
        mercado_pago_instructions: config.mercadoPago.instructions,
        
        paypal_enabled: config.paypal.enabled,
        paypal_mode: config.paypal.mode,
        paypal_public_key: config.paypal.publicKey,
        paypal_secret_key: config.paypal.secretKey,
        paypal_instructions: config.paypal.instructions,
        
        nequi_enabled: config.nequi.enabled,
        nequi_account_number: config.nequi.accountNumber,
        nequi_account_holder: config.nequi.accountHolder,
        nequi_instructions: config.nequi.instructions,
        nequi_qr_code_url: config.nequi.qrCodeUrl,
        
        bancolombia_enabled: config.bancolombia.enabled,
        bancolombia_account_number: config.bancolombia.accountNumber,
        bancolombia_account_holder: config.bancolombia.accountHolder,
        bancolombia_instructions: config.bancolombia.instructions,
        bancolombia_qr_code_url: config.bancolombia.qrCodeUrl,
        
        daviplata_enabled: config.daviplata.enabled,
        daviplata_account_number: config.daviplata.accountNumber,
        daviplata_account_holder: config.daviplata.accountHolder,
        daviplata_instructions: config.daviplata.instructions,
        daviplata_qr_code_url: config.daviplata.qrCodeUrl,
        
        bre_b_enabled: config.breB.enabled,
        bre_b_account_number: config.breB.accountNumber,
        bre_b_account_holder: config.breB.accountHolder,
        bre_b_instructions: config.breB.instructions,
        bre_b_qr_code_url: config.breB.qrCodeUrl,
        
        hotmart_enabled: config.hotmart.enabled,
        hotmart_instructions: config.hotmart.instructions,
        
        updated_at: new Date().toISOString()
      };

      // Verificar si existe un registro
      const { data: existing } = await supabase
        .from('payment_gateway')
        .select('id')
        .single();

      let error: any = null;
      
      if (existing) {
        // Actualizar registro existente
        const result = await supabase
          .from('payment_gateway')
          .update(dbConfig)
          .eq('id', existing.id);
        
        error = result.error;
      } else {
        // Insertar nuevo registro
        const result = await supabase
          .from('payment_gateway')
          .insert(dbConfig);
        
        error = result.error;
      }

      if (error) {
        console.error('[PaymentConfig] Error updating Supabase:', error);
        return { success: false, data: config, error: error.message, message: null };
      }

      return { success: true, data: config, error: null, message: 'Configuración guardada' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[PaymentConfig] Error:', message);
      return { success: false, data: config, error: message, message: null };
    }
  }
};

// Helper function para obtener configuración por defecto
function getDefaultPaymentConfig(): GlobalPaymentConfig {
  return {
    stripe: {
      enabled: false,
      mode: 'sandbox',
      publicKey: '',
      secretKey: '',
      instructions: 'Serás redirigido a la plataforma segura de Stripe para completar el pago.'
    },
    mercadoPago: {
      enabled: false,
      mode: 'sandbox',
      publicKey: '',
      secretKey: '',
      instructions: 'Serás redirigido a Mercado Pago para completar tu pago de forma segura.'
    },
    paypal: {
      enabled: false,
      mode: 'sandbox',
      publicKey: '',
      secretKey: '',
      instructions: 'Serás redirigido a PayPal para completar tu pago de forma segura.'
    },
    nequi: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: '',
      qrCodeUrl: null
    },
    bancolombia: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: '',
      qrCodeUrl: null
    },
    daviplata: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: '',
      qrCodeUrl: null
    },
    breB: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: 'Escanea el código QR o realiza la transferencia desde la app BRE-B.',
      qrCodeUrl: null
    },
    hotmart: {
      enabled: false,
      instructions: 'Serás redirigido a Hotmart para completar tu suscripción de forma segura.'
    }
  };
}

// --- AI Config Service ---

export const aiConfigService = {
  async get(): Promise<ApiResponse<AIConfig>> {
    await delay(200);
    const config = storage.getAIConfig();
    return { success: true, data: config, error: null, message: null };
  },

  async update(config: AIConfig): Promise<ApiResponse<AIConfig>> {
    await delay(400);
    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    storage.setAIConfig(updatedConfig);
    return { success: true, data: updatedConfig, error: null, message: 'Configuración de IA guardada' };
  },

  async addModel(data: CreateAIModelData): Promise<ApiResponse<AIModelConfig>> {
    await delay(300);
    const config = storage.getAIConfig();

    const newModel: AIModelConfig = {
      id: storage.generateId('model'),
      provider: data.provider,
      name: data.name,
      model: data.model,
      active: false,
      apiKey: data.apiKey,
      baseUrl: data.baseUrl ?? null,
      authType: data.authType ?? 'bearer',
      useCase: data.useCase ?? 'both',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    config.models.push(newModel);
    storage.setAIConfig(config);

    return { success: true, data: newModel, error: null, message: 'Modelo agregado' };
  },

  async updateModel(id: string, updates: Partial<AIModelConfig>): Promise<ApiResponse<AIModelConfig>> {
    await delay(300);
    const config = storage.getAIConfig();
    const modelIndex = config.models.findIndex(m => m.id === id);
    
    if (modelIndex === -1) {
      return { success: false, data: null, error: 'Modelo no encontrado', message: null };
    }
    
    config.models[modelIndex] = {
      ...config.models[modelIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    storage.setAIConfig(config);
    return { success: true, data: config.models[modelIndex], error: null, message: 'Modelo actualizado' };
  },

  async deleteModel(id: string): Promise<ApiResponse<null>> {
    await delay(200);
    const config = storage.getAIConfig();
    config.models = config.models.filter(m => m.id !== id);
    
    if (config.activeModelId === id) {
      config.activeModelId = null;
    }
    
    storage.setAIConfig(config);
    return { success: true, data: null, error: null, message: 'Modelo eliminado' };
  },

  async setActiveModel(id: string): Promise<ApiResponse<AIModelConfig>> {
    await delay(200);
    const config = storage.getAIConfig();
    const model = config.models.find(m => m.id === id);
    
    if (!model) {
      return { success: false, data: null, error: 'Modelo no encontrado', message: null };
    }
    
    // Deactivate all models first
    config.models = config.models.map(m => ({ ...m, active: false }));
    // Activate selected model
    model.active = true;
    config.activeModelId = id;
    
    storage.setAIConfig(config);
    return { success: true, data: model, error: null, message: 'Modelo activado' };
  },

  async testConnection(data: CreateAIModelData): Promise<ApiResponse<{ success: boolean; message: string }>> {
    await delay(1500);
    
    // Simulated connection test
    const isValidKey = data.apiKey.length >= 10;
    
    if (isValidKey) {
      return {
        success: true,
        data: { success: true, message: 'Conexión exitosa con el proveedor de IA' },
        error: null,
        message: 'Conexión verificada'
      };
    }
    
    return {
      success: false,
      data: { success: false, message: 'Clave API inválida o no autorizada' },
      error: 'Error de conexión',
      message: 'No se pudo conectar con el proveedor'
    };
  },

  async addKnowledgeSource(url: string): Promise<ApiResponse<string[]>> {
    await delay(200);
    const config = storage.getAIConfig();
    
    if (config.knowledgeSources.includes(url)) {
      return { success: false, data: null, error: 'URL ya existe', message: null };
    }
    
    config.knowledgeSources.push(url);
    storage.setAIConfig(config);
    
    return { success: true, data: config.knowledgeSources, error: null, message: 'Fuente añadida' };
  },

  async removeKnowledgeSource(url: string): Promise<ApiResponse<string[]>> {
    await delay(200);
    const config = storage.getAIConfig();
    config.knowledgeSources = config.knowledgeSources.filter(u => u !== url);
    storage.setAIConfig(config);
    
    return { success: true, data: config.knowledgeSources, error: null, message: 'Fuente eliminada' };
  }
};

// --- Library Service ---

export const libraryService = {
  async getAll(): Promise<ApiResponse<LibraryItem[]>> {
    await delay(200);
    const items = storage.getLibraryItems();
    return { success: true, data: items, error: null, message: null };
  },

  async getById(id: string): Promise<ApiResponse<LibraryItem | null>> {
    await delay(150);
    const items = storage.getLibraryItems();
    const item = items.find(i => i.id === id) ?? null;
    
    if (!item) {
      return { success: false, data: null, error: 'Elemento no encontrado', message: null };
    }
    
    return { success: true, data: item, error: null, message: null };
  },

  async create(data: CreateLibraryItemData): Promise<ApiResponse<LibraryItem>> {
    await delay(400);
    
    // Simulate file upload by creating a blob URL
    let url = '';
    if (data.file) {
      url = URL.createObjectURL(data.file);
    }
    
    const newItem: LibraryItem = {
      id: storage.generateId('lib'),
      name: data.name,
      type: data.type,
      url,
      description: data.description,
      keywords: data.keywords,
      size: data.file?.size ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.addLibraryItem(newItem);
    return { success: true, data: newItem, error: null, message: 'Contenido añadido' };
  },

  async update(id: string, updates: Partial<LibraryItem>): Promise<ApiResponse<LibraryItem>> {
    await delay(300);
    const items = storage.getLibraryItems();
    const item = items.find(i => i.id === id);
    
    if (!item) {
      return { success: false, data: null, error: 'Elemento no encontrado', message: null };
    }
    
    const updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
    storage.updateLibraryItem(id, updates);
    
    return { success: true, data: updatedItem, error: null, message: 'Contenido actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(200);
    storage.deleteLibraryItem(id);
    return { success: true, data: null, error: null, message: 'Contenido eliminado' };
  }
};

// --- User Service ---

export const userService = {
  async getAll(): Promise<ApiResponse<User[]>> {
    try {
      console.log('[User API] Fetching users from Supabase...');

      const response = await fetch('/api/superadmin/users');
      const result = await response.json() as { success: boolean; data: User[] | null; error: string | null };

      console.log('[User API] Response:', {
        hasData: !!result.data,
        dataLength: result.data?.length,
        hasError: !result.success,
        errorMessage: result.error
      });

      if (!result.success) {
        console.error('[User API] Error fetching:', result.error);
        return {
          success: false,
          data: null,
          error: result.error ?? 'Error desconocido',
          message: null
        };
      }

      return { success: true, data: result.data ?? [], error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[User API] Exception:', message, error);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async getById(id: string): Promise<ApiResponse<User | null>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { success: false, data: null, error: 'Usuario no encontrado', message: null };
      }

      return { success: true, data, error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[User API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async create(data: CreateUserData): Promise<ApiResponse<User>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          data: null,
          error: 'Email ya registrado',
          message: 'Ya existe un usuario con este email'
        };
      }

      // Get business name if businessId is provided
      let businessName: string | null = null;
      if (data.businessId) {
        const { data: business } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', data.businessId)
          .single();
        businessName = business?.name ?? null;
      }

      const newUser = {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        username: data.username,
        role: data.role,
        status: data.status,
        businessId: data.businessId ?? null,
        businessName,
        phone: data.phone ?? null,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      };

      const { data: inserted, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) {
        console.error('[User API] Error creating:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: inserted, error: null, message: 'Usuario creado exitosamente' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[User API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async update(id: string, updates: UpdateUserData): Promise<ApiResponse<User>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      // Get business name if businessId is being updated
      let businessName: string | null = null;
      if (updates.businessId !== undefined) {
        if (updates.businessId) {
          const { data: business } = await supabase
            .from('businesses')
            .select('name')
            .eq('id', updates.businessId)
            .single();
          businessName = business?.name ?? null;
        }
      }

      const { data: updated, error } = await supabase
        .from('users')
        .update({
          ...updates,
          businessName,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[User API] Error updating:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: updated, error: null, message: 'Usuario actualizado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[User API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async toggleStatus(id: string): Promise<ApiResponse<User>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      // Get current user status
      const { data: currentUser } = await supabase
        .from('users')
        .select('status')
        .eq('id', id)
        .single();

      if (!currentUser) {
        return { success: false, data: null, error: 'Usuario no encontrado', message: null };
      }

      const newStatus = currentUser.status === 'active' ? 'inactive' : 'active';

      const { data: updated, error } = await supabase
        .from('users')
        .update({
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[User API] Error toggling status:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: updated, error: null, message: `Usuario ${newStatus === 'active' ? 'activado' : 'inactivado'}` };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[User API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[User API] Error deleting:', error);
        return { success: false, data: null, error: error.message, message: null };
      }

      return { success: true, data: null, error: null, message: 'Usuario eliminado' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[User API] Error:', message);
      return { success: false, data: null, error: message, message: null };
    }
  }
};

// Re-export integrationService
export { integrationService };

// --- Plan Service ---