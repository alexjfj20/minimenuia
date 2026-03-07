// =============================================
// MINIMENU - Storage Utility for Mock Data
// =============================================

import type { 
  Business, 
  SystemService, 
  Module, 
  LandingPlan,
  User,
  GlobalPaymentConfig,
  AIConfig,
  LibraryItem
} from '@/types';

import {
  mockBusinesses,
  mockServices,
  mockModules,
  mockPlans,
  mockUsers,
  mockPaymentConfig,
  mockAIConfig,
  mockLibraryItems
} from './data';

// --- Storage Keys ---

const STORAGE_KEYS = {
  BUSINESSES: 'minimenu_businesses',
  SERVICES: 'minimenu_services',
  MODULES: 'minimenu_modules',
  PLANS: 'minimenu_plans',
  USER: 'minimenu_user',
  USERS: 'minimenu_users',
  PAYMENT_CONFIG: 'minimenu_payment_config',
  AI_CONFIG: 'minimenu_ai_config',
  LIBRARY_ITEMS: 'minimenu_library_items'
} as const;

// --- Helper Functions ---

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Business Storage ---

export function getBusinesses(): Business[] {
  return getFromStorage<Business[]>(STORAGE_KEYS.BUSINESSES, mockBusinesses);
}

export function setBusinesses(businesses: Business[]): void {
  setToStorage(STORAGE_KEYS.BUSINESSES, businesses);
}

export function addBusiness(business: Business): void {
  const businesses = getBusinesses();
  businesses.push(business);
  setBusinesses(businesses);
}

export function updateBusiness(id: string, updates: Partial<Business>): void {
  const businesses = getBusinesses();
  const index = businesses.findIndex(b => b.id === id);
  if (index !== -1) {
    businesses[index] = { ...businesses[index], ...updates, updatedAt: new Date().toISOString() };
    setBusinesses(businesses);
  }
}

export function deleteBusiness(id: string): void {
  const businesses = getBusinesses().filter(b => b.id !== id);
  setBusinesses(businesses);
}

// --- Service Storage ---

export function getServices(): SystemService[] {
  return getFromStorage<SystemService[]>(STORAGE_KEYS.SERVICES, mockServices);
}

export function setServices(services: SystemService[]): void {
  setToStorage(STORAGE_KEYS.SERVICES, services);
}

export function addService(service: SystemService): void {
  const services = getServices();
  services.push(service);
  setServices(services);
}

export function updateService(id: string, updates: Partial<SystemService>): void {
  const services = getServices();
  const index = services.findIndex(s => s.id === id);
  if (index !== -1) {
    services[index] = { ...services[index], ...updates, updatedAt: new Date().toISOString() };
    setServices(services);
  }
}

export function deleteService(id: string): void {
  const services = getServices().filter(s => s.id !== id);
  setServices(services);
}

// --- Module Storage ---

export function getModules(): Module[] {
  return getFromStorage<Module[]>(STORAGE_KEYS.MODULES, mockModules);
}

export function setModules(modules: Module[]): void {
  setToStorage(STORAGE_KEYS.MODULES, modules);
}

export function addModule(module: Module): void {
  const modules = getModules();
  modules.push(module);
  setModules(modules);
}

export function updateModule(id: string, updates: Partial<Module>): void {
  const modules = getModules();
  const index = modules.findIndex(m => m.id === id);
  if (index !== -1) {
    modules[index] = { ...modules[index], ...updates, updatedAt: new Date().toISOString() };
    setModules(modules);
  }
}

export function deleteModule(id: string): void {
  const modules = getModules().filter(m => m.id !== id);
  setModules(modules);
}

// --- Plan Storage ---

export function getPlans(): LandingPlan[] {
  return getFromStorage<LandingPlan[]>(STORAGE_KEYS.PLANS, mockPlans);
}

export function setPlans(plans: LandingPlan[]): void {
  setToStorage(STORAGE_KEYS.PLANS, plans);
}

export function addPlan(plan: LandingPlan): void {
  const plans = getPlans();
  plans.push(plan);
  setPlans(plans);
}

export function updatePlan(id: string, updates: Partial<LandingPlan>): void {
  const plans = getPlans();
  const index = plans.findIndex(p => p.id === id);
  if (index !== -1) {
    plans[index] = { ...plans[index], ...updates, updatedAt: new Date().toISOString() };
    setPlans(plans);
  }
}

export function deletePlan(id: string): void {
  const plans = getPlans().filter(p => p.id !== id);
  setPlans(plans);
}

// --- User/Auth Storage ---

export function getCurrentUser(): User | null {
  return getFromStorage<User | null>(STORAGE_KEYS.USER, null);
}

export function setCurrentUser(user: User | null): void {
  setToStorage(STORAGE_KEYS.USER, user);
}

// --- Users Management Storage ---

export function getUsers(): User[] {
  return getFromStorage<User[]>(STORAGE_KEYS.USERS, mockUsers);
}

export function setUsers(users: User[]): void {
  setToStorage(STORAGE_KEYS.USERS, users);
}

export function addUser(user: User): void {
  const users = getUsers();
  users.push(user);
  setUsers(users);
}

export function updateUser(id: string, updates: Partial<User>): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
    setUsers(users);
  }
}

export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  setUsers(users);
}

export function getUserById(id: string): User | null {
  const users = getUsers();
  return users.find(u => u.id === id) ?? null;
}

export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

// --- Payment Config Storage ---

const defaultPaymentConfig: GlobalPaymentConfig = {
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

export function getPaymentConfig(): GlobalPaymentConfig {
  const stored = getFromStorage<GlobalPaymentConfig>(STORAGE_KEYS.PAYMENT_CONFIG, mockPaymentConfig);
  // Merge with defaults to ensure all properties exist (handles migration)
  return {
    stripe: { ...defaultPaymentConfig.stripe, ...stored.stripe },
    mercadoPago: { ...defaultPaymentConfig.mercadoPago, ...stored.mercadoPago },
    paypal: { ...defaultPaymentConfig.paypal, ...stored.paypal },
    nequi: { ...defaultPaymentConfig.nequi, ...stored.nequi },
    bancolombia: { ...defaultPaymentConfig.bancolombia, ...stored.bancolombia },
    daviplata: { ...defaultPaymentConfig.daviplata, ...stored.daviplata },
    breB: { ...defaultPaymentConfig.breB, ...(stored as Record<string, unknown>).breB as typeof defaultPaymentConfig.breB },
    hotmart: { ...defaultPaymentConfig.hotmart, ...stored.hotmart }
  };
}

export function setPaymentConfig(config: GlobalPaymentConfig): void {
  setToStorage(STORAGE_KEYS.PAYMENT_CONFIG, config);
}

// --- AI Config Storage ---

export function getAIConfig(): AIConfig {
  const stored = getFromStorage<AIConfig>(STORAGE_KEYS.AI_CONFIG, mockAIConfig);
  // Merge with defaults to ensure all properties exist
  return {
    ...mockAIConfig,
    ...stored,
    models: stored.models ?? []
  };
}

export function setAIConfig(config: AIConfig): void {
  setToStorage(STORAGE_KEYS.AI_CONFIG, config);
}

// --- Library Items Storage ---

export function getLibraryItems(): LibraryItem[] {
  return getFromStorage<LibraryItem[]>(STORAGE_KEYS.LIBRARY_ITEMS, mockLibraryItems);
}

export function setLibraryItems(items: LibraryItem[]): void {
  setToStorage(STORAGE_KEYS.LIBRARY_ITEMS, items);
}

export function addLibraryItem(item: LibraryItem): void {
  const items = getLibraryItems();
  items.push(item);
  setLibraryItems(items);
}

export function updateLibraryItem(id: string, updates: Partial<LibraryItem>): void {
  const items = getLibraryItems();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    setLibraryItems(items);
  }
}

export function deleteLibraryItem(id: string): void {
  const items = getLibraryItems().filter(i => i.id !== id);
  setLibraryItems(items);
}

// --- Reset Functions ---

export function resetAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.BUSINESSES);
  localStorage.removeItem(STORAGE_KEYS.SERVICES);
  localStorage.removeItem(STORAGE_KEYS.MODULES);
  localStorage.removeItem(STORAGE_KEYS.PLANS);
  localStorage.removeItem(STORAGE_KEYS.PAYMENT_CONFIG);
}

export function resetServices(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SERVICES);
}

export function resetModules(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.MODULES);
}

// --- ID Generation ---

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
