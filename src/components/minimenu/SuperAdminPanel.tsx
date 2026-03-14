'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import type { 
  Business, 
  SystemService, 
  Module, 
  LandingPlan,
  EntityStatus,
  BillingType,
  Currency,
  ModuleType,
  GlobalPaymentConfig,
  GatewayMode,
  AIConfig,
  AIModelConfig,
  LibraryItem,
  AIProvider,
  CreateAIModelData,
  User,
  UserRole,
  UserStatus,
  CreateUserData
} from '@/types';
import * as api from '@/services/api';
import { 
  LayoutDashboard,
  Building2,
  Settings,
  Puzzle,
  CreditCard,
  Link2,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Pencil,
  Eye,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Utensils,
  ShoppingCart,
  Calendar,
  Star,
  QrCode,
  BarChart3,
  MessageCircle,
  Zap,
  Briefcase,
  Wallet,
  Globe,
  Shield,
  Save,
  Loader2,
  Smartphone,
  Landmark,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Bot,
  Brain,
  Database,
  PieChart,
  Cpu,
  FileText,
  Video,
  AlertTriangle,
  CheckCircle,
  Link,
  Play,
  Pause,
  Sparkles,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Key,
  Wrench,
  RefreshCw,
  HardDrive,
  Activity,
  Clock,
  Download,
  RotateCcw
} from 'lucide-react';

// --- Icon Mapping ---
const iconMap: Record<string, React.ReactNode> = {
  'utensils': <Utensils className="w-5 h-5" />,
  'shopping-bag': <ShoppingCart className="w-5 h-5" />,
  'calendar': <Calendar className="w-5 h-5" />,
  'star': <Star className="w-5 h-5" />,
  'qr-code': <QrCode className="w-5 h-5" />,
  'bar-chart-3': <BarChart3 className="w-5 h-5" />,
  'message-circle': <MessageCircle className="w-5 h-5" />,
  'zap': <Zap className="w-5 h-5" />,
  'briefcase': <Briefcase className="w-5 h-5" />,
  'building-2': <Building2 className="w-5 h-5" />
};

type TabType = 'dashboard' | 'negocios' | 'usuarios' | 'servicios' | 'modulos' | 'planes' | 'pagos' | 'chatbot' | 'integraciones' | 'mantenimiento';

interface SuperAdminPanelProps {
  onLogout: () => void;
  onImpersonate?: (business: Business) => void;
}

export function SuperAdminPanel({ onLogout, onImpersonate }: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // --- Data State ---
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<SystemService[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [plans, setPlans] = useState<LandingPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // --- Filter State ---
  const [searchBusiness, setSearchBusiness] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // --- Modal State ---
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [assignedModules, setAssignedModules] = useState<string[]>([]);
  const [assignedServices, setAssignedServices] = useState<string[]>([]);
  
  // --- User Modal State ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDeleteConfirm, setShowUserDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // --- User Filter State ---
  const [searchUser, setSearchUser] = useState('');
  const [filterUserRole, setFilterUserRole] = useState<string>('all');
  const [filterUserStatus, setFilterUserStatus] = useState<string>('all');
  
  // --- Edit State ---
  const [editingService, setEditingService] = useState<SystemService | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingPlan, setEditingPlan] = useState<LandingPlan | null>(null);
  
  // --- Form State ---
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'COP' as Currency,
    billingType: 'monthly' as BillingType
  });
  
  const [moduleForm, setModuleForm] = useState({
    name: '',
    description: '',
    type: 'addon' as ModuleType,
    icon: 'zap'
  });
  
  const [planForm, setPlanForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    currency: 'COP' as Currency,
    period: 'monthly' as BillingType,
    features: '',
    maxUsers: 1,
    maxProducts: 50,
    maxCategories: 5,
    isPopular: false,
    color: '#8b5cf6'
  });

  const [businessForm, setBusinessForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    address: '',
    planId: '',
    status: 'active' as EntityStatus
  });
  
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    role: 'admin' as User['role'],
    status: 'active' as User['status'],
    businessId: '',
    phone: ''
  });

  // --- Payment Config State ---
  const [paymentConfig, setPaymentConfig] = useState<GlobalPaymentConfig | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [hasPaymentChanges, setHasPaymentChanges] = useState(false);
  const [planHotmartUrls, setPlanHotmartUrls] = useState<Record<string, string>>({});

  // --- AI Config State ---
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [hasAiChanges, setHasAiChanges] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [newKnowledgeUrl, setNewKnowledgeUrl] = useState('');
  const [showAiModelModal, setShowAiModelModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | null>(null);
  const [editingLibraryItem, setEditingLibraryItem] = useState<LibraryItem | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiModelForm, setAiModelForm] = useState<CreateAIModelData>({
    provider: 'Google Gemini',
    name: '',
    model: '',
    apiKey: '',
    baseUrl: '',
    authType: 'bearer'
  });
  const [libraryForm, setLibraryForm] = useState({
    name: '',
    type: 'pdf' as 'video' | 'pdf' | 'image' | 'document',
    description: '',
    keywords: '',
    file: null as File | null
  });

  // --- Load Data ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bizRes, srvRes, modRes, planRes, userRes] = await Promise.all([
        api.businessService.getAll(),
        api.systemService.getAll(),
        api.moduleService.getAll(),
        api.planService.getAll(),
        api.userService.getAll()
      ]);
      
      if (bizRes.success && bizRes.data) setBusinesses(bizRes.data);
      if (srvRes.success && srvRes.data) setServices(srvRes.data);
      if (modRes.success && modRes.data) setModules(modRes.data);
      if (planRes.success && planRes.data) setPlans(planRes.data);
      if (userRes.success && userRes.data) setUsers(userRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Load Payment Config ---
  const loadPaymentConfig = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const response = await api.paymentConfigService.get();
      if (response.success && response.data) {
        setPaymentConfig(response.data);
        // Initialize plan hotmart URLs from plans
        const urls: Record<string, string> = {};
        plans.forEach(plan => {
          if (plan.hotmartUrl) {
            urls[plan.id] = plan.hotmartUrl;
          }
        });
        setPlanHotmartUrls(urls);
        setHasPaymentChanges(false);
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
    } finally {
      setPaymentLoading(false);
    }
  }, [plans]);

  useEffect(() => {
    if (plans.length > 0 && !paymentConfig) {
      loadPaymentConfig();
    }
  }, [plans, paymentConfig, loadPaymentConfig]);

  // --- Payment Config Handlers ---
  const updateApiGateway = (
    gateway: 'stripe' | 'mercadoPago' | 'paypal',
    field: string,
    value: string | boolean | GatewayMode
  ) => {
    if (!paymentConfig) return;
    setPaymentConfig(prev => prev ? {
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [field]: value
      }
    } : null);
    setHasPaymentChanges(true);
  };

  const updateManualGateway = (
    gateway: 'nequi' | 'bancolombia' | 'daviplata' | 'breB',
    field: string,
    value: string | boolean
  ) => {
    if (!paymentConfig) return;
    setPaymentConfig(prev => prev ? {
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [field]: value
      }
    } : null);
    setHasPaymentChanges(true);
  };

  const handleQrCodeUpload = (
    gateway: 'nequi' | 'bancolombia' | 'daviplata' | 'breB',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateManualGateway(gateway, 'qrCodeUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  const removeQrCode = (gateway: 'nequi' | 'bancolombia' | 'daviplata' | 'breB') => {
    updateManualGateway(gateway, 'qrCodeUrl', '');
  };

  const updateHotmartSettings = (field: string, value: string | boolean) => {
    if (!paymentConfig) return;
    setPaymentConfig(prev => prev ? {
      ...prev,
      hotmart: {
        ...prev.hotmart,
        [field]: value
      }
    } : null);
    setHasPaymentChanges(true);
  };

  const updatePlanHotmartUrl = (planId: string, url: string) => {
    setPlanHotmartUrls(prev => ({
      ...prev,
      [planId]: url
    }));
    setHasPaymentChanges(true);
  };

  const handleSavePaymentConfig = async () => {
    if (!paymentConfig) return;
    setPaymentSaving(true);
    try {
      // Save global payment config
      await api.paymentConfigService.update(paymentConfig);
      
      // Update plans with hotmart URLs
      for (const [planId, url] of Object.entries(planHotmartUrls)) {
        await api.planService.update(planId, { hotmartUrl: url || null });
      }
      
      setHasPaymentChanges(false);
    } catch (error) {
      console.error('Error saving payment config:', error);
    } finally {
      setPaymentSaving(false);
    }
  };

  // --- Load AI Config ---
  const loadAIConfig = useCallback(async () => {
    setAiLoading(true);
    try {
      const [aiRes, libRes] = await Promise.all([
        api.aiConfigService.get(),
        api.libraryService.getAll()
      ]);
      
      if (aiRes.success && aiRes.data) {
        setAiConfig(aiRes.data);
      }
      if (libRes.success && libRes.data) {
        setLibraryItems(libRes.data);
      }
      setHasAiChanges(false);
    } catch (error) {
      console.error('Error loading AI config:', error);
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!aiConfig && !aiLoading) {
      loadAIConfig();
    }
  }, [aiConfig, aiLoading, loadAIConfig]);

  // --- AI Config Handlers ---
  const updateAiConfig = (field: string, value: string | number) => {
    if (!aiConfig) return;
    setAiConfig(prev => prev ? { ...prev, [field]: value } : null);
    setHasAiChanges(true);
  };

  const handleSaveAIConfig = async () => {
    if (!aiConfig) return;
    setAiSaving(true);
    try {
      await api.aiConfigService.update(aiConfig);
      setHasAiChanges(false);
    } catch (error) {
      console.error('Error saving AI config:', error);
    } finally {
      setAiSaving(false);
    }
  };

  const handleAddKnowledgeSource = async () => {
    if (!newKnowledgeUrl.trim()) return;
    
    const response = await api.aiConfigService.addKnowledgeSource(newKnowledgeUrl.trim());
    if (response.success && response.data && aiConfig) {
      setAiConfig(prev => prev ? { ...prev, knowledgeSources: response.data! } : null);
      setNewKnowledgeUrl('');
      setHasAiChanges(true);
    }
  };

  const handleRemoveKnowledgeSource = async (url: string) => {
    const response = await api.aiConfigService.removeKnowledgeSource(url);
    if (response.success && response.data && aiConfig) {
      setAiConfig(prev => prev ? { ...prev, knowledgeSources: response.data! } : null);
      setHasAiChanges(true);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    
    const response = await api.aiConfigService.testConnection(aiModelForm);
    setConnectionTestResult(response.data ?? { success: false, message: 'Error desconocido' });
    setTestingConnection(false);
  };

  const handleSaveAIModel = async () => {
    if (!aiModelForm.apiKey || !aiModelForm.model) return;
    
    if (editingModel) {
      const response = await api.aiConfigService.updateModel(editingModel.id, aiModelForm);
      if (response.success && response.data && aiConfig) {
        setAiConfig(prev => prev ? {
          ...prev,
          models: prev.models.map(m => m.id === editingModel.id ? response.data! : m)
        } : null);
      }
    } else {
      const response = await api.aiConfigService.addModel(aiModelForm);
      if (response.success && response.data && aiConfig) {
        setAiConfig(prev => prev ? {
          ...prev,
          models: [...prev.models, response.data!]
        } : null);
      }
    }
    
    setShowAiModelModal(false);
    resetAiModelForm();
  };

  const handleDeleteModel = async (id: string) => {
    const response = await api.aiConfigService.deleteModel(id);
    if (response.success && aiConfig) {
      setAiConfig(prev => prev ? {
        ...prev,
        models: prev.models.filter(m => m.id !== id),
        activeModelId: prev.activeModelId === id ? null : prev.activeModelId
      } : null);
    }
  };

  const handleSetActiveModel = async (id: string) => {
    const response = await api.aiConfigService.setActiveModel(id);
    if (response.success && response.data && aiConfig) {
      setAiConfig(prev => prev ? {
        ...prev,
        models: prev.models.map(m => ({ ...m, active: m.id === id })),
        activeModelId: id
      } : null);
    }
  };

  const resetAiModelForm = () => {
    setAiModelForm({
      provider: 'Google Gemini',
      name: '',
      model: '',
      apiKey: '',
      baseUrl: '',
      authType: 'bearer'
    });
    setEditingModel(null);
    setConnectionTestResult(null);
  };

  const openEditModel = (model: AIModelConfig) => {
    setEditingModel(model);
    setAiModelForm({
      provider: model.provider,
      name: model.name,
      model: model.model,
      apiKey: model.apiKey,
      baseUrl: model.baseUrl ?? '',
      authType: model.authType
    });
    setShowAiModelModal(true);
  };

  // --- Library Handlers ---
  const handleSaveLibraryItem = async () => {
    if (!libraryForm.name || !libraryForm.file) return;
    
    const response = await api.libraryService.create({
      name: libraryForm.name,
      type: libraryForm.type,
      description: libraryForm.description,
      keywords: libraryForm.keywords.split(',').map(k => k.trim()).filter(k => k),
      file: libraryForm.file
    });
    
    if (response.success && response.data) {
      setLibraryItems(prev => [...prev, response.data!]);
    }
    
    setShowLibraryModal(false);
    resetLibraryForm();
  };

  const handleDeleteLibraryItem = async (id: string) => {
    await api.libraryService.delete(id);
    setLibraryItems(prev => prev.filter(i => i.id !== id));
  };

  const resetLibraryForm = () => {
    setLibraryForm({
      name: '',
      type: 'pdf',
      description: '',
      keywords: '',
      file: null
    });
    setEditingLibraryItem(null);
  };

  const handleLibraryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const typeMap: Record<string, 'video' | 'pdf' | 'image' | 'document'> = {
      'application/pdf': 'pdf',
      'video/': 'video',
      'image/': 'image'
    };
    
    let type: 'video' | 'pdf' | 'image' | 'document' = 'document';
    for (const [key, value] of Object.entries(typeMap)) {
      if (file.type.startsWith(key) || file.type === key) {
        type = value;
        break;
      }
    }
    
    setLibraryForm(prev => ({ ...prev, file, type }));
  };

  // --- Handlers ---
  const handleToggleService = async (id: string) => {
    const response = await api.systemService.toggleStatus(id);
    if (response.success && response.data) {
      setServices(prev => prev.map(s => s.id === id ? response.data! : s));
    }
  };

  const handleToggleModule = async (id: string) => {
    const response = await api.moduleService.toggleStatus(id);
    if (response.success && response.data) {
      setModules(prev => prev.map(m => m.id === id ? response.data! : m));
    }
  };

  const handleSaveService = async () => {
    if (editingService) {
      const response = await api.systemService.update(editingService.id, serviceForm);
      if (response.success && response.data) {
        setServices(prev => prev.map(s => s.id === editingService.id ? response.data! : s));
      }
    } else {
      const response = await api.systemService.create(serviceForm);
      if (response.success && response.data) {
        setServices(prev => [...prev, response.data!]);
      }
    }
    setShowServiceModal(false);
    resetServiceForm();
  };

  const handleSaveModule = async () => {
    if (editingModule) {
      const response = await api.moduleService.update(editingModule.id, moduleForm);
      if (response.success && response.data) {
        setModules(prev => prev.map(m => m.id === editingModule.id ? response.data! : m));
      }
    } else {
      const response = await api.moduleService.create(moduleForm);
      if (response.success && response.data) {
        setModules(prev => [...prev, response.data!]);
      }
    }
    setShowModuleModal(false);
    resetModuleForm();
  };

  const handleSavePlan = async () => {
    const planData = {
      ...planForm,
      features: planForm.features.split('\n').filter(f => f.trim()),
      isActive: true,
      isPublic: true,
      order: plans.length + 1,
      icon: 'zap'
    };

    if (editingPlan) {
      const response = await api.planService.update(editingPlan.id, planData);
      if (response.success && response.data) {
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? response.data! : p));
      }
    } else {
      const response = await api.planService.create(planData);
      if (response.success && response.data) {
        setPlans(prev => [...prev, response.data!]);
      }
    }
    setShowPlanModal(false);
    resetPlanForm();
  };

  const handleSaveAllPlans = async () => {
    try {
      console.log('[SuperAdmin] Saving all plans to Supabase...');
      
      // Save each plan to the database
      const savePromises = plans.map(async (plan) => {
        const planData = {
          ...plan,
          features: parseFeatures(plan.features),
          isActive: true,
          isPublic: true
        };

        // Update existing plan
        const response = await api.planService.update(plan.id, planData);
        if (!response.success) {
          console.error('[SuperAdmin] Failed to save plan:', plan.name);
        }
        return response;
      });

      await Promise.all(savePromises);
      
      console.log('[SuperAdmin] All plans saved successfully');
      alert('✅ Todos los planes se guardaron correctamente en la base de datos');
    } catch (error) {
      console.error('[SuperAdmin] Error saving plans:', error);
      alert('❌ Error al guardar los planes. Intente nuevamente.');
    }
  };

  const handleDeleteService = async (id: string) => {
    await api.systemService.delete(id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleDeleteModule = async (id: string) => {
    await api.moduleService.delete(id);
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const handleDeletePlan = async (id: string) => {
    await api.planService.delete(id);
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveBusiness = async () => {
    const selectedPlan = plans.find(p => p.id === businessForm.planId);
    const newBusiness: Business = {
      id: `biz-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: businessForm.name,
      ownerId: `user-${Date.now()}`,
      ownerName: businessForm.ownerName,
      ownerEmail: businessForm.ownerEmail,
      phone: businessForm.phone,
      address: businessForm.address,
      planId: businessForm.planId,
      planName: selectedPlan?.name ?? 'Sin plan',
      status: businessForm.status,
      logo: null,
      primaryColor: '#8b5cf6',
      secondaryColor: '#ffffff',
      slug: businessForm.name.toLowerCase().replace(/\s+/g, '-')
    };
    
    const response = await api.businessService.create(newBusiness);
    if (response.success && response.data) {
      setBusinesses(prev => [...prev, response.data!]);
    }
    setShowBusinessModal(false);
    resetBusinessForm();
  };

  const resetBusinessForm = () => {
    setBusinessForm({
      name: '',
      ownerName: '',
      ownerEmail: '',
      phone: '',
      address: '',
      planId: '',
      status: 'active'
    });
  };

  const openManageBusiness = (business: Business) => {
    setSelectedBusiness(business);
    // Inicializar módulos y servicios asignados (simulado)
    setAssignedModules(modules.filter(m => m.type === 'core').map(m => m.id));
    setAssignedServices([]);
    setShowManageModal(true);
  };

  const handleSaveManageBusiness = () => {
    // Aquí se guardarían los módulos y servicios asignados
    // Por ahora solo cerramos el modal
    setShowManageModal(false);
    setSelectedBusiness(null);
  };

  const toggleModuleAssignment = (moduleId: string) => {
    setAssignedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleServiceAssignment = (serviceId: string) => {
    setAssignedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleImpersonate = (business: Business) => {
    if (onImpersonate) {
      onImpersonate(business);
    }
  };

  // --- User Handlers ---
  const openCreateUser = () => {
    setSelectedUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      role: 'admin',
      status: 'active',
      businessId: '',
      phone: ''
    });
    setShowUserModal(true);
  };

  const openEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      businessId: user.businessId ?? '',
      phone: user.phone ?? ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.email) {
      return;
    }

    if (selectedUser) {
      const response = await api.userService.update(selectedUser.id, {
        name: userForm.name,
        username: userForm.username,
        role: userForm.role,
        status: userForm.status,
        businessId: userForm.businessId || null,
        phone: userForm.phone || null
      });
      
      if (response.success && response.data) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? response.data : u));
        setShowUserModal(false);
        setSelectedUser(null);
      }
    } else {
      const response = await api.userService.create({
        name: userForm.name,
        username: userForm.username,
        email: userForm.email,
        password: 'demo123',
        role: userForm.role,
        status: userForm.status,
        businessId: userForm.businessId || null,
        phone: userForm.phone || null
      });
      
      if (response.success && response.data) {
        setUsers(prev => [...prev, response.data]);
        setShowUserModal(false);
      }
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const response = await api.userService.update(user.id, { status: newStatus });
    
    if (response.success && response.data) {
      setUsers(prev => prev.map(u => u.id === user.id ? response.data : u));
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    const response = await api.userService.delete(selectedUser.id);
    if (response.success) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowUserDeleteConfirm(false);
      setSelectedUser(null);
    }
  };

  const openDeleteUserConfirm = (user: User) => {
    setSelectedUser(user);
    setShowUserDeleteConfirm(true);
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = !searchUser || 
      user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.username.toLowerCase().includes(searchUser.toLowerCase());
    const matchRole = filterUserRole === 'all' || user.role === filterUserRole;
    const matchStatus = filterUserStatus === 'all' || user.status === filterUserStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const getRoleBadgeVariant = (role: User['role']): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'employee': return 'secondary';
      case 'messenger': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClearServices = async () => {
    await api.systemService.clearAll();
    setServices([]);
    setShowConfirmClear(false);
  };

  const handleClearModules = async () => {
    await api.moduleService.clearAll();
    setModules(prev => prev.filter(m => m.type === 'core'));
    setShowConfirmClear(false);
  };

  // --- Reset Forms ---
  const resetServiceForm = () => {
    setServiceForm({ name: '', description: '', price: 0, currency: 'COP', billingType: 'monthly' });
    setEditingService(null);
  };

  const resetModuleForm = () => {
    setModuleForm({ name: '', description: '', type: 'addon', icon: 'zap' });
    setEditingModule(null);
  };

  // Helper para parsear features (fix robusto para JSON stringificado)
  const parseFeatures = (features: unknown): string[] => {
    let arr: string[] = [];
    if (!features) return [];
    if (typeof features === 'string') {
      try { 
        const parsed = JSON.parse(features);
        arr = Array.isArray(parsed) ? parsed.map(String) : [features];
      } catch { 
        arr = features.split('\n').filter(Boolean);
      }
    } else if (Array.isArray(features)) {
      arr = (features as unknown[]).map(String);
    } else {
      return [];
    }
    // Limpiar comillas sobrantes de cada item
    return arr.map(item => item.replace(/^["']+|["']+$/g, '').trim()).filter(Boolean);
  };

  const resetPlanForm = () => {
    setPlanForm({ 
      name: '', slug: '', description: '', price: 0, currency: 'COP', 
      period: 'monthly', features: '', maxUsers: 1, maxProducts: 50, 
      maxCategories: 5, isPopular: false, color: '#8b5cf6'
    });
    setEditingPlan(null);
  };

  // --- Open Edit Modals ---
  const openEditService = (service: SystemService) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price,
      currency: service.currency,
      billingType: service.billingType
    });
    setShowServiceModal(true);
  };

  const openEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      name: module.name,
      description: module.description,
      type: module.type,
      icon: module.icon
    });
    setShowModuleModal(true);
  };

  const openEditPlan = (plan: LandingPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '',
      slug: plan.slug || '',
      description: plan.description || '',
      price: plan.price ?? 0,
      currency: plan.currency || 'COP',
      period: plan.period || 'monthly',
      features: parseFeatures(plan.features).join('\n'),
      maxUsers: plan.maxUsers ?? 1,
      maxProducts: plan.maxProducts ?? 50,
      maxCategories: plan.maxCategories ?? 5,
      isPopular: plan.isPopular ?? false,
      color: plan.color || '#8b5cf6'
    });
    setShowPlanModal(true);
  };

  // --- Filtered Data ---
  const filteredBusinesses = businesses.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(searchBusiness.toLowerCase()) ||
                       b.ownerName.toLowerCase().includes(searchBusiness.toLowerCase());
    const matchPlan = filterPlan === 'all' || b.planId === filterPlan;
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  // --- Sidebar Items ---
  const sidebarItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'negocios', label: 'Negocios', icon: <Building2 className="w-5 h-5" /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
    { id: 'servicios', label: 'Servicios', icon: <Settings className="w-5 h-5" /> },
    { id: 'modulos', label: 'Módulos', icon: <Puzzle className="w-5 h-5" /> },
    { id: 'planes', label: 'Planes Fijos', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'pagos', label: 'Pasarelas de Pago', icon: <Wallet className="w-5 h-5" /> },
    { id: 'chatbot', label: 'Chatbot IA', icon: <Bot className="w-5 h-5" /> },
    { id: 'integraciones', label: 'Integraciones', icon: <Link2 className="w-5 h-5" /> },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: <Wrench className="w-5 h-5" /> }
  ];

  // --- Stats ---
  const stats = {
    totalBusinesses: businesses.length,
    activeBusinesses: businesses.filter(b => b.status === 'active').length,
    monthlyRevenue: businesses.filter(b => b.status === 'active').length * 99000,
    activePlans: plans.filter(p => p.isActive).length
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            MINIMENU
          </h1>
          <p className="text-xs text-gray-400 mt-1">Panel de Administración</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                    activeTab === item.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Super Admin</p>
              <p className="text-xs text-gray-400">auditsemseo@gmail.com</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {sidebarItems.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-gray-600 mt-1">
            {activeTab === 'dashboard' && 'Resumen general de la plataforma'}
            {activeTab === 'negocios' && 'Gestiona los negocios registrados en la plataforma'}
            {activeTab === 'usuarios' && 'Gestiona los usuarios de la plataforma'}
            {activeTab === 'servicios' && 'Configura los servicios adicionales del sistema'}
            {activeTab === 'modulos' && 'Administra los módulos disponibles'}
            {activeTab === 'planes' && 'Crea y edita planes de suscripción'}
            {activeTab === 'pagos' && 'Configura las pasarelas de pago'}
            {activeTab === 'chatbot' && 'Configura el asistente virtual y motor de IA'}
            {activeTab === 'integraciones' && 'Gestiona las integraciones externas'}
            {activeTab === 'mantenimiento' && 'Herramientas de mantenimiento y diagnóstico del sistema'}
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Negocios</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.totalBusinesses}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Negocios Activos</p>
                          <p className="text-3xl font-bold text-green-600">{stats.activeBusinesses}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                          <p className="text-3xl font-bold text-gray-900">
                            ${(stats.monthlyRevenue / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Planes Activos</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.activePlans}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {businesses.slice(0, 5).map(business => (
                        <div key={business.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{business.name}</p>
                              <p className="text-sm text-gray-500">{business.ownerName}</p>
                            </div>
                          </div>
                          <StatusBadge status={business.status} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Negocios Tab */}
            {activeTab === 'negocios' && (
              <div className="space-y-6">
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    onClick={() => setShowBusinessModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Negocio
                  </Button>
                  
                  <div className="flex-1 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar negocios..."
                        value={searchBusiness}
                        onChange={e => setSearchBusiness(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={filterPlan} onValueChange={setFilterPlan}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los planes</SelectItem>
                        {plans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="suspended">Suspendido</SelectItem>
                        <SelectItem value="pending_payment">Pago Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Business Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Negocio</th>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Plan</th>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Estado</th>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Teléfono</th>
                            <th className="text-right px-6 py-4 font-medium text-gray-600">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredBusinesses.map(business => (
                            <tr key={business.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{business.name}</p>
                                    <p className="text-sm text-gray-500">{business.ownerName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline">{business.planName}</Badge>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={business.status} />
                              </td>
                              <td className="px-6 py-4 text-gray-600">{business.phone}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openManageBusiness(business)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Gestionar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleImpersonate(business)}
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  >
                                    Ingresar
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {filteredBusinesses.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        No se encontraron negocios
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Usuarios Tab */}
            {activeTab === 'usuarios' && (
              <div className="space-y-6">
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    onClick={openCreateUser}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </Button>
                  
                  <div className="flex-1 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar usuarios..."
                        value={searchUser}
                        onChange={e => setSearchUser(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={filterUserRole} onValueChange={setFilterUserRole}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="employee">Empleado</SelectItem>
                        <SelectItem value="messenger">Mensajero</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterUserStatus} onValueChange={setFilterUserStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Users Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Usuario</th>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Rol</th>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Estado</th>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Empresa</th>
                            <th className="text-left px-6 py-4 font-medium text-gray-600">Fecha Registro</th>
                            <th className="text-right px-6 py-4 font-medium text-gray-600">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredUsers.map(usr => (
                            <tr key={usr.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-medium text-sm">
                                      {usr.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{usr.name}</p>
                                    <p className="text-sm text-gray-500">{usr.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={getRoleBadgeVariant(usr.role)}>
                                  {usr.role === 'super_admin' ? 'Super Admin' : 
                                   usr.role === 'admin' ? 'Admin' :
                                   usr.role === 'employee' ? 'Empleado' : 'Mensajero'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge 
                                  variant={usr.status === 'active' ? 'default' : usr.status === 'inactive' ? 'secondary' : 'outline'}
                                  className={usr.status === 'active' ? 'bg-green-100 text-green-800' : 
                                            usr.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                                            'bg-yellow-100 text-yellow-800'}
                                >
                                  {usr.status === 'active' ? 'Activo' : 
                                   usr.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {usr.businessName || '-'}
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {formatDate(usr.createdAt)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openEditUser(usr)}
                                  >
                                    <Pencil className="w-4 h-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleToggleUserStatus(usr)}
                                    className={usr.status === 'active' ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                                  >
                                    {usr.status === 'active' ? 'Desactivar' : 'Activar'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openDeleteUserConfirm(usr)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        No se encontraron usuarios
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Servicios Tab */}
            {activeTab === 'servicios' && (
              <div className="space-y-6">
                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      resetServiceForm();
                      setShowServiceModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Servicio
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfirmAction(() => handleClearServices);
                      setShowConfirmClear(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Datos Simulados
                  </Button>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map(service => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                          </div>
                          <StatusBadge status={service.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-2xl font-bold">
                              ${service.price.toLocaleString()}
                              <span className="text-sm font-normal text-gray-500 ml-1">
                                {service.currency}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {service.billingType === 'monthly' ? '/ mes' : 'único'}
                            </p>
                          </div>
                          <Switch
                            checked={service.status === 'active'}
                            onCheckedChange={() => handleToggleService(service.id)}
                            className="data-[state=checked]:bg-purple-600"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditService(service)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {services.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      No hay servicios registrados
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Módulos Tab */}
            {activeTab === 'modulos' && (
              <div className="space-y-6">
                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      resetModuleForm();
                      setShowModuleModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Módulo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfirmAction(() => handleClearModules);
                      setShowConfirmClear(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Datos Simulados
                  </Button>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map(module => (
                    <Card key={module.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center',
                              module.type === 'core' ? 'bg-purple-100' : 'bg-gray-100'
                            )}>
                              {iconMap[module.icon] ?? <Puzzle className="w-5 h-5" />}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{module.name}</CardTitle>
                              <Badge 
                                variant={module.type === 'core' ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {module.type === 'core' ? 'Core' : 'Addon'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-4">{module.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Estado:</span>
                            <StatusBadge status={module.status} />
                          </div>
                          <Switch
                            checked={module.status === 'active'}
                            onCheckedChange={() => handleToggleModule(module.id)}
                            disabled={module.type === 'core'}
                            className="data-[state=checked]:bg-purple-600"
                          />
                        </div>
                        {module.type !== 'core' && (
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModule(module)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteModule(module.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Planes Tab */}
            {activeTab === 'planes' && (
              <div className="space-y-6">
                {/* Header with Save Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Planes Fijos</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Crea y edita planes de suscripción
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveAllPlans}
                    disabled={plans.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>

                {/* Actions */}
                <Button
                  onClick={() => {
                    resetPlanForm();
                    setShowPlanModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Plan
                </Button>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map(plan => (
                    <Card 
                      key={plan.id} 
                      className={cn(
                        'hover:shadow-lg transition-shadow relative',
                        plan.isPopular && 'ring-2 ring-purple-500'
                      )}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-purple-600">Más Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: plan.color + '20' }}
                          >
                            {iconMap[plan.icon] ?? <CreditCard className="w-5 h-5" style={{ color: plan.color }} />}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <p className="text-xs text-gray-500">{plan.slug}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <p className="text-3xl font-bold">
                            ${plan.price.toLocaleString()}
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              {plan.currency} / {plan.period === 'monthly' ? 'mes' : plan.period}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {parseFeatures(plan.features).slice(0, 4).map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {parseFeatures(plan.features).length > 4 && (
                            <p className="text-xs text-gray-500">+{parseFeatures(plan.features).length - 4} más</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditPlan(plan)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pagos Tab */}
            {activeTab === 'pagos' && (
              <div className="space-y-6">
                {/* Save Button Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pasarelas de Pago Globales</h3>
                    <p className="text-sm text-gray-500">Configura los métodos de pago disponibles en toda la plataforma</p>
                  </div>
                  <Button
                    onClick={handleSavePaymentConfig}
                    disabled={!hasPaymentChanges || paymentSaving}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {paymentSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </div>

                {paymentLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : paymentConfig ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Izquierda - Pasarelas API y Manuales */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Stripe */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Stripe</h4>
                                <p className="text-xs text-gray-500">Pagos internacionales con tarjeta</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.stripe.enabled}
                              onCheckedChange={(checked) => updateApiGateway('stripe', 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.stripe.enabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Clave Pública</Label>
                                <Input
                                  value={paymentConfig.stripe.publicKey}
                                  onChange={(e) => updateApiGateway('stripe', 'publicKey', e.target.value)}
                                  placeholder="pk_test_..."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Clave Secreta</Label>
                                <Input
                                  type="password"
                                  value={paymentConfig.stripe.secretKey}
                                  onChange={(e) => updateApiGateway('stripe', 'secretKey', e.target.value)}
                                  placeholder="sk_test_..."
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Modo de Operación</Label>
                              <Select
                                value={paymentConfig.stripe.mode}
                                onValueChange={(value: GatewayMode) => updateApiGateway('stripe', 'mode', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                                  <SelectItem value="production">Producción</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.stripe.instructions}
                                onChange={(e) => updateApiGateway('stripe', 'instructions', e.target.value)}
                                placeholder="Instrucciones que verá el cliente al pagar..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Mercado Pago */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Mercado Pago</h4>
                                <p className="text-xs text-gray-500">Pasarela de pagos latinoamericana</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.mercadoPago.enabled}
                              onCheckedChange={(checked) => updateApiGateway('mercadoPago', 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.mercadoPago.enabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Public Key</Label>
                                <Input
                                  value={paymentConfig.mercadoPago.publicKey}
                                  onChange={(e) => updateApiGateway('mercadoPago', 'publicKey', e.target.value)}
                                  placeholder="APP_USR-..."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Access Token</Label>
                                <Input
                                  type="password"
                                  value={paymentConfig.mercadoPago.secretKey}
                                  onChange={(e) => updateApiGateway('mercadoPago', 'secretKey', e.target.value)}
                                  placeholder="APP_USR-..."
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Modo de Operación</Label>
                              <Select
                                value={paymentConfig.mercadoPago.mode}
                                onValueChange={(value: GatewayMode) => updateApiGateway('mercadoPago', 'mode', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                                  <SelectItem value="production">Producción</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.mercadoPago.instructions}
                                onChange={(e) => updateApiGateway('mercadoPago', 'instructions', e.target.value)}
                                placeholder="Instrucciones que verá el cliente al pagar..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* PayPal */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">PayPal</h4>
                                <p className="text-xs text-gray-500">Pagos internacionales seguros</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.paypal.enabled}
                              onCheckedChange={(checked) => updateApiGateway('paypal', 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.paypal.enabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Client ID</Label>
                                <Input
                                  value={paymentConfig.paypal.publicKey}
                                  onChange={(e) => updateApiGateway('paypal', 'publicKey', e.target.value)}
                                  placeholder="AZDxjDScFp..."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Secret</Label>
                                <Input
                                  type="password"
                                  value={paymentConfig.paypal.secretKey}
                                  onChange={(e) => updateApiGateway('paypal', 'secretKey', e.target.value)}
                                  placeholder="EGnHDxD_..."
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Modo de Operación</Label>
                              <Select
                                value={paymentConfig.paypal.mode}
                                onValueChange={(value: GatewayMode) => updateApiGateway('paypal', 'mode', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                                  <SelectItem value="production">Producción</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.paypal.instructions}
                                onChange={(e) => updateApiGateway('paypal', 'instructions', e.target.value)}
                                placeholder="Instrucciones que verá el cliente al pagar..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Nequi */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-pink-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Nequi</h4>
                                <p className="text-xs text-gray-500">Pagos móviles en Colombia</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.nequi.enabled}
                              onCheckedChange={(checked) => updateManualGateway('nequi', 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.nequi.enabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Número de Cuenta</Label>
                                <Input
                                  value={paymentConfig.nequi.accountNumber}
                                  onChange={(e) => updateManualGateway('nequi', 'accountNumber', e.target.value)}
                                  placeholder="3001234567"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Titular de la Cuenta</Label>
                                <Input
                                  value={paymentConfig.nequi.accountHolder}
                                  onChange={(e) => updateManualGateway('nequi', 'accountHolder', e.target.value)}
                                  placeholder="Nombre del titular"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.nequi.instructions}
                                onChange={(e) => updateManualGateway('nequi', 'instructions', e.target.value)}
                                placeholder="Instrucciones para realizar el pago..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            {/* QR Code Upload */}
                            <div>
                              <Label className="text-xs text-gray-500">Código QR (Opcional)</Label>
                              <div className="mt-2">
                                {paymentConfig.nequi.qrCodeUrl ? (
                                  <div className="relative inline-block">
                                    <img
                                      src={paymentConfig.nequi.qrCodeUrl}
                                      alt="QR Nequi"
                                      className="w-32 h-32 object-contain border rounded-lg"
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                      onClick={() => removeQrCode('nequi')}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Subir QR</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleQrCodeUpload('nequi', e)}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Bancolombia */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Landmark className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Bancolombia</h4>
                                <p className="text-xs text-gray-500">Transferencias bancarias</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.bancolombia.enabled}
                              onCheckedChange={(checked) => updateManualGateway('bancolombia', 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.bancolombia.enabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Número de Cuenta</Label>
                                <Input
                                  value={paymentConfig.bancolombia.accountNumber}
                                  onChange={(e) => updateManualGateway('bancolombia', 'accountNumber', e.target.value)}
                                  placeholder="123-456789-01"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Titular de la Cuenta</Label>
                                <Input
                                  value={paymentConfig.bancolombia.accountHolder}
                                  onChange={(e) => updateManualGateway('bancolombia', 'accountHolder', e.target.value)}
                                  placeholder="Nombre del titular"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.bancolombia.instructions}
                                onChange={(e) => updateManualGateway('bancolombia', 'instructions', e.target.value)}
                                placeholder="Instrucciones para realizar la transferencia..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            {/* QR Code Upload */}
                            <div>
                              <Label className="text-xs text-gray-500">Código QR (Opcional)</Label>
                              <div className="mt-2">
                                {paymentConfig.bancolombia.qrCodeUrl ? (
                                  <div className="relative inline-block">
                                    <img
                                      src={paymentConfig.bancolombia.qrCodeUrl}
                                      alt="QR Bancolombia"
                                      className="w-32 h-32 object-contain border rounded-lg"
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                      onClick={() => removeQrCode('bancolombia')}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Subir QR</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleQrCodeUpload('bancolombia', e)}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Daviplata */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Daviplata</h4>
                                <p className="text-xs text-gray-500">Billetera digital de Davivienda</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.daviplata.enabled}
                              onCheckedChange={(checked) => updateManualGateway('daviplata', 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.daviplata.enabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Número de Cuenta</Label>
                                <Input
                                  value={paymentConfig.daviplata.accountNumber}
                                  onChange={(e) => updateManualGateway('daviplata', 'accountNumber', e.target.value)}
                                  placeholder="3001234567"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Titular de la Cuenta</Label>
                                <Input
                                  value={paymentConfig.daviplata.accountHolder}
                                  onChange={(e) => updateManualGateway('daviplata', 'accountHolder', e.target.value)}
                                  placeholder="Nombre del titular"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.daviplata.instructions}
                                onChange={(e) => updateManualGateway('daviplata', 'instructions', e.target.value)}
                                placeholder="Instrucciones para realizar el pago..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            {/* QR Code Upload */}
                            <div>
                              <Label className="text-xs text-gray-500">Código QR (Opcional)</Label>
                              <div className="mt-2">
                                {paymentConfig.daviplata.qrCodeUrl ? (
                                  <div className="relative inline-block">
                                    <img
                                      src={paymentConfig.daviplata.qrCodeUrl}
                                      alt="QR Daviplata"
                                      className="w-32 h-32 object-contain border rounded-lg"
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                      onClick={() => removeQrCode('daviplata')}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Subir QR</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleQrCodeUpload('daviplata', e)}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* BRE-B */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-teal-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">BRE-B</h4>
                                <p className="text-xs text-gray-500">Billetera digital del Banco de la República</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.breB.enabled}
                              onCheckedChange={(checked) => updateManualGateway('breB', 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.breB.enabled && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500">Número de Cuenta</Label>
                                <Input
                                  value={paymentConfig.breB.accountNumber}
                                  onChange={(e) => updateManualGateway('breB', 'accountNumber', e.target.value)}
                                  placeholder="Número de cuenta BRE-B"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Titular de la Cuenta</Label>
                                <Input
                                  value={paymentConfig.breB.accountHolder}
                                  onChange={(e) => updateManualGateway('breB', 'accountHolder', e.target.value)}
                                  placeholder="Nombre del titular"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.breB.instructions}
                                onChange={(e) => updateManualGateway('breB', 'instructions', e.target.value)}
                                placeholder="Instrucciones para realizar el pago..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            {/* QR Code Upload */}
                            <div>
                              <Label className="text-xs text-gray-500">Código QR (Opcional)</Label>
                              <div className="mt-2">
                                {paymentConfig.breB.qrCodeUrl ? (
                                  <div className="relative inline-block">
                                    <img
                                      src={paymentConfig.breB.qrCodeUrl}
                                      alt="QR BRE-B"
                                      className="w-32 h-32 object-contain border rounded-lg"
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                      onClick={() => removeQrCode('breB')}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Subir QR</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleQrCodeUpload('breB', e)}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Columna Derecha - Hotmart */}
                    <div className="space-y-4">
                      {/* Hotmart */}
                      <Card>
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Hotmart</h4>
                                <p className="text-xs text-gray-500">Pagos con enlaces de checkout</p>
                              </div>
                            </div>
                            <Switch
                              checked={paymentConfig.hotmart.enabled}
                              onCheckedChange={(checked) => updateHotmartSettings('enabled', checked)}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                        {paymentConfig.hotmart.enabled && (
                          <div className="p-4 space-y-4">
                            <div>
                              <Label className="text-xs text-gray-500">Instrucciones para el Cliente</Label>
                              <Textarea
                                value={paymentConfig.hotmart.instructions}
                                onChange={(e) => updateHotmartSettings('instructions', e.target.value)}
                                placeholder="Instrucciones que verá el cliente..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h5 className="text-sm font-medium mb-3">Enlaces de Pago por Plan</h5>
                              <p className="text-xs text-gray-500 mb-4">
                                Pega el enlace de checkout de Hotmart para cada plan de suscripción.
                              </p>
                              <div className="space-y-3">
                                {plans.map(plan => (
                                  <div key={plan.id} className="space-y-1">
                                    <Label className="text-xs font-medium flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: plan.color }}
                                      />
                                      {plan.name}
                                      <span className="text-gray-400 font-normal">
                                        (${plan.price.toLocaleString()} {plan.currency})
                                      </span>
                                    </Label>
                                    <Input
                                      value={planHotmartUrls[plan.id] ?? ''}
                                      onChange={(e) => updatePlanHotmartUrl(plan.id, e.target.value)}
                                      placeholder="https://pay.hotmart.com/..."
                                      className="text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Resumen de Estado */}
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Estado de Pasarelas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                Stripe
                              </span>
                              <Badge variant={paymentConfig.stripe.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.stripe.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-gray-400" />
                                Mercado Pago
                              </span>
                              <Badge variant={paymentConfig.mercadoPago.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.mercadoPago.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-gray-400" />
                                PayPal
                              </span>
                              <Badge variant={paymentConfig.paypal.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.paypal.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-gray-400" />
                                Nequi
                              </span>
                              <Badge variant={paymentConfig.nequi.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.nequi.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-gray-400" />
                                Bancolombia
                              </span>
                              <Badge variant={paymentConfig.bancolombia.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.bancolombia.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-gray-400" />
                                Daviplata
                              </span>
                              <Badge variant={paymentConfig.daviplata.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.daviplata.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-gray-400" />
                                BRE-B
                              </span>
                              <Badge variant={paymentConfig.breB.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.breB.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                Hotmart
                              </span>
                              <Badge variant={paymentConfig.hotmart.enabled ? 'default' : 'secondary'} className="text-xs">
                                {paymentConfig.hotmart.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      No se pudo cargar la configuración de pagos
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Chatbot IA Tab */}
            {activeTab === 'chatbot' && (
              <div className="space-y-6">
                {/* Save Button Header with Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Configuración del Chatbot y Motor de IA</h3>
                      <p className="text-sm text-gray-500">Gestiona el asistente virtual de la plataforma</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={aiConfig?.enabled ?? false}
                        onCheckedChange={(checked) => updateAiConfig('enabled', checked ? 1 : 0)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <span className={`text-sm font-medium ${aiConfig?.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                        {aiConfig?.enabled ? 'Activado' : 'Desactivado'}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveAIConfig}
                    disabled={!hasAiChanges || aiSaving}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {aiSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </div>

                {aiLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : aiConfig ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Izquierda - Cerebro y Fuentes */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Cerebro del Asistente */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            <CardTitle>Cerebro del Asistente (System Prompt)</CardTitle>
                          </div>
                          <p className="text-sm text-gray-500">
                            Define la personalidad, objetivos y comportamiento del chatbot.
                          </p>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            value={aiConfig.systemPrompt}
                            onChange={(e) => updateAiConfig('systemPrompt', e.target.value)}
                            placeholder="Escribe el system prompt para tu asistente..."
                            className="min-h-[200px] font-mono text-sm"
                          />
                        </CardContent>
                      </Card>

                      {/* Fuentes de Conocimiento */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-purple-600" />
                            <CardTitle>Fuentes de Conocimiento</CardTitle>
                          </div>
                          <p className="text-sm text-gray-500">
                            URLs que el chatbot puede usar como referencia.
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              value={newKnowledgeUrl}
                              onChange={(e) => setNewKnowledgeUrl(e.target.value)}
                              placeholder="https://ejemplo.com/documentacion"
                              className="flex-1"
                            />
                            <Button 
                              onClick={handleAddKnowledgeSource}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Añadir
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {aiConfig.knowledgeSources.map((url, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Link className="w-4 h-4 text-gray-400 shrink-0" />
                                  <span className="text-sm text-gray-600 truncate">{url}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveKnowledgeSource(url)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            {aiConfig.knowledgeSources.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No hay fuentes de conocimiento configuradas
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Columna Derecha - Librería y Motor */}
                    <div className="space-y-6">
                      {/* Librería de Contenido */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <CardTitle className="text-base">Librería de Contenido</CardTitle>
                          </div>
                          <p className="text-xs text-gray-500">
                            Archivos multimedia para el chatbot
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {libraryItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                {item.type === 'pdf' && <FileText className="w-4 h-4 text-red-500" />}
                                {item.type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                                {item.type === 'image' && <ImageIcon className="w-4 h-4 text-green-500" />}
                                {item.type === 'document' && <FileText className="w-4 h-4 text-gray-500" />}
                                <div>
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {(item.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteLibraryItem(item.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}

                          <Button
                            onClick={() => {
                              resetAiModelForm();
                              setShowAiModelModal(true);
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Configurar Proveedores de IA
                          </Button>

                          {/* Modelos Guardados */}
                          <div className="space-y-2">
                            {aiConfig.models.map(model => (
                              <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Sparkles className={cn("w-4 h-4", model.active ? "text-green-500" : "text-gray-400")} />
                                  <div>
                                    <p className="text-sm font-medium">{model.name}</p>
                                    <p className="text-xs text-gray-500">{model.provider}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSetActiveModel(model.id)}
                                    className={cn(
                                      "h-8 w-8 p-0",
                                      model.active ? "text-green-600" : "text-gray-400"
                                    )}
                                  >
                                    {model.active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditModel(model)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteModel(model.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {aiConfig.models.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No hay proveedores configurados
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Librería de Contenido */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <CardTitle className="text-base">Librería de Contenido</CardTitle>
                          </div>
                          <p className="text-xs text-gray-500">
                            Archivos multimedia para el chatbot
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {libraryItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                {item.type === 'pdf' && <FileText className="w-4 h-4 text-red-500" />}
                                {item.type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                                {item.type === 'image' && <ImageIcon className="w-4 h-4 text-green-500" />}
                                {item.type === 'document' && <FileText className="w-4 h-4 text-gray-500" />}
                                <div>
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {(item.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteLibraryItem(item.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          <Button
                            onClick={() => {
                              resetLibraryForm();
                              setShowLibraryModal(true);
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Añadir Contenido
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      No se pudo cargar la configuración de IA
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Integraciones Tab */}
            {activeTab === 'integraciones' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Integraciones Disponibles</CardTitle>
                    <p className="text-sm text-gray-500">
                      Conecta tu negocio con herramientas externas.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'WhatsApp Business', desc: 'Envío automático de mensajes', icon: MessageCircle, color: 'green' },
                        { name: 'Google Analytics', desc: 'Seguimiento de visitas', icon: BarChart3, color: 'blue' },
                        { name: 'Facebook Pixel', desc: 'Remarketing y conversiones', icon: Globe, color: 'indigo' },
                        { name: 'Slack', desc: 'Notificaciones en tiempo real', icon: MessageCircle, color: 'purple' }
                      ].map((integration, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center',
                              `bg-${integration.color}-100`
                            )}>
                              <integration.icon className={cn('w-6 h-6', `text-${integration.color}-600`)} />
                            </div>
                            <div>
                              <h4 className="font-medium">{integration.name}</h4>
                              <p className="text-sm text-gray-500">{integration.desc}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Configurar</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mantenimiento Tab */}
            {activeTab === 'mantenimiento' && (
              <div className="space-y-6">
                {/* System Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Base de Datos</p>
                          <p className="font-semibold text-green-600">Operativo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">API Server</p>
                          <p className="font-semibold text-green-600">Operativo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Almacenamiento</p>
                          <p className="font-semibold text-green-600">78% Disponible</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Uptime</p>
                          <p className="font-semibold text-blue-600">99.9%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cache Management */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-base">Gestión de Caché</CardTitle>
                      </div>
                      <p className="text-sm text-gray-500">Limpia la caché del sistema para liberar espacio</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Caché de Aplicación</p>
                          <p className="text-sm text-gray-500">Última limpieza: hace 2 horas</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert('Caché de aplicación limpiada')}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Limpiar
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Caché de Imágenes</p>
                          <p className="text-sm text-gray-500">245 MB en caché</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert('Caché de imágenes limpiada')}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Limpiar
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Logs Antiguos</p>
                          <p className="text-sm text-gray-500">Logs de más de 30 días</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert('Logs antiguos eliminados')}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Database Backup */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-base">Respaldos de Base de Datos</CardTitle>
                      </div>
                      <p className="text-sm text-gray-500">Gestiona los respaldos del sistema</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => alert('Respaldo creado exitosamente')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Crear Respaldo
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => alert('Restaurando respaldo...')}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restaurar
                        </Button>
                      </div>
                      <div className="border rounded-lg divide-y">
                        <div className="flex items-center justify-between p-3">
                          <div>
                            <p className="font-medium">backup_2025-02-21.sql</p>
                            <p className="text-xs text-gray-500">Hoy, 08:00 AM - 12.5 MB</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <div>
                            <p className="font-medium">backup_2025-02-20.sql</p>
                            <p className="text-xs text-gray-500">Ayer, 08:00 AM - 11.8 MB</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <div>
                            <p className="font-medium">backup_2025-02-19.sql</p>
                            <p className="text-xs text-gray-500">19 Feb, 08:00 AM - 11.2 MB</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Logs */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-base">Registros del Sistema</CardTitle>
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="error">Errores</SelectItem>
                          <SelectItem value="warning">Advertencias</SelectItem>
                          <SelectItem value="info">Información</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        <div className="text-green-400">
                          <span className="text-gray-500">[2025-02-21 10:30:45]</span> INFO: Usuario admin@minimenu.com inició sesión
                        </div>
                        <div className="text-green-400">
                          <span className="text-gray-500">[2025-02-21 10:28:12]</span> INFO: Backup automático completado
                        </div>
                        <div className="text-yellow-400">
                          <span className="text-gray-500">[2025-02-21 10:15:33]</span> WARN: Intento de conexión fallido - IP: 192.168.1.100
                        </div>
                        <div className="text-green-400">
                          <span className="text-gray-500">[2025-02-21 09:45:22]</span> INFO: Nuevo negocio registrado: Restaurante El Sabor
                        </div>
                        <div className="text-red-400">
                          <span className="text-gray-500">[2025-02-21 09:30:11]</span> ERROR: Timeout en API de pagos - Reintentando...
                        </div>
                        <div className="text-green-400">
                          <span className="text-gray-500">[2025-02-21 09:30:15]</span> INFO: Reconexión exitosa a API de pagos
                        </div>
                        <div className="text-green-400">
                          <span className="text-gray-500">[2025-02-21 08:00:00]</span> INFO: Iniciando tarea programada: limpieza de caché
                        </div>
                        <div className="text-green-400">
                          <span className="text-gray-500">[2025-02-21 08:00:05]</span> INFO: Tarea completada: 156 archivos eliminados
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scheduled Tasks */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <CardTitle className="text-base">Tareas Programadas</CardTitle>
                    </div>
                    <p className="text-sm text-gray-500">Tareas automáticas del sistema</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'Backup Automático', schedule: 'Diario 08:00 AM', status: 'active', lastRun: 'Hoy 08:00 AM' },
                        { name: 'Limpieza de Caché', schedule: 'Diario 03:00 AM', status: 'active', lastRun: 'Hoy 03:00 AM' },
                        { name: 'Verificación de Pagos', schedule: 'Cada 6 horas', status: 'active', lastRun: 'Hoy 06:00 AM' },
                        { name: 'Reportes Semanales', schedule: 'Lunes 09:00 AM', status: 'active', lastRun: '17 Feb 09:00 AM' },
                        { name: 'Actualización de Estados', schedule: 'Cada hora', status: 'inactive', lastRun: 'Pausado' }
                      ].map((task, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-2 h-2 rounded-full',
                              task.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                            )} />
                            <div>
                              <p className="font-medium">{task.name}</p>
                              <p className="text-xs text-gray-500">{task.schedule}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{task.lastRun}</span>
                            <Switch 
                              checked={task.status === 'active'}
                              onCheckedChange={() => {}}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Service Modal */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={serviceForm.name}
                onChange={e => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del servicio"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={serviceForm.description}
                onChange={e => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del servicio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={serviceForm.price}
                  onChange={e => setServiceForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select
                  value={serviceForm.currency}
                  onValueChange={(v: Currency) => setServiceForm(prev => ({ ...prev, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tipo de Cobro</Label>
              <Select
                value={serviceForm.billingType}
                onValueChange={(v: BillingType) => setServiceForm(prev => ({ ...prev, billingType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="one_time">Único</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveService} className="bg-purple-600 hover:bg-purple-700">
              {editingService ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Modal */}
      <Dialog open={showModuleModal} onOpenChange={setShowModuleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Editar Módulo' : 'Nuevo Módulo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={moduleForm.name}
                onChange={e => setModuleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del módulo"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={moduleForm.description}
                onChange={e => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del módulo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={moduleForm.type}
                  onValueChange={(v: ModuleType) => setModuleForm(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="addon">Addon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ícono</Label>
                <Select
                  value={moduleForm.icon}
                  onValueChange={v => setModuleForm(prev => ({ ...prev, icon: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utensils">Utensils</SelectItem>
                    <SelectItem value="shopping-bag">Shopping</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="qr-code">QR</SelectItem>
                    <SelectItem value="bar-chart-3">Chart</SelectItem>
                    <SelectItem value="message-circle">Message</SelectItem>
                    <SelectItem value="zap">Zap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveModule} className="bg-purple-600 hover:bg-purple-700">
              {editingModule ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={planForm.name}
                  onChange={e => setPlanForm(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                  }))}
                  placeholder="Nombre del plan"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={planForm.slug}
                  onChange={e => setPlanForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-del-plan"
                />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={planForm.description}
                onChange={e => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del plan"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={planForm.price}
                  onChange={e => setPlanForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select
                  value={planForm.currency}
                  onValueChange={(v: Currency) => setPlanForm(prev => ({ ...prev, currency: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Período</Label>
                <Select
                  value={planForm.period}
                  onValueChange={(v: BillingType) => setPlanForm(prev => ({ ...prev, period: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Características (una por línea)</Label>
              <Textarea
                value={planForm.features}
                onChange={e => setPlanForm(prev => ({ ...prev, features: e.target.value }))}
                placeholder="Característica 1&#10;Característica 2&#10;..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Max Usuarios</Label>
                <Input
                  type="number"
                  value={planForm.maxUsers}
                  onChange={e => setPlanForm(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Max Productos</Label>
                <Input
                  type="number"
                  value={planForm.maxProducts}
                  onChange={e => setPlanForm(prev => ({ ...prev, maxProducts: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Max Categorías</Label>
                <Input
                  type="number"
                  value={planForm.maxCategories}
                  onChange={e => setPlanForm(prev => ({ ...prev, maxCategories: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={planForm.isPopular}
                onCheckedChange={v => setPlanForm(prev => ({ ...prev, isPopular: v }))}
                className="data-[state=checked]:bg-purple-600"
              />
              <Label>Marcar como popular</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>Cancelar</Button>
            <Button onClick={handleSavePlan} className="bg-purple-600 hover:bg-purple-700">
              {editingPlan ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Modal */}
      <Dialog open={showBusinessModal} onOpenChange={setShowBusinessModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Negocio</DialogTitle>
            <DialogDescription>Registra un nuevo negocio en la plataforma</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div>
              <Label>Nombre del Negocio</Label>
              <Input
                value={businessForm.name}
                onChange={e => setBusinessForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Restaurante El Sabor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre del Propietario</Label>
                <Input
                  value={businessForm.ownerName}
                  onChange={e => setBusinessForm(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <Label>Email del Propietario</Label>
                <Input
                  type="email"
                  value={businessForm.ownerEmail}
                  onChange={e => setBusinessForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  placeholder="juan@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={businessForm.phone}
                  onChange={e => setBusinessForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div>
                <Label>Plan</Label>
                <Select
                  value={businessForm.planId}
                  onValueChange={v => setBusinessForm(prev => ({ ...prev, planId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                value={businessForm.address}
                onChange={e => setBusinessForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Calle 123 #45-67, Bogotá"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={businessForm.status}
                onValueChange={(v: EntityStatus) => setBusinessForm(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="pending_payment">Pago Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBusinessModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveBusiness} className="bg-purple-600 hover:bg-purple-700">
              Crear Negocio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Business Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Negocio</DialogTitle>
            <DialogDescription>
              {selectedBusiness?.name} - Asigna módulos y servicios
            </DialogDescription>
          </DialogHeader>
          
          {selectedBusiness && (
            <div className="space-y-6 py-4">
              {/* Business Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Propietario</p>
                  <p className="font-medium">{selectedBusiness.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedBusiness.ownerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan Actual</p>
                  <p className="font-medium">{selectedBusiness.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <StatusBadge status={selectedBusiness.status} />
                </div>
              </div>

              {/* Modules Assignment */}
              <div>
                <h4 className="font-medium mb-3">Módulos Asignados</h4>
                <div className="grid grid-cols-2 gap-2">
                  {modules.map(moduleItem => (
                    <div 
                      key={moduleItem.id}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors',
                        assignedModules.includes(moduleItem.id) 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'hover:bg-gray-50',
                        moduleItem.type === 'core' && 'opacity-60'
                      )}
                      onClick={() => moduleItem.type !== 'core' && toggleModuleAssignment(moduleItem.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-8 h-8 rounded flex items-center justify-center',
                          moduleItem.type === 'core' ? 'bg-purple-100' : 'bg-gray-100'
                        )}>
                          {iconMap[moduleItem.icon] ?? <Puzzle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{moduleItem.name}</p>
                          <p className="text-xs text-gray-500">
                            {moduleItem.type === 'core' ? 'Core (Obligatorio)' : 'Addon'}
                          </p>
                        </div>
                      </div>
                      {assignedModules.includes(moduleItem.id) && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Assignment */}
              <div>
                <h4 className="font-medium mb-3">Servicios Adicionales</h4>
                <div className="grid grid-cols-2 gap-2">
                  {services.map(serviceItem => (
                    <div 
                      key={serviceItem.id}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors',
                        assignedServices.includes(serviceItem.id) 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'hover:bg-gray-50'
                      )}
                      onClick={() => toggleServiceAssignment(serviceItem.id)}
                    >
                      <div>
                        <p className="text-sm font-medium">{serviceItem.name}</p>
                        <p className="text-xs text-gray-500">
                          ${serviceItem.price.toLocaleString()} / {serviceItem.billingType === 'monthly' ? 'mes' : 'único'}
                        </p>
                      </div>
                      {assignedServices.includes(serviceItem.id) && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  ))}
                </div>
                {services.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay servicios disponibles
                  </p>
                )}
              </div>

              {/* Change Status */}
              <div>
                <h4 className="font-medium mb-3">Cambiar Estado</h4>
                <Select
                  value={selectedBusiness.status}
                  onValueChange={(v: EntityStatus) => {
                    const updated = { ...selectedBusiness, status: v };
                    setSelectedBusiness(updated);
                    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                    <SelectItem value="pending_payment">Pago Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveManageBusiness} className="bg-purple-600 hover:bg-purple-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Model Modal */}
      <Dialog open={showAiModelModal} onOpenChange={setShowAiModelModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModel ? 'Editar Proveedor de IA' : 'Nuevo Proveedor de IA'}</DialogTitle>
            <DialogDescription>
              Configura las credenciales de un proveedor de IA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Provider Selection */}
            <div>
              <Label>Proveedor</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['Google Gemini', 'OpenAI GPT', 'Groq', 'Custom API'] as AIProvider[]).map(provider => (
                  <button
                    key={provider}
                    onClick={() => setAiModelForm(prev => ({ ...prev, provider }))}
                    className={cn(
                      'p-3 border rounded-lg text-sm text-left transition-colors',
                      aiModelForm.provider === provider 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'hover:bg-gray-50'
                    )}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label>Nombre del Modelo</Label>
              <Input
                value={aiModelForm.name}
                onChange={(e) => setAiModelForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mi modelo principal"
              />
            </div>

            {/* Model Selection */}
            <div>
              <Label>Modelo</Label>
              <Input
                value={aiModelForm.model}
                onChange={(e) => setAiModelForm(prev => ({ ...prev, model: e.target.value }))}
                placeholder="gemini-1.5-flash, gpt-4o-mini, llama-3.1-70b-versatile"
              />
            </div>

            {/* API Key */}
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={aiModelForm.apiKey}
                onChange={(e) => setAiModelForm(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
              />
            </div>

            {/* Custom API Options */}
            {aiModelForm.provider === 'Custom API' && (
              <>
                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={aiModelForm.baseUrl ?? ''}
                    onChange={(e) => setAiModelForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.ejemplo.com/v1"
                  />
                </div>
                <div>
                  <Label>Tipo de Autenticación</Label>
                  <Select
                    value={aiModelForm.authType}
                    onValueChange={(v) => setAiModelForm(prev => ({ 
                      ...prev, 
                      authType: v as 'bearer' | 'header' | 'none' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="header">Custom Header</SelectItem>
                      <SelectItem value="none">Sin autenticación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Test Connection */}
            {connectionTestResult && (
              <div className={cn(
                'flex items-center gap-2 p-3 rounded-lg',
                connectionTestResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                {connectionTestResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="text-sm">{connectionTestResult.message}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2">
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection || !aiModelForm.apiKey}
                className="flex-1"
              >
                {testingConnection ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Probar Conexión
              </Button>
            </div>
            <div className="flex w-full gap-2">
              <Button variant="outline" onClick={() => setShowAiModelModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveAIModel} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingModel ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library Modal */}
      <Dialog open={showLibraryModal} onOpenChange={setShowLibraryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Añadir Contenido Multimedia</DialogTitle>
            <DialogDescription>
              Sube archivos que el chatbot puede usar en sus respuestas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre del Archivo</Label>
              <Input
                value={libraryForm.name}
                onChange={(e) => setLibraryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Manual de Usuario"
              />
            </div>

            <div>
              <Label>Tipo de Archivo</Label>
              <Select
                value={libraryForm.type}
                onValueChange={(v) => setLibraryForm(prev => ({ 
                  ...prev, 
                  type: v as 'video' | 'pdf' | 'image' | 'document' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Imagen</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={libraryForm.description}
                onChange={(e) => setLibraryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del contenido para la IA..."
                rows={2}
              />
            </div>

            <div>
              <Label>Palabras Clave (separadas por coma)</Label>
              <Input
                value={libraryForm.keywords}
                onChange={(e) => setLibraryForm(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="manual, guía, ayuda, instrucciones"
              />
            </div>

            <div>
              <Label>Archivo</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                  {libraryForm.file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-8 h-8 text-purple-600" />
                      <span className="text-sm text-gray-600 mt-2">{libraryForm.file.name}</span>
                      <span className="text-xs text-gray-400">
                        {(libraryForm.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500 mt-2">Click para subir archivo</span>
                      <span className="text-xs text-gray-400">PDF, Video, Imagen</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleLibraryFileChange}
                    accept=".pdf,video/*,image/*"
                  />
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLibraryModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveLibraryItem} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!libraryForm.name || !libraryForm.file}
            >
              Subir Contenido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <ConfirmDialog
        open={showConfirmClear}
        onOpenChange={setShowConfirmClear}
        title="Eliminar Datos"
        description="¿Estás seguro de que deseas eliminar los datos simulados? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmAction(null);
        }}
      />

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="username"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
                disabled={!!selectedUser}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rol</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm(prev => ({ ...prev, role: v as User['role'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="messenger">Mensajero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={userForm.status} onValueChange={(v) => setUserForm(prev => ({ ...prev, status: v as User['status'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div>
                <Label>Empresa (Opcional)</Label>
                <Select 
                  value={userForm.businessId || 'none'} 
                  onValueChange={(v) => setUserForm(prev => ({ ...prev, businessId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin empresa</SelectItem>
                    {businesses.map(biz => (
                      <SelectItem key={biz.id} value={biz.id}>{biz.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveUser} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!userForm.name || !userForm.username || !userForm.email}
            >
              {selectedUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={showUserDeleteConfirm} onOpenChange={setShowUserDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.name}</strong>? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
