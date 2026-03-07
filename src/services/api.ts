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
    await delay(300);
    const plans = storage.getPlans();
    return { success: true, data: plans, error: null, message: null };
  },

  async getById(id: string): Promise<ApiResponse<LandingPlan | null>> {
    await delay(200);
    const plans = storage.getPlans();
    const plan = plans.find(p => p.id === id) ?? null;
    
    if (!plan) {
      return { success: false, data: null, error: 'Plan no encontrado', message: null };
    }
    
    return { success: true, data: plan, error: null, message: null };
  },

  async create(data: CreatePlanData): Promise<ApiResponse<LandingPlan>> {
    await delay(400);
    
    const newPlan: LandingPlan = {
      ...data,
      id: storage.generateId('plan'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.addPlan(newPlan);
    return { success: true, data: newPlan, error: null, message: 'Plan creado exitosamente' };
  },

  async update(id: string, updates: UpdatePlanData): Promise<ApiResponse<LandingPlan>> {
    await delay(300);
    
    const plans = storage.getPlans();
    const plan = plans.find(p => p.id === id);
    
    if (!plan) {
      return { success: false, data: null, error: 'Plan no encontrado', message: null };
    }
    
    const updatedPlan = { ...plan, ...updates, updatedAt: new Date().toISOString() };
    storage.updatePlan(id, updates);
    
    return { success: true, data: updatedPlan, error: null, message: 'Plan actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300);
    storage.deletePlan(id);
    return { success: true, data: null, error: null, message: 'Plan eliminado' };
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
