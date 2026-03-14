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
    await delay(300);
    const businesses = storage.getBusinesses();
    return { success: true, data: businesses, error: null, message: null };
  },

  async getById(id: string): Promise<ApiResponse<Business | null>> {
    await delay(200);
    const businesses = storage.getBusinesses();
    const business = businesses.find(b => b.id === id) ?? null;
    
    if (!business) {
      return { success: false, data: null, error: 'Negocio no encontrado', message: null };
    }
    
    return { success: true, data: business, error: null, message: null };
  },

  async create(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Business>> {
    await delay(500);
    
    const newBusiness: Business = {
      ...data,
      id: storage.generateId('biz'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.addBusiness(newBusiness);
    return { success: true, data: newBusiness, error: null, message: 'Negocio creado exitosamente' };
  },

  async update(id: string, updates: Partial<Business>): Promise<ApiResponse<Business>> {
    await delay(400);
    
    const businesses = storage.getBusinesses();
    const business = businesses.find(b => b.id === id);
    
    if (!business) {
      return { success: false, data: null, error: 'Negocio no encontrado', message: null };
    }
    
    const updatedBusiness = { ...business, ...updates, updatedAt: new Date().toISOString() };
    storage.updateBusiness(id, updates);
    
    return { success: true, data: updatedBusiness, error: null, message: 'Negocio actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300);
    storage.deleteBusiness(id);
    return { success: true, data: null, error: null, message: 'Negocio eliminado' };
  }
};

// --- System Service ---

export const systemService = {
  async getAll(): Promise<ApiResponse<SystemService[]>> {
    await delay(300);
    const services = storage.getServices();
    return { success: true, data: services, error: null, message: null };
  },

  async create(data: CreateServiceData): Promise<ApiResponse<SystemService>> {
    await delay(400);
    
    const newService: SystemService = {
      ...data,
      id: storage.generateId('srv'),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.addService(newService);
    return { success: true, data: newService, error: null, message: 'Servicio creado exitosamente' };
  },

  async update(id: string, updates: UpdateServiceData): Promise<ApiResponse<SystemService>> {
    await delay(300);
    
    const services = storage.getServices();
    const service = services.find(s => s.id === id);
    
    if (!service) {
      return { success: false, data: null, error: 'Servicio no encontrado', message: null };
    }
    
    const updatedService = { ...service, ...updates, updatedAt: new Date().toISOString() };
    storage.updateService(id, updates);
    
    return { success: true, data: updatedService, error: null, message: 'Servicio actualizado' };
  },

  async toggleStatus(id: string): Promise<ApiResponse<SystemService>> {
    await delay(200);
    
    const services = storage.getServices();
    const service = services.find(s => s.id === id);
    
    if (!service) {
      return { success: false, data: null, error: 'Servicio no encontrado', message: null };
    }
    
    const newStatus: ServiceStatus = service.status === 'active' ? 'inactive' : 'active';
    storage.updateService(id, { status: newStatus });
    
    return { 
      success: true, 
      data: { ...service, status: newStatus }, 
      error: null, 
      message: `Servicio ${newStatus === 'active' ? 'activado' : 'desactivado'}` 
    };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300);
    storage.deleteService(id);
    return { success: true, data: null, error: null, message: 'Servicio eliminado' };
  },

  async clearAll(): Promise<ApiResponse<null>> {
    await delay(200);
    storage.setServices([]);
    return { success: true, data: null, error: null, message: 'Todos los servicios eliminados' };
  }
};

// --- Module Service ---

export const moduleService = {
  async getAll(): Promise<ApiResponse<Module[]>> {
    await delay(300);
    const modules = storage.getModules();
    return { success: true, data: modules, error: null, message: null };
  },

  async create(data: CreateModuleData): Promise<ApiResponse<Module>> {
    await delay(400);
    
    const newModule: Module = {
      ...data,
      id: storage.generateId('mod'),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.addModule(newModule);
    return { success: true, data: newModule, error: null, message: 'Módulo creado exitosamente' };
  },

  async update(id: string, updates: UpdateModuleData): Promise<ApiResponse<Module>> {
    await delay(300);
    
    const modules = storage.getModules();
    const moduleItem = modules.find(m => m.id === id);
    
    if (!moduleItem) {
      return { success: false, data: null, error: 'Módulo no encontrado', message: null };
    }
    
    const updatedModule = { ...moduleItem, ...updates, updatedAt: new Date().toISOString() };
    storage.updateModule(id, updates);
    
    return { success: true, data: updatedModule, error: null, message: 'Módulo actualizado' };
  },

  async toggleStatus(id: string): Promise<ApiResponse<Module>> {
    await delay(200);
    
    const modules = storage.getModules();
    const moduleItem = modules.find(m => m.id === id);
    
    if (!moduleItem) {
      return { success: false, data: null, error: 'Módulo no encontrado', message: null };
    }
    
    // Core modules cannot be deactivated
    if (moduleItem.type === 'core') {
      return { 
        success: false, 
        data: null, 
        error: 'No se puede desactivar', 
        message: 'Los módulos core no pueden ser desactivados' 
      };
    }
    
    const newStatus: ModuleStatus = moduleItem.status === 'active' ? 'inactive' : 'active';
    storage.updateModule(id, { status: newStatus });
    
    return { 
      success: true, 
      data: { ...moduleItem, status: newStatus }, 
      error: null, 
      message: `Módulo ${newStatus === 'active' ? 'activado' : 'desactivado'}` 
    };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300);
    
    const modules = storage.getModules();
    const moduleItem = modules.find(m => m.id === id);
    
    if (moduleItem?.type === 'core') {
      return { 
        success: false, 
        data: null, 
        error: 'No se puede eliminar', 
        message: 'Los módulos core no pueden ser eliminados' 
      };
    }
    
    storage.deleteModule(id);
    return { success: true, data: null, error: null, message: 'Módulo eliminado' };
  },

  async clearAll(): Promise<ApiResponse<null>> {
    await delay(200);
    // Keep core modules
    const modules = storage.getModules();
    const coreModules = modules.filter(m => m.type === 'core');
    storage.setModules(coreModules);
    return { success: true, data: null, error: null, message: 'Módulos addon eliminados' };
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
    await delay(200);
    const config = storage.getPaymentConfig();
    return { success: true, data: config, error: null, message: null };
  },

  async update(config: GlobalPaymentConfig): Promise<ApiResponse<GlobalPaymentConfig>> {
    await delay(400);
    storage.setPaymentConfig(config);
    return { success: true, data: config, error: null, message: 'Configuración guardada' };
  }
};

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
    await delay(300);
    const users = storage.getUsers();
    return { success: true, data: users, error: null, message: null };
  },

  async getById(id: string): Promise<ApiResponse<User | null>> {
    await delay(200);
    const user = storage.getUserById(id);
    
    if (!user) {
      return { success: false, data: null, error: 'Usuario no encontrado', message: null };
    }
    
    return { success: true, data: user, error: null, message: null };
  },

  async create(data: CreateUserData): Promise<ApiResponse<User>> {
    await delay(400);
    
    // Check if email already exists
    const existingUser = storage.getUserByEmail(data.email);
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
      const businesses = storage.getBusinesses();
      const business = businesses.find(b => b.id === data.businessId);
      businessName = business?.name ?? null;
    }
    
    const newUser: User = {
      id: storage.generateId('user'),
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
    
    storage.addUser(newUser);
    return { success: true, data: newUser, error: null, message: 'Usuario creado exitosamente' };
  },

  async update(id: string, updates: UpdateUserData): Promise<ApiResponse<User>> {
    await delay(300);
    
    const user = storage.getUserById(id);
    if (!user) {
      return { success: false, data: null, error: 'Usuario no encontrado', message: null };
    }
    
    // Get business name if businessId is being updated
    let businessName = user.businessName;
    if (updates.businessId !== undefined) {
      if (updates.businessId) {
        const businesses = storage.getBusinesses();
        const business = businesses.find(b => b.id === updates.businessId);
        businessName = business?.name ?? null;
      } else {
        businessName = null;
      }
    }
    
    const updatedUser = { 
      ...user, 
      ...updates, 
      businessName,
      updatedAt: new Date().toISOString() 
    };
    storage.updateUser(id, { ...updates, businessName });
    
    return { success: true, data: updatedUser, error: null, message: 'Usuario actualizado' };
  },

  async toggleStatus(id: string): Promise<ApiResponse<User>> {
    await delay(200);
    
    const user = storage.getUserById(id);
    if (!user) {
      return { success: false, data: null, error: 'Usuario no encontrado', message: null };
    }
    
    // Prevent deactivating super admin
    if (user.role === 'super_admin') {
      return { 
        success: false, 
        data: null, 
        error: 'No autorizado', 
        message: 'No se puede desactivar al Super Admin' 
      };
    }
    
    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    storage.updateUser(id, { status: newStatus });
    
    return { 
      success: true, 
      data: { ...user, status: newStatus }, 
      error: null, 
      message: `Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'}` 
    };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300);
    
    const user = storage.getUserById(id);
    if (!user) {
      return { success: false, data: null, error: 'Usuario no encontrado', message: null };
    }
    
    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return { 
        success: false, 
        data: null, 
        error: 'No autorizado', 
        message: 'No se puede eliminar al Super Admin' 
      };
    }
    
    storage.deleteUser(id);
    return { success: true, data: null, error: null, message: 'Usuario eliminado' };
  },

  async updateRole(id: string, role: User['role']): Promise<ApiResponse<User>> {
    await delay(200);
    
    const user = storage.getUserById(id);
    if (!user) {
      return { success: false, data: null, error: 'Usuario no encontrado', message: null };
    }
    
    // Prevent changing super admin role
    if (user.role === 'super_admin') {
      return { 
        success: false, 
        data: null, 
        error: 'No autorizado', 
        message: 'No se puede cambiar el rol del Super Admin' 
      };
    }
    
    storage.updateUser(id, { role });
    
    return { 
      success: true, 
      data: { ...user, role }, 
      error: null, 
      message: 'Rol actualizado' 
    };
  }
};
