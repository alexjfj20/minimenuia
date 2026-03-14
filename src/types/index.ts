// =============================================
// MINIMENU - Type Definitions (Strict TypeScript)
// =============================================

// --- Utility Types ---

export type EntityStatus = 'active' | 'inactive' | 'suspended' | 'pending_payment';
export type BillingType = 'monthly' | 'one_time' | 'yearly' | 'lifetime';
export type Currency = 'COP' | 'USD';
export type ModuleType = 'core' | 'addon';

// --- Entity Status Types ---
export type ServiceStatus = 'active' | 'inactive';
export type ModuleStatus = 'active' | 'inactive';
export type PlanStatus = 'active' | 'inactive';
export type IntegrationStatus = 'active' | 'inactive';
export type GatewayMode = 'sandbox' | 'production';

// --- User Status Types ---
export type UserStatus = 'active' | 'inactive' | 'pending';
export type UserRole = 'super_admin' | 'admin' | 'employee' | 'messenger';

// --- User & Auth ---

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  businessId: string | null;
  businessName: string | null;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  businessName: string;
  phone: string;
}

// --- Business Entity ---

export interface Business {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  planId: string;
  planName: string;
  status: EntityStatus;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  slug: string;
}

// --- System Service ---

export interface SystemService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  billingType: BillingType;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  currency: Currency;
  billingType: BillingType;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  currency?: Currency;
  billingType?: BillingType;
  status?: ServiceStatus;
}

// --- Module ---

export interface Module {
  id: string;
  name: string;
  description: string;
  type: ModuleType;
  icon: string;
  status: ModuleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleData {
  name: string;
  description: string;
  type: ModuleType;
  icon: string;
}

export interface UpdateModuleData {
  name?: string;
  description?: string;
  type?: ModuleType;
  icon?: string;
  status?: ModuleStatus;
}

// --- Plan ---

export interface LandingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: Currency;
  period: BillingType;
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
  order: number;
  icon: string;
  color: string;
  maxUsers: number;
  maxProducts: number;
  maxCategories: number;
  hotmartUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanData {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: Currency;
  period: BillingType;
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
  order: number;
  icon: string;
  color: string;
  maxUsers: number;
  maxProducts: number;
  maxCategories: number;
}

export interface UpdatePlanData {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: Currency;
  period?: BillingType;
  features?: string[];
  isActive?: boolean;
  isPublic?: boolean;
  isPopular?: boolean;
  order?: number;
  icon?: string;
  color?: string;
  maxUsers?: number;
  maxProducts?: number;
  maxCategories?: number;
}

// --- Integration ---

export interface Integration {
  id: string;
  name: string;
  description: string;
  iconSvg: string;
  status: IntegrationStatus;
  requiresManualSetup: boolean;
  setupInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Payment Gateway Configuration ---

export interface ApiGatewaySettings {
  enabled: boolean;
  mode: GatewayMode;
  publicKey: string;
  secretKey: string;
  instructions: string;
}

export interface ManualGatewaySettings {
  enabled: boolean;
  accountHolder: string;
  accountNumber: string;
  instructions: string;
  qrCodeUrl: string | null;
}

export interface HotmartSettings {
  enabled: boolean;
  instructions: string;
}

export interface GlobalPaymentConfig {
  stripe: ApiGatewaySettings;
  mercadoPago: ApiGatewaySettings;
  paypal: ApiGatewaySettings;
  nequi: ManualGatewaySettings;
  bancolombia: ManualGatewaySettings;
  daviplata: ManualGatewaySettings;
  breB: ManualGatewaySettings;
  hotmart: HotmartSettings;
}

// --- Business Assigned Services/Modules ---

export interface BusinessService {
  id: string;
  businessId: string;
  serviceId: string;
  serviceName: string;
  assignedAt: string;
  status: EntityStatus;
}

export interface BusinessModule {
  id: string;
  businessId: string;
  moduleId: string;
  moduleName: string;
  assignedAt: string;
  status: EntityStatus;
}

// --- Product & Menu (Business Admin) ---

export interface Category {
  id: string;
  businessId: string;
  name: string;
  description: string;
  icon: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  image: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  businessId: string;
  name: string;
  description: string;
  categories: string[];
  isActive: boolean;
  qrCode: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// --- Order ---

export interface Order {
  id: string;
  businessId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  items: OrderItem[];
  total: number;
  currency: Currency;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

// --- UI State Types ---

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface TabContent {
  title: string;
  description: string;
}

// --- API Response Types ---

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- Filter Types ---

export interface BusinessFilters {
  search: string;
  planId: string | null;
  status: EntityStatus | null;
}

export interface ServiceFilters {
  search: string;
  status: ServiceStatus | null;
  billingType: BillingType | null;
}

export interface ModuleFilters {
  search: string;
  status: ModuleStatus | null;
  type: ModuleType | null;
}

// --- AI Configuration Types ---

export type AIProvider = 'Google Gemini' | 'OpenAI GPT' | 'Groq' | 'Custom API';

export interface AIModelConfig {
  id: string;
  provider: AIProvider;
  name: string;
  model: string;
  active: boolean;
  apiKey: string;
  baseUrl: string | null;
  authType: 'bearer' | 'header' | 'none';
  createdAt: string;
  updatedAt: string;
}

export interface AIConfig {
  systemPrompt: string;
  models: AIModelConfig[];
  temperature: number;
  maxTokens: number;
  knowledgeSources: string[];
  activeModelId: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  type: 'video' | 'pdf' | 'image' | 'document';
  url: string;
  description: string;
  keywords: string[];
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIMetrics {
  totalConversations: number;
  ventas: number;
  soporte: number;
  nuevos: number;
  otros: number;
}

export interface CreateLibraryItemData {
  name: string;
  type: 'video' | 'pdf' | 'image' | 'document';
  description: string;
  keywords: string[];
  file: File | null;
}

export interface CreateAIModelData {
  provider: AIProvider;
  name: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  authType?: 'bearer' | 'header' | 'none';
}

// --- User Management Types ---

export interface UserFilters {
  search: string;
  role: UserRole | null;
  status: UserStatus | null;
}

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  businessId?: string | null;
  phone?: string | null;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  role?: UserRole;
  status?: UserStatus;
  businessId?: string | null;
  phone?: string | null;
  avatar?: string | null;
}
