'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from './StatusBadge';
import type { 
  User, 
  Product, 
  Category, 
  Order, 
  OrderItem, 
  PrintableOrder, 
  UnifiedOrder, 
  DeliveryOrder, 
  DeliveryInvoice, 
  RestaurantInvoice, 
  CartItem, 
  DeliveryCartItem, 
  Printer, 
  PaymentMethodConfig 
} from '@/types';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Users,
  Utensils,
  QrCode,
  Search,
  Bell,
  Star,
  Sparkles,
  Mic,
  Loader2,
  Image as ImageIcon,
  X,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Truck,
  MapPin,
  Phone,
  Clock,
  FileText,
  Save,
  HardDrive,
  Upload,
  AlertTriangle,
  Calendar,
  RefreshCw,
  LayoutGrid,
  CreditCard,
  List,
  Bike,
  BarChart3,
  Building2,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Smartphone,
  Landmark,
  Printer as PrinterIcon,
  History
} from 'lucide-react';
import type { InvoiceSettingsType } from '@/types/invoice';

// --- Speech Recognition Types ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface BusinessAdminPanelProps {
  user: User;
  onLogout: () => void;
}

// --- Helper Functions ---
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

function parseFeatures(features: unknown): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features.map(f => String(f));
  if (typeof features === 'string') {
    if (features.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed.map(f => String(f)) : [features];
      } catch (e) {
        return features.split('\n').filter(Boolean);
      }
    }
    return features.split('\n').filter(Boolean);
  }
  return [];
}


// --- Default categories for fallback ---

// Default categories for fallback
const defaultCategories: Category[] = [
  { id: 'cat-1', businessId: 'default', name: 'Entradas', description: '', icon: '🥗', isActive: true, order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat-2', businessId: 'default', name: 'Platos Principales', description: '', icon: '🍽️', isActive: true, order: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat-3', businessId: 'default', name: 'Bebidas', description: '', icon: '🥤', isActive: true, order: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat-4', businessId: 'default', name: 'Postres', description: '', icon: '🍰', isActive: true, order: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// Default printer types and areas
const defaultPrinterTypes = ['Térmica', 'Inyección', 'Láser', 'Matricial'];
const defaultPrinterAreas = ['Cocina', 'Barra', 'Caja', 'General'];

// --- Helper functions for OrderCard (must be outside component) ---
function getTimerColor(minutes: number): string {
  if (minutes <= 10) return 'text-green-600';
  if (minutes <= 20) return 'text-yellow-600';
  return 'text-red-600';
}

function getTimerBackground(minutes: number): string {
  if (minutes > 20) return 'bg-red-50 animate-pulse';
  return '';
}

function shouldShowTimer(status: string): boolean {
  // Estados activos para mostrar timer: pendiente, preparando, confirmado, en_camino
  return ['pending', 'preparing', 'confirmed', 'on_the_way'].includes(status);
}

function getElapsedMinutes(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return Math.floor((now - created) / 60000);
}

// --- Helper functions for OrderCard (must be outside component) ---
// --- Removed duplicate helpers from here as they are defined globally below if needed, or vice-versa ---
// Actually, I'll keep them here and remove the others later to avoid breaking the component.

// --- Order Card Component for Kanban View ---
interface OrderCardProps {
  order: UnifiedOrder;
  timer?: number;
  onView: () => void;
}

function OrderCard({ order, timer, onView }: OrderCardProps) {
  const timerColor = timer !== undefined ? getTimerColor(timer) : '';
  const timerBg = timer !== undefined ? getTimerBackground(timer) : '';
  const showTimer = timer !== undefined && shouldShowTimer(order.status);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    preparing: 'bg-orange-100 text-orange-800 border-orange-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    on_the_way: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusText: Record<string, string> = {
    pending: 'Pendiente',
    preparing: 'Preparando',
    confirmed: 'Confirmado',
    ready: 'Listo',
    on_the_way: 'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  const typeBorder = order.type === 'restaurante'
    ? 'border-l-4 border-l-green-500'
    : 'border-l-4 border-l-orange-500';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-all ${typeBorder} ${timerBg}`}
      onClick={onView}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-bold text-sm text-gray-900">
            {order.orderNumber ?? order.id}
          </span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${order.type === 'restaurante' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {order.type === 'restaurante' ? '🍽️' : '🚚'}
          </span>
        </div>
        {showTimer && (
          <span className={`text-xs font-medium ${timerColor}`}>
            ⏱ {timer} min
          </span>
        )}
      </div>

      {/* Customer */}
      <p className="text-sm font-medium text-gray-800 truncate">{order.customer}</p>

      {/* Details */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>{order.items} items</span>
        <span className="font-medium text-gray-700">${order.total.toLocaleString()}</span>
      </div>

      {/* Status & Time */}
      <div className="flex justify-between items-center mt-2">
        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
          {statusText[order.status] || order.status}
        </span>
        <span className="text-xs text-gray-500">{order.time}</span>
      </div>
    </div>
  );
}

export function BusinessAdminPanel({ user, onLogout }: BusinessAdminPanelProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  // --- Product Filters ---
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');

  // --- Products State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // --- Load products from API on mount ---
  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      setIsLoadingProducts(true);
      try {
        const businessId = user.businessId || profileId;
        if (!businessId) return;

        const response = await fetch(`/api/products?businessId=${businessId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Oops, we haven't got JSON!");
        }

        const data = await response.json();

        if (data.success && data.data) {
          setProducts(data.data.products || []);
          setCategories(data.data.categories || defaultCategories);
          console.log('[Products] Loaded', data.data.products?.length || 0, 'products from API');
        }
      } catch (error) {
        console.error('[Products] Error loading products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // --- Product Form State ---
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Entradas',
    categoryId: 'cat-1',
    isAvailable: true,
    isFeatured: false,
    image: null as string | null,
    stock: 0,
    requiereEmpaque: true,
    // Campos de Oferta
    onSale: false,
    salePrice: 0,
    saleStartDate: '',
    saleEndDate: ''
  });

  // --- New Category State ---
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');

  // --- Image Upload State ---
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- Edit/Delete Product States ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- AI Product Creation States ---
  const [showAITextModal, setShowAITextModal] = useState(false);
  const [showAIVoiceModal, setShowAIVoiceModal] = useState(false);
  const [aiTextPrompt, setAiTextPrompt] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [aiGeneratedProduct, setAiGeneratedProduct] = useState<{
    name: string;
    description: string;
    price: number;
    category: string;
    categoryId: string;
    image: string | null;
  } | null>(null);

  // --- AI Service Verification States ---
  const [hasCatalogAI, setHasCatalogAI] = useState<boolean>(false);
  const [hasReviews, setHasReviews] = useState<boolean>(false);
  const [isCheckingAI, setIsCheckingAI] = useState<boolean>(true);

  // --- Subscription States ---
  const [availablePlans, setAvailablePlans] = useState<Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    period: string;
    features: string;
    isActive: boolean;
    isPublic: boolean;
    isPopular: boolean;
    order: number;
    icon: string;
    color: string;
    maxUsers: number;
    maxProducts: number;
    maxCategories: number;
    hotmartUrl?: string | null;
  }>>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<{
    id: string;
    name: string;
    price: number;
    startDate: string;
    endDate: string;
    status: string;
  } | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<{
    hotmartEnabled: boolean;
    nequiEnabled: boolean;
    bancolombiaEnabled: boolean;
    nequiPhone: string;
    nequiHolder: string;
    bancolombiaAccount: string;
  }>({
    hotmartEnabled: false,
    nequiEnabled: false,
    bancolombiaEnabled: false,
    nequiPhone: '',
    nequiHolder: '',
    bancolombiaAccount: ''
  });
  const [expandedPaymentMethod, setExpandedPaymentMethod] = useState<'nequi' | 'bancolombia' | null>(null);
  const [showHotmartModal, setShowHotmartModal] = useState(false);
  const [hotmartModalMessage, setHotmartModalMessage] = useState({ title: '', message: '' });

  // --- Speech Recognition Reference ---
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // --- Share Menu States ---
  const [menuSlug, setMenuSlug] = useState<string>('');
  const [menuSlugActive, setMenuSlugActive] = useState<boolean>(false);
  const [customShareMessage, setCustomShareMessage] = useState<string>('');
  const [customShareImage, setCustomShareImage] = useState<string | null>(null);
  const [isSavingShare, setIsSavingShare] = useState<boolean>(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);
  const [isUploadingShareImage, setIsUploadingShareImage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Profile Form States ---
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    slug: '',
    phone: '',
    address: '',
    primaryColor: '#8b5cf6',
    secondaryColor: '#ffffff',
    impoconsumo: 8,
    // Imágenes del negocio
    avatar: null as string | null,
    logo: null as string | null,
    banner: null as string | null,
    bannerEnabled: true,
    // Franja Hero Sutil
    heroImageUrl: null as string | null,
    showHeroBanner: false,
    // Favicon (Icono de Favoritos)
    favicon: null as string | null,
    // Propina Voluntaria
    tipEnabled: true,
    tipPercentageDefault: 10,
    tipOnlyOnPremise: true,
    // Métodos de Pago (Efectivo primero)
    paymentMethods: [
      { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true },
      { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
      { id: 'brepb', name: 'BRE-B', icon: '🔵', phone: '', accountHolder: '', qrImage: null, enabled: false },
      { id: 'daviplata', name: 'Daviplata', icon: '🔴', phone: '', accountHolder: '', qrImage: null, enabled: false },
      { id: 'bancolombia', name: 'Bancolombia', icon: '🟡', phone: '', accountHolder: '', qrImage: null, enabled: false }
    ] as PaymentMethodConfig[]
  });
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  // --- Invoice Settings State ---
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsType>({
    logo: {
      url: '',
      size: '80px',
      position: 'center'
    },
    header: {
      businessName: '',
      address: '',
      nit: '',
      phone: ''
    },
    fields: {
      showInvoiceNumber: true,
      showDateTime: true,
      showClientPhone: true,
      showClientAddress: true,
      showDeliveryFee: true,
      showPackaging: true,
      showPaymentMethod: true,
      showEstimatedDelivery: false
    },
    bold: {
      allBold: false,
      zones: {
        businessName: true,
        address: false,
        nit: false,
        invoiceNumber: true,
        dateTime: false,
        clientName: true,
        clientPhone: false,
        clientAddress: false,
        items: true,
        subtotalFees: false,
        total: true,
        qrText: false,
        socialMedia: false,
        footer: false,
        estimatedDelivery: false,
        paymentMethod: false
      }
    },
    promo: {
      show: false,
      text: ''
    },
    qr: {
      show: true,
      url: '',
      labelText: 'Escanea para ver nuestro menú',
      linkType: 'menu',
      customImageUrl: undefined
    },
    socialMedia: {
      show: false,
      instagram: '',
      whatsapp: '',
      facebook: ''
    },
    footer: {
      message: '¡Gracias por su compra!',
      repeatBusinessName: true
    },
    style: {
      font: 'monospace',
      fontSize: '12px',
      paperSize: '80mm',
      separatorStyle: 'dashed'
    }
  });
  const [isLoadingInvoiceSettings, setIsLoadingInvoiceSettings] = useState<boolean>(false);

  // --- Check if business has AI Catalog service active ---
  useEffect(() => {
    const checkCatalogAI = async (): Promise<void> => {
      setIsCheckingAI(true);
      try {
        const businessId = profileId ?? user.businessId;

        console.log('[AI Service] Checking AI service for business:', businessId);
        console.log('[AI Service] profileId:', profileId);
        console.log('[AI Service] user.businessId:', user.businessId);

        if (!businessId) {
          console.warn('[AI Service] No businessId available');
          setHasCatalogAI(false);
          setIsCheckingAI(false);
          return;
        }

        // Query business_services table - get all active services for this business
        const { data: businessServices, error: bsError } = await supabase
          .from('business_services')
          .select('service_id, status')
          .eq('business_id', businessId)
          .eq('status', 'active');

        console.log('[AI Service] business_services query result:', {
          data: businessServices,
          error: bsError
        });

        if (bsError) {
          // Si la tabla no existe, asumimos que no hay servicios configurados
          if (bsError.message.includes('Could not find the table')) {
            console.warn('[AI Service] Tabla business_services no existe. Ejecutar: supabase-create-business-services-table.sql');
            setHasCatalogAI(false);
            setIsCheckingAI(false);
            return;
          }

          console.error('[AI Service] Error checking business_services:', bsError.message || bsError);
          setHasCatalogAI(false);
          setIsCheckingAI(false);
          return;
        }

        if (!businessServices || businessServices.length === 0) {
          console.log('[AI Service] No active services found for business');
          setHasCatalogAI(false);
          setIsCheckingAI(false);
          return;
        }

        // Get service IDs
        const serviceIds = businessServices.map(bs => bs.service_id);
        console.log('[AI Service] Service IDs:', serviceIds);

        // Query services table to find "IA para Catálogo"
        const { data: services, error: svcError } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);

        console.log('[AI Service] services query result:', {
          data: services,
          error: svcError
        });

        if (svcError) {
          console.error('[AI Service] Error fetching services:', svcError.message || svcError);
          setHasCatalogAI(false);
          setIsCheckingAI(false);
          return;
        }

        // Check if "IA para Catálogo" exists in the list
        const hasCatalogService = services?.some(s => s.name === 'IA para Catálogo') || false;
        console.log('[AI Service] Has IA para Catálogo service:', hasCatalogService);

        setHasCatalogAI(hasCatalogService);
        console.log('[AI Service] Catalog AI service:', hasCatalogService ? 'ACTIVE' : 'INACTIVE');
      } catch (error) {
        console.error('[AI Service] Error:', error instanceof Error ? error.message : error);
        setHasCatalogAI(false);
      } finally {
        setIsCheckingAI(false);
      }
    };

    checkCatalogAI();
  }, [profileId, user.businessId]);

  // --- Check if business has Reviews service active ---
  useEffect(() => {
    const checkReviews = async (): Promise<void> => {
      try {
        const businessId = profileId ?? user.businessId;

        console.log('============================================');
        console.log('[Reviews Service] Starting check...');
        console.log('[Reviews Service] profileId:', profileId);
        console.log('[Reviews Service] user.businessId:', user.businessId);
        console.log('[Reviews Service] businessId resolved:', businessId);
        console.log('[Reviews Service] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

        if (!businessId) {
          console.warn('[Reviews Service] No businessId available - cannot check services');
          setHasReviews(false);
          return;
        }

        // Query business_services table - get all active services for this business
        console.log('[Reviews Service] Querying business_services for business_id:', businessId);
        const { data: businessServices, error: bsError } = await supabase
          .from('business_services')
          .select('service_id, status')
          .eq('business_id', businessId)
          .eq('status', 'active');

        console.log('[Reviews Service] business_services query result:', {
          data: businessServices,
          error: bsError,
          dataLength: businessServices?.length,
          errorMessage: bsError?.message
        });

        if (bsError) {
          console.error('[Reviews Service] RLS Error or table issue:', bsError.message || bsError);
          setHasReviews(false);
          return;
        }

        if (!businessServices || businessServices.length === 0) {
          console.log('[Reviews Service] No active services found for business - table is EMPTY for this business');
          console.log('[Reviews Service] DID YOU activate the service in Super Admin → Negocios → Servicios Activos?');
          setHasReviews(false);
          return;
        }

        // Get service IDs
        const serviceIds = businessServices.map(bs => bs.service_id);
        console.log('[Reviews Service] Service IDs found:', serviceIds);

        // Query services table to find "Reseñas y Fidelización"
        console.log('[Reviews Service] Querying services table with IDs:', serviceIds);
        const { data: services, error: svcError } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);

        console.log('[Reviews Service] services query result:', {
          data: services,
          error: svcError,
          servicesCount: services?.length
        });

        if (svcError) {
          console.error('[Reviews Service] Error fetching services:', svcError.message || svcError);
          setHasReviews(false);
          return;
        }

        // Check if "Reseñas y Fidelización" exists in the list
        const hasReviewsService = services?.some(s => {
          console.log('[Reviews Service] Checking service:', s.name, '- Match:', s.name === 'Reseñas y Fidelización');
          return s.name === 'Reseñas y Fidelización';
        }) || false;

        console.log('[Reviews Service] Has Reviews service:', hasReviewsService);
        setHasReviews(hasReviewsService);
        console.log('[Reviews Service] Final result - hasReviews:', hasReviewsService ? 'ACTIVE ✅' : 'INACTIVE ❌');
        console.log('============================================');
      } catch (error) {
        console.error('[Reviews Service] Exception:', error instanceof Error ? error.message : error);
        setHasReviews(false);
      }
    };

    checkReviews();
  }, [profileId, user.businessId]);

  // --- Load Subscription Plans ---
  useEffect(() => {
    const loadSubscriptionData = async (): Promise<void> => {
      setIsLoadingPlans(true);
      try {
        // Cargar planes disponibles desde API
        const response = await fetch('/api/public/plans');
        const data = await response.json();

        console.log('[Subscription] Plans API response:', data);

        if (data.success && data.data) {
          setAvailablePlans(data.data);
          console.log('[Subscription] Loaded', data.data.length, 'plans from API');
          console.log('[Subscription] Plans:', data.data.map((p: { name: string; isActive: boolean; isPublic: boolean }) => ({
            name: p.name,
            isActive: p.isActive,
            isPublic: p.isPublic
          })));
        } else {
          console.error('[Subscription] Plans API returned error or empty data:', data);
        }

        // Cargar plan actual del negocio desde businesses table
        // NOTA: La columna en Supabase es planId (camelCase) y createdAt
        const { data: businessData, error } = await supabase
          .from('businesses')
          .select('id, name, planId, createdAt')
          .eq('id', user.businessId)
          .maybeSingle();

        if (error) {
          console.error('[Subscription] Error loading business:', error);
          console.error('[Subscription] Error details:', JSON.stringify(error, null, 2));
          console.error('[Subscription] User businessId:', user.businessId);
        } else if (businessData) {
          console.log('[Subscription] Business data loaded:', businessData);

          // Si businessData tiene planId, buscar el plan por ID
          // Si no, mostrar plan genérico
          if (businessData.planId) {
            const currentPlanData = data.data?.find((p: { id: string }) =>
              p.id === businessData.planId
            );

            if (currentPlanData) {
              setCurrentPlan({
                id: currentPlanData.id,
                name: currentPlanData.name,
                price: currentPlanData.price,
                startDate: businessData.createdAt,
                endDate: new Date(new Date(businessData.createdAt).setMonth(new Date(businessData.createdAt).getMonth() + 1)).toISOString(),
                status: 'active'
              });
            } else {
              // Plan no encontrado en la lista, usar info básica
              setCurrentPlan({
                id: 'unknown',
                name: 'Plan Básico',
                price: 0,
                startDate: businessData.createdAt,
                endDate: new Date(new Date(businessData.createdAt).setMonth(new Date(businessData.createdAt).getMonth() + 1)).toISOString(),
                status: 'active'
              });
            }
          } else {
            // No hay planId, usar plan por defecto (GRATIS)
            setCurrentPlan({
              id: 'free',
              name: 'Plan Gratuito',
              price: 0,
              startDate: businessData.createdAt,
              endDate: new Date(new Date(businessData.createdAt).setMonth(new Date(businessData.createdAt).getMonth() + 1)).toISOString(),
              status: 'active'
            });
          }

          console.log('[Subscription] Current plan set to:', currentPlan);
        } else {
          console.warn('[Subscription] No business data found for user:', user.businessId);
          // Si no hay negocio, usar plan gratuito por defecto para mostrar la UI
          setCurrentPlan({
            id: 'free',
            name: 'Plan Gratuito',
            price: 0,
            startDate: new Date().toISOString(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            status: 'active'
          });
        }

        // Cargar métodos de pago activos desde API (configurado por Super Admin en Supabase)
        // FALLBACK: Si la tabla no existe, usa localStorage
        try {
          console.log('============================================');
          console.log('[Subscription] Loading payment config from API...');
          const response = await fetch('/api/payment-config');
          const data = await response.json();

          console.log('[Subscription] API response:', data);
          console.log('[Subscription] API data.hotmart:', data.data?.hotmart);
          console.log('[Subscription] API data.nequi:', data.data?.nequi);
          console.log('[Subscription] API data.bancolombia:', data.data?.bancolombia);

          if (data.success && data.data) {
            const paymentConfig = data.data;
            console.log('[Subscription] Payment config loaded from API:', paymentConfig);
            console.log('[Subscription] hotmart.enabled:', paymentConfig.hotmart?.enabled);
            console.log('[Subscription] nequi.enabled:', paymentConfig.nequi?.enabled);
            console.log('[Subscription] bancolombia.enabled:', paymentConfig.bancolombia?.enabled);

            setPaymentMethods({
              hotmartEnabled: paymentConfig.hotmart?.enabled || false,
              nequiEnabled: paymentConfig.nequi?.enabled || false,
              bancolombiaEnabled: paymentConfig.bancolombia?.enabled || false,
              nequiPhone: paymentConfig.nequi?.accountNumber || '',
              nequiHolder: paymentConfig.nequi?.accountHolder || '',
              bancolombiaAccount: paymentConfig.bancolombia?.accountNumber || ''
            });
            
            console.log('[Subscription] paymentMethods set to:', {
              hotmartEnabled: paymentConfig.hotmart?.enabled,
              nequiEnabled: paymentConfig.nequi?.enabled,
              bancolombiaEnabled: paymentConfig.bancolombia?.enabled
            });
          } else {
            console.warn('[Subscription] API returned error, trying localStorage fallback...');
            // Fallback a localStorage
            const storedConfig = localStorage.getItem('minimenu_payment_config');
            if (storedConfig) {
              const paymentConfig = JSON.parse(storedConfig);
              console.log('[Subscription] Payment config loaded from localStorage:', paymentConfig);
              setPaymentMethods({
                hotmartEnabled: paymentConfig.hotmart?.enabled || false,
                nequiEnabled: paymentConfig.nequi?.enabled || false,
                bancolombiaEnabled: paymentConfig.bancolombia?.enabled || false,
                nequiPhone: paymentConfig.nequi?.accountNumber || '',
                nequiHolder: paymentConfig.nequi?.accountHolder || '',
                bancolombiaAccount: paymentConfig.bancolombia?.accountNumber || ''
              });
            } else {
              console.warn('[Subscription] No payment config in localStorage either');
              setPaymentMethods({
                hotmartEnabled: false,
                nequiEnabled: false,
                bancolombiaEnabled: false,
                nequiPhone: '',
                nequiHolder: '',
                bancolombiaAccount: ''
              });
            }
          }
          console.log('============================================');
        } catch (error) {
          console.error('[Subscription] Error loading from API, trying localStorage fallback:', error);
          // Fallback a localStorage si la API falla
          try {
            const storedConfig = localStorage.getItem('minimenu_payment_config');
            if (storedConfig) {
              const paymentConfig = JSON.parse(storedConfig);
              console.log('[Subscription] Payment config loaded from localStorage:', paymentConfig);
              setPaymentMethods({
                hotmartEnabled: paymentConfig.hotmart?.enabled || false,
                nequiEnabled: paymentConfig.nequi?.enabled || false,
                bancolombiaEnabled: paymentConfig.bancolombia?.enabled || false,
                nequiPhone: paymentConfig.nequi?.accountNumber || '',
                nequiHolder: paymentConfig.nequi?.accountHolder || '',
                bancolombiaAccount: paymentConfig.bancolombia?.accountNumber || ''
              });
            } else {
              console.warn('[Subscription] No payment config found anywhere');
              setPaymentMethods({
                hotmartEnabled: false,
                nequiEnabled: false,
                bancolombiaEnabled: false,
                nequiPhone: '',
                nequiHolder: '',
                bancolombiaAccount: ''
              });
            }
          } catch (fallbackError) {
            console.error('[Subscription] Error loading from localStorage:', fallbackError);
            setPaymentMethods({
              hotmartEnabled: false,
              nequiEnabled: false,
              bancolombiaEnabled: false,
              nequiPhone: '',
              nequiHolder: '',
              bancolombiaAccount: ''
            });
          }
        }
      } catch (error) {
        console.error('[Subscription] Error loading data:', error);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    if (user.businessId) {
      console.log('[Subscription] useEffect triggered, businessId:', user.businessId);
      loadSubscriptionData();
    } else {
      console.warn('[Subscription] useEffect skipped, user.businessId is null');
    }
  }, [user.businessId]);

  // --- Order Detail States ---
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);
  const [isSavingOrderChanges, setIsSavingOrderChanges] = useState<boolean>(false);

  // --- Delivery Order States ---
  const [showDeliveryDetail, setShowDeliveryDetail] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [isSavingDeliveryChanges, setIsSavingDeliveryChanges] = useState<boolean>(false);
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'pending' | 'on_the_way' | 'delivered'>('all');
  const [deliverySearch, setDeliverySearch] = useState('');

  // --- Bulk Selection States (Pedidos) ---
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [orderDateFrom, setOrderDateFrom] = useState<string>('');
  const [orderDateTo, setOrderDateTo] = useState<string>('');
  const [showOrderDeleteConfirm, setShowOrderDeleteConfirm] = useState(false);
  const [isDeletingOrders, setIsDeletingOrders] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });

  // --- Bulk Selection States (Domicilios) ---
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<Set<string>>(new Set());
  const [deliveryDateFrom, setDeliveryDateFrom] = useState<string>('');
  const [deliveryDateTo, setDeliveryDateTo] = useState<string>('');
  const [showDeliveryDeleteConfirm, setShowDeliveryDeleteConfirm] = useState(false);
  const [isDeletingDeliveries, setIsDeletingDeliveries] = useState(false);
  const [deliveryDeleteProgress, setDeliveryDeleteProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });

  // --- Empaque States ---
  const [valorEmpaqueUnitario, setValorUnitarioEmpaque] = useState<number>(500);
  const [isSavingEmpaque, setIsSavingEmpaque] = useState<boolean>(false);

  // --- Printer States ---
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [printerToDelete, setPrinterToDelete] = useState<Printer | null>(null);
  const [showPrinterDeleteConfirm, setShowPrinterDeleteConfirm] = useState(false);
  const [printerForm, setPrinterForm] = useState({
    name: '',
    type: 'Térmica',
    area: 'Cocina',
    ip: '',
    port: 9100,
    isDefault: false,
    isActive: true
  });
  const [customPrinterTypes, setCustomPrinterTypes] = useState<string[]>([]);
  const [customPrinterAreas, setCustomPrinterAreas] = useState<string[]>([]);
  const [newPrinterType, setNewPrinterType] = useState('');
  const [newPrinterArea, setNewPrinterArea] = useState('');
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [isAddingNewArea, setIsAddingNewArea] = useState(false);

  // --- Pedidos Kanban States ---
  const [mobileOrderColumn, setMobileOrderColumn] = useState<'all' | 'restaurante' | 'domicilio'>('all');
  const [orderTimers, setOrderTimers] = useState<Map<string, number>>(new Map());
  const [pedidosSearchQuery, setPedidosSearchQuery] = useState('');
  const [pedidosStatusFilter, setPedidosStatusFilter] = useState<string>('all');
  const [pedidosDateFilter, setPedidosDateFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'restaurante' | 'domicilio';
    timestamp: Date;
  }>>([]);
  const [previousOrderCount, setPreviousOrderCount] = useState<number>(0);

  // --- TPV Domicilio States ---
  const [deliveryCart, setDeliveryCart] = useState<DeliveryCartItem[]>([]);
  const [deliveryCustomerName, setDeliveryCustomerName] = useState('');
  const [deliveryCustomerPhone, setDeliveryCustomerPhone] = useState('');
  const [deliveryCustomerAddress, setDeliveryCustomerAddress] = useState('');
  const [deliveryCustomerNeighborhood, setDeliveryCustomerNeighborhood] = useState('');
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [deliveryPaymentStatus, setDeliveryPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [deliveryFee, setDeliveryFee] = useState(5000);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
  const [isCreatingDeliveryInvoice, setIsCreatingDeliveryInvoice] = useState(false);
  const [deliveryInvoiceCreated, setDeliveryInvoiceCreated] = useState(false);
  const [lastDeliveryInvoiceNumber, setLastDeliveryInvoiceNumber] = useState('');
  const [deliveryInvoices, setDeliveryInvoices] = useState<DeliveryInvoice[]>([]);
  const [isLoadingDeliveryInvoices, setIsLoadingDeliveryInvoices] = useState(false);
  const [deliveryViewMode, setDeliveryViewMode] = useState<'create' | 'list'>('list');

  // --- Delivery Invoice Modal States ---
  const [showDeliveryInvoiceDetail, setShowDeliveryInvoiceDetail] = useState(false);
  const [showDeliveryInvoiceEdit, setShowDeliveryInvoiceEdit] = useState(false);
  const [selectedDeliveryInvoice, setSelectedDeliveryInvoice] = useState<DeliveryInvoice | null>(null);
  const [editingDeliveryInvoice, setEditingDeliveryInvoice] = useState<DeliveryInvoice | null>(null);
  const [isSavingDeliveryInvoice, setIsSavingDeliveryInvoice] = useState(false);

  // --- Database Orders States (for Gestión de Pedidos) ---
  const [dbRestaurantOrders, setDbRestaurantOrders] = useState<Order[]>([]);
  const [dbDeliveryOrders, setDbDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // --- TPV Restaurante States ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [invoiceCustomerName, setInvoiceCustomerName] = useState('');
  const [invoiceCustomerPhone, setInvoiceCustomerPhone] = useState('');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(0);
  const [invoices, setInvoices] = useState<RestaurantInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoiceViewMode, setInvoiceViewMode] = useState<'create' | 'list'>('create');
  const [selectedInvoice, setSelectedInvoice] = useState<RestaurantInvoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  // --- Invoice Management States (Selection, Pagination, Filters, Bulk Operations) ---
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(20);
  const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
  const [invoiceDateTo, setInvoiceDateTo] = useState('');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeletingInvoices, setIsDeletingInvoices] = useState(false);
  const [invoiceToast, setInvoiceToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // --- Nuevas variables para selección por rango de fechas ---
  const [dateSelectionCount, setDateSelectionCount] = useState(0);

  // Load profile from API on mount
  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      setIsLoadingProfile(true);
      try {
        // First try to load from localStorage for instant display
        const savedProfile = localStorage.getItem('businessProfile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          
          // IGNORAR IDs estáticos de sesiones anteriores (ej: 'business-1')
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (parsed.id && !uuidRegex.test(parsed.id)) {
            console.warn('[Profile] Eliminando perfil viejo con ID inválido del localStorage:', parsed.id);
            localStorage.removeItem('businessProfile');
            localStorage.removeItem('businessProducts');
          } else {
            setProfileId(parsed.id);
            setProfileForm({
              businessName: parsed.name || '',
              slug: parsed.slug || '',
              phone: parsed.phone || '',
              address: parsed.address || '',
              primaryColor: parsed.primaryColor || '#8b5cf6',
              secondaryColor: parsed.secondaryColor || '#ffffff',
              impoconsumo: parsed.impoconsumo ?? 8,
              avatar: parsed.avatar || null,
              logo: parsed.logo || null,
              banner: parsed.banner || null,
              bannerEnabled: parsed.bannerEnabled ?? true,
              heroImageUrl: parsed.heroImageUrl || null,
              showHeroBanner: parsed.showHeroBanner ?? false,
              favicon: parsed.favicon || null,
              tipEnabled: parsed.tipEnabled ?? true,
              tipPercentageDefault: parsed.tipPercentageDefault ?? 10,
              tipOnlyOnPremise: parsed.tipOnlyOnPremise ?? true,
              paymentMethods: parsed.paymentMethods ?? [
                { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true },
                { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
                { id: 'brepb', name: 'BRE-B', icon: '🔵', phone: '', accountHolder: '', qrImage: null, enabled: false },
                { id: 'daviplata', name: 'Daviplata', icon: '🔴', phone: '', accountHolder: '', qrImage: null, enabled: false },
                { id: 'bancolombia', name: 'Bancolombia', icon: '🟡', phone: '', accountHolder: '', qrImage: null, enabled: false }
              ]
            });
            // Load empaque value
            if (parsed.valorEmpaqueUnitario !== undefined) {
              setValorUnitarioEmpaque(parsed.valorEmpaqueUnitario);
            }
          }
        }

        // Then sync with server
        const response = await fetch(`/api/settings/profile?businessId=${user.businessId}`);
        if (!response.ok) {
          throw new Error(`Profile fetch failed: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && data.data) {
          setProfileId(data.data.id);
          setProfileForm({
            businessName: data.data.name || '',
            slug: data.data.slug || '',
            phone: data.data.phone || '',
            address: data.data.address || '',
            primaryColor: data.data.primaryColor || '#8b5cf6',
            secondaryColor: data.data.secondaryColor || '#ffffff',
            impoconsumo: data.data.impoconsumo ?? 8,
            avatar: data.data.avatar || null,
            logo: data.data.logo || null,
            banner: data.data.banner || null,
            bannerEnabled: data.data.bannerEnabled ?? true,
            heroImageUrl: data.data.heroImageUrl || null,
            showHeroBanner: data.data.showHeroBanner ?? false,
            favicon: data.data.favicon || null,
            tipEnabled: data.data.tipEnabled ?? true,
            tipPercentageDefault: data.data.tipPercentageDefault ?? 10,
            tipOnlyOnPremise: data.data.tipOnlyOnPremise ?? true,
            paymentMethods: data.data.paymentMethods ?? [
              { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true },
              { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
              { id: 'brepb', name: 'BRE-B', icon: '🔵', phone: '', accountHolder: '', qrImage: null, enabled: false },
              { id: 'daviplata', name: 'Daviplata', icon: '🔴', phone: '', accountHolder: '', qrImage: null, enabled: false },
              { id: 'bancolombia', name: 'Bancolombia', icon: '🟡', phone: '', accountHolder: '', qrImage: null, enabled: false }
            ]
          });
          // Load empaque value from server
          if (data.data.valorEmpaqueUnitario !== undefined) {
            setValorUnitarioEmpaque(data.data.valorEmpaqueUnitario);
          }

          // Load products from Database
          try {
            const productsRes = await fetch(`/api/products?businessId=${data.data.id}`);
            if (productsRes.ok) {
              const productsData = await productsRes.json();
              if (productsData.success && productsData.data) {
                setProducts(productsData.data.products || []);
              }
            }
          } catch (prodErr) {
            console.error('[Catalog] Error loading products:', prodErr);
          }

          // --- Load Invoice Settings ---
          try {
            setIsLoadingInvoiceSettings(true);
            const settingsRes = await fetch(`/api/business/invoice-settings?businessId=${data.data.id}`);
            if (settingsRes.ok) {
              const settingsData = await settingsRes.json();
              if (settingsData.success && settingsData.data) {
                setInvoiceSettings(settingsData.data);
              }
            }
          } catch (settingsErr) {
            console.error('[Invoice] Error loading settings:', settingsErr);
          } finally {
            setIsLoadingInvoiceSettings(false);
          }
        }
      } catch (error) {
        console.error('[Profile] Error loading profile:', error);
        // Fallback to local if server fails
        const savedProfile = localStorage.getItem('businessProfile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfileId(parsed.id);
          setProfileForm({
            businessName: parsed.businessName || parsed.name || 'Mi Restaurante',
            slug: parsed.slug || '',
            phone: parsed.phone || '+57 300 000 0000',
            address: parsed.address || 'Dirección del negocio',
            primaryColor: parsed.primaryColor || '#8b5cf6',
            secondaryColor: parsed.secondaryColor || '#ffffff',
            impoconsumo: parsed.impoconsumo ?? 8,
            avatar: parsed.avatar || null,
            logo: parsed.logo || null,
            banner: parsed.banner || null,
            bannerEnabled: parsed.bannerEnabled ?? true,
            heroImageUrl: parsed.heroImageUrl || null,
            showHeroBanner: parsed.showHeroBanner ?? false,
            favicon: parsed.favicon || null,
            tipEnabled: parsed.tipEnabled ?? true,
            tipPercentageDefault: parsed.tipPercentageDefault ?? 10,
            tipOnlyOnPremise: parsed.tipOnlyOnPremise ?? true,
            paymentMethods: parsed.paymentMethods || [
              { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true },
              { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
              { id: 'brepb', name: 'BRE-B', icon: '🔵', phone: '', accountHolder: '', qrImage: null, enabled: false },
              { id: 'daviplata', name: 'Daviplata', icon: '🔴', phone: '', accountHolder: '', qrImage: null, enabled: false },
              { id: 'bancolombia', name: 'Bancolombia', icon: '🟡', phone: '', accountHolder: '', qrImage: null, enabled: false }
            ]
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // --- Calculate real-time stats from database orders ---
  const stats = useMemo(() => {
    // Definir "hoy" para Colombia/Local
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allOrders = [...dbRestaurantOrders, ...dbDeliveryOrders];

    // Pedidos de hoy
    const todayOrdersList = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt || '');
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && order.status !== 'cancelled';
    });

    // Pedidos pendientes (estados activos)
    const pendingOrdersList = allOrders.filter(order =>
      ['pending', 'preparing', 'confirmed', 'on_the_way'].includes(order.status)
    );

    return {
      todayOrders: todayOrdersList.length,
      todayRevenue: todayOrdersList.reduce((sum, order) => sum + (order.total || 0), 0),
      pendingOrders: pendingOrdersList.length,
      totalProducts: products.length
    };
  }, [dbRestaurantOrders, dbDeliveryOrders, products]);

  const sidebarItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'catalogo', label: 'Catálogo', icon: <Package className="w-5 h-5" /> },
      { id: 'pedidos', label: 'Gestión de Pedidos', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: 'tpv', label: 'Factura Restaurante', icon: <FileText className="w-5 h-5" /> },
      { id: 'domicilios', label: 'Facturación Domicilio', icon: <Truck className="w-5 h-5" /> },
      { id: 'configuracion-domicilio', label: 'Configuración Domicilio', icon: <Truck className="w-5 h-5" /> },
      { id: 'configuracion-factura', label: 'Editor Factura', icon: <FileText className="w-5 h-5" /> },
      { id: 'impresoras', label: 'Impresoras', icon: <PrinterIcon className="w-5 h-5" /> },
      { id: 'empaque', label: 'Empaque', icon: <Package className="w-5 h-5" /> },
      { id: 'backup', label: 'Backup', icon: <HardDrive className="w-5 h-5" /> },
      { id: 'compartir', label: 'Compartir Menú', icon: <Share2 className="w-5 h-5" /> },
      { id: 'suscripcion', label: 'Suscripción', icon: <CreditCard className="w-5 h-5" /> },
      { id: 'perfil', label: 'Mi Perfil', icon: <Settings className="w-5 h-5" /> }
    ];

    // Agregar Reseñas solo si el servicio está activo
    console.log('[Sidebar] hasReviews:', hasReviews);
    if (hasReviews) {
      console.log('[Sidebar] Adding Reseñas tab');
      items.push({ id: 'resenas', label: 'Reseñas', icon: <MessageSquare className="w-5 h-5" /> });
    } else {
      console.log('[Sidebar] NOT adding Reseñas tab - hasReviews is false');
    }

    console.log('[Sidebar] Total items:', items.length);
    console.log('[Sidebar] Items:', items.map(i => i.id));

    return items;
  }, [hasReviews]);

  // ============================================================
  // HELPER — Llama a GPT para generar datos del producto
  // ============================================================

  const fetchProductDataFromGPT = async (
    userPrompt: string
  ): Promise<{ name: string; description: string; price: number; category: string }> => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[fetchProductDataFromGPT] NEXT_PUBLIC_OPENAI_API_KEY no configurada en .env.local');
      throw new Error('Servicio de IA no configurado. Reinicia el servidor después de agregar OPENAI_API_KEY en .env.local');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente para restaurantes colombianos. Responde SOLO con JSON válido, sin markdown, sin texto adicional.'
          },
          {
            role: 'user',
            content: `Crea un producto de menú basado en: "${userPrompt}".
Responde SOLO con este JSON exacto:
{
  "name": "nombre del plato",
  "description": "descripción atractiva en 1 oración",
  "price": 25000,
  "category": "Platos Principales"
}
Categorías válidas: "Platos Principales", "Entradas", "Postres", "Bebidas".
El precio debe ser un número entero en pesos colombianos.`
          }
        ],
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      
      // Manejo especial para error 429 - Cuota excedida
      if (res.status === 429) {
        console.warn('[fetchProductDataFromGPT] Cuota de OpenAI excedida, usando fallback');
        return generateFallbackProduct(userPrompt);
      }
      
      throw new Error(`GPT error ${res.status}: ${errorText}`);
    }

    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new Error('Respuesta vacía de GPT');
    }

    const parsed: unknown = JSON.parse(content.trim());

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('name' in parsed) ||
      !('description' in parsed) ||
      !('price' in parsed) ||
      !('category' in parsed)
    ) {
      throw new Error('Estructura de respuesta inválida de GPT');
    }

    const product = parsed as { name: string; description: string; price: number; category: string };

    if (
      typeof product.name !== 'string' ||
      typeof product.description !== 'string' ||
      typeof product.price !== 'number' ||
      typeof product.category !== 'string'
    ) {
      throw new Error('Tipos de datos inválidos en respuesta de GPT');
    }

    return product;
  };

  // ============================================================
  // HELPER — Genera producto fallback cuando IA no está disponible
  // ============================================================

  const generateFallbackProduct = (
    userPrompt: string
  ): { name: string; description: string; price: number; category: string } => {
    // Determinar categoría basada en palabras clave
    const lowerPrompt = userPrompt.toLowerCase();
    let category = 'Platos Principales';
    
    if (lowerPrompt.includes('bebida') || lowerPrompt.includes('jugo') || lowerPrompt.includes('gaseosa') || lowerPrompt.includes('limonada') || lowerPrompt.includes('café') || lowerPrompt.includes('té')) {
      category = 'Bebidas';
    } else if (lowerPrompt.includes('postre') || lowerPrompt.includes('dulce') || lowerPrompt.includes('torta') || lowerPrompt.includes('pastel') || lowerPrompt.includes('helado') || lowerPrompt.includes('flan')) {
      category = 'Postres';
    } else if (lowerPrompt.includes('entrada') || lowerPrompt.includes('aperitivo') || lowerPrompt.includes('empanada') || lowerPrompt.includes('arepa') || lowerPrompt.includes('tequeño')) {
      category = 'Entradas';
    }

    // Extraer precio si se menciona (ej: "25 mil", "30000 pesos")
    const priceMatch = userPrompt.match(/(\d+)\s*(mil|pesos|cop)?/i);
    const extractedPrice = priceMatch ? parseInt(priceMatch[1]) * (priceMatch[2]?.toLowerCase() === 'mil' ? 1000 : 1) : 25000;

    // Generar nombre capitalizado
    const words = userPrompt.split(' ').filter(w => w.length > 3).slice(0, 4);
    const generatedName = words.length > 0
      ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : 'Nuevo Producto';

    return {
      name: generatedName,
      description: `Delicioso ${generatedName.toLowerCase()} preparado con ingredientes frescos y de alta calidad.`,
      price: extractedPrice,
      category: category
    };
  };

  // --- AI Product Creation Handlers ---
  const handleAITextCreate = async (): Promise<void> => {
    if (!aiTextPrompt.trim()) return;

    setIsAIProcessing(true);
    try {
      // Llamar al endpoint de generación de producto
      const productRes = await fetch('/api/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiTextPrompt })
      });

      const productData = await productRes.json();

      if (!productData.success || !productData.product) {
        setSpeechError(productData.error || 'Error al generar producto con IA');
        setIsAIProcessing(false);
        return;
      }

      // Llamar al endpoint de generación de imagen
      const imageRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${productData.product.name}, ${productData.product.description}`
        })
      });

      const imageData = await imageRes.json();

      if (!imageData.success || !imageData.image) {
        setSpeechError(imageData.error || 'Error al generar imagen');
        setIsAIProcessing(false);
        return;
      }

      setAiGeneratedProduct({
        name: productData.product.name,
        description: productData.product.description,
        price: productData.product.price,
        category: productData.product.category,
        categoryId: 'cat-1', image: imageData.image
      });

      // Informar si se usó fallback
      if (imageData.fallback || productData.product.name.includes('Nuevo Producto') || productData.product.description.includes('Delicioso')) {
        setSpeechError('⚠️ IA no disponible (cuota excedida). Se generó producto automáticamente. Puedes editarlo.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[handleAITextCreate] Error:', message);
      setSpeechError('Error al generar producto con IA. Intenta de nuevo.');
    } finally {
      setIsAIProcessing(false);
    }
  };

  // --- AI Image Generation Function (MOVED BEFORE handleAIVoiceCreate) ---
  const generateAIImage = useCallback(async (productName: string, description: string): Promise<string | null> => {
    setIsGeneratingImage(true);

    try {
      // Build effective prompt for food product image
      // IMPORTANTE: Instrucciones explícitas para NO incluir texto en la imagen
      const promptComponents: string[] = [
        `Professional food photography of ${productName}`,
        description || '',
        'appetizing presentation',
        'restaurant quality',
        'clean white plate',
        'soft natural lighting',
        'shallow depth of field',
        'high quality',
        'detailed',
        // Instrucciones críticas para evitar texto en la imagen
        'NO TEXT',
        'NO WORDS',
        'NO LABELS',
        'NO TITLES',
        'NO WRITING',
        'NO WATERMARKS',
        'pure image without any text overlay',
        'food only without text'
      ];

      const prompt = promptComponents.filter(Boolean).join(', ');

      console.log('[AI Image] Requesting image for:', productName);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

      let response: Response;

      try {
        response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            size: '1024x1024'
          }),
          signal: controller.signal
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle network-level errors
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('[AI Image] Request timed out');
          setSpeechError('La generación está tomando mucho tiempo. El producto se guardará sin imagen.');
          return null;
        }

        console.warn('[AI Image] Network error:', fetchError instanceof Error ? fetchError.message : 'Unknown');
        setSpeechError('Error de conexión. El producto se guardará sin imagen.');
        return null;
      }

      clearTimeout(timeoutId);

      // Handle HTTP error responses
      if (!response.ok) {
        let errorMessage = 'Error al generar la imagen';

        try {
          const responseText = await response.text();

          // Handle HTML error pages (502, 503, 504 from load balancers)
          if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
            const statusMessage = response.statusText || 'Service Unavailable';
            console.warn(`[AI Image] Server returned HTML error: ${response.status} ${statusMessage}`);

            // Map common status codes to user-friendly messages
            if (response.status === 502 || response.status === 503 || response.status === 504) {
              errorMessage = 'El servidor de imágenes está temporalmente no disponible. El producto se guardará sin imagen.';
            } else {
              errorMessage = `Error del servidor (${response.status}). El producto se guardará sin imagen.`;
            }
          } else if (responseText) {
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(responseText) as { error?: string };
              errorMessage = errorData.error || errorMessage;
            } catch {
              // Not JSON, use status text
              errorMessage = response.statusText || errorMessage;
            }
          }
        } catch {
          errorMessage = 'Error al procesar la respuesta del servidor';
        }

        console.warn('[AI Image] Generation failed:', errorMessage);
        setSpeechError(errorMessage);
        return null;
      }

      // Parse successful response
      let data: { success?: boolean; image?: string; error?: string; attempts?: number };

      try {
        data = await response.json();
      } catch {
        console.warn('[AI Image] Failed to parse JSON response');
        setSpeechError('Error al procesar la respuesta. El producto se guardará sin imagen.');
        return null;
      }

      // Validate response data
      if (!data.success || !data.image) {
        const errorMsg = data.error || 'Respuesta inválida del servidor';
        console.warn('[AI Image] Unsuccessful response:', errorMsg);
        setSpeechError(errorMsg);
        return null;
      }

      // Validate image format
      if (!data.image.startsWith('data:image/')) {
        console.warn('[AI Image] Invalid image format received');
        setSpeechError('Formato de imagen inválido. El producto se guardará sin imagen.');
        return null;
      }

      console.log('[AI Image] Image generated successfully', data.attempts ? `(${data.attempts} attempts)` : '');

      return data.image;

    } catch (unexpectedError) {
      const errorMsg = unexpectedError instanceof Error ? unexpectedError.message : 'Error desconocido';
      console.warn('[AI Image] Unexpected error:', errorMsg);
      setSpeechError('Error inesperado. El producto se guardará sin imagen.');
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  }, []);

  // --- Process Transcript Function (MOVED BEFORE handleAIVoiceCreate) ---
  const processTranscript = useCallback(async (transcript: string): Promise<void> => {
    if (!transcript.trim()) {
      setSpeechError('No se detectó ninguna descripción. Por favor intenta de nuevo.');
      return;
    }

    setIsAIProcessing(true);
    try {
      // Llamar al endpoint de generación de producto
      const productRes = await fetch('/api/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: transcript })
      });

      const productData = await productRes.json();

      if (!productData.success || !productData.product) {
        setSpeechError(productData.error || 'Error al generar producto con IA');
        setIsAIProcessing(false);
        return;
      }

      // Llamar al endpoint de generación de imagen
      const imageRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${productData.product.name}, ${productData.product.description}`
        })
      });

      const imageData = await imageRes.json();

      if (!imageData.success || !imageData.image) {
        setSpeechError(imageData.error || 'Error al generar imagen');
        setIsAIProcessing(false);
        return;
      }

      setAiGeneratedProduct({
        name: productData.product.name,
        description: productData.product.description,
        price: productData.product.price,
        category: productData.product.category,
        categoryId: 'cat-1', image: imageData.image
      });

      // Informar si se usó fallback
      if (imageData.fallback || productData.product.name.includes('Nuevo Producto') || productData.product.description.includes('Delicioso')) {
        setSpeechError('⚠️ IA no disponible (cuota excedida). Se generó producto automáticamente.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[processTranscript] Error:', message);
      setSpeechError('Error al procesar la descripción. Intenta de nuevo.');
    } finally {
      setIsAIProcessing(false);
    }
  }, []);

  const handleAIVoiceCreate = useCallback((): void => {
    // Check if Speech Recognition is available
    const SpeechRecognitionAPI = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognitionAPI) {
      setSpeechError('Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o Edge.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      // Stop recording
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    // Start recording
    setSpeechError(null);
    setAiTextPrompt('');
    setAiGeneratedProduct(null);
    setIsRecording(true);

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setAiTextPrompt(transcript);

      // Check if this is the final result
      if (event.results[0]?.isFinal) {
        setIsRecording(false);
        processTranscript(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      let errorMessage = 'Error desconocido al grabar audio';

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Permiso de micrófono denegado. Por favor permite el acceso al micrófono.';
          break;
        case 'no-speech':
          errorMessage = 'No se detectó voz. Por favor intenta de nuevo.';
          break;
        case 'audio-capture':
          errorMessage = 'No se encontró micrófono. Verifica que tengas un micrófono conectado.';
          break;
        case 'network':
          errorMessage = 'Error de red. Verifica tu conexión a internet.';
          break;
        case 'aborted':
          errorMessage = 'Grabación cancelada.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setSpeechError(errorMessage);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (error) {
      setIsRecording(false);
      setSpeechError('Error al iniciar el reconocimiento de voz');
      console.error('Speech recognition error:', error);
    }
  }, [isRecording, processTranscript]);

  // --- Product Save Functions ---
  const addProductToList = async (product: Omit<Product, 'id'>): Promise<void> => {
    try {
      const currentBusinessId = profileId ?? user.businessId;
      
      // Validar formato UUID (8-4-4-4-12 hex)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(currentBusinessId || '')) {
        console.error('[Products] Invalid businessId format detectado en frontend:', currentBusinessId);
        setToastMessage({ 
          type: 'error', 
          message: 'Error de sesión: ID de negocio inválido. Intenta cerrar sesión y volver a entrar.' 
        });
        return;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          businessId: currentBusinessId
        })
      });

      const data = await response.json();

      if (data.success && data.data && data.data.products && data.data.products.length > 0) {
        const newProduct = data.data.products[0];
        setProducts(prev => {
          const newProducts = [...prev, newProduct as Product];
          localStorage.setItem('businessProducts', JSON.stringify(newProducts));
          return newProducts;
        });
        console.log('[Products] Added product:', newProduct.name);

        // Update categories if a new one was added
        if (newProduct.category && !categories.find(c => c.name === newProduct.category)) {
          setCategories(prev => [...prev, {
            id: `cat-${Date.now()}`,
            businessId: profileId || 'default',
            name: newProduct.category,
            description: '',
            icon: '🍴',
            isActive: true,
            order: prev.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]);
        }
      } else {
        console.error('[Products] Failed to add product:', data.error || 'Error desconocido');
        setToastMessage({ type: 'error', message: data.error || 'Error al crear el producto' });
      }
    } catch (error) {
      console.error('[Products] Error adding product:', error);
    }
  };

  // --- Image Upload Functions ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setProductForm(prev => ({ ...prev, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (): void => {
    setImagePreview(null);
    setProductForm(prev => ({ ...prev, image: null }));
  };

  const handleSaveAIProduct = (): void => {
    if (!aiGeneratedProduct) return;

    addProductToList({
      businessId: profileId || user.businessId || 'default',
      categoryId: aiGeneratedProduct.categoryId || 'default',
      name: aiGeneratedProduct.name,
      description: aiGeneratedProduct.description,
      price: aiGeneratedProduct.price,
      currency: 'COP',
      category: aiGeneratedProduct.category,
      isAvailable: true,
      isFeatured: false,
      image: aiGeneratedProduct.image,
      stock: 0,
      order: products.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Omit<Product, 'id'>);

    setShowAITextModal(false);
    setShowAIVoiceModal(false);
    setAiGeneratedProduct(null);
    setAiTextPrompt('');
  };

  const handleSaveProduct = async (): Promise<void> => {
    if (!productForm.name.trim() || productForm.price <= 0) return;

    if (editingProduct) {
      // Update existing product via API
      const currentBusinessId = profileId ?? user.businessId;

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(currentBusinessId || '')) {
        console.error('[Products] Invalid businessId format detectado en edición:', currentBusinessId);
        setToastMessage({ 
          type: 'error', 
          message: 'Error de sesión: ID de negocio inválido.' 
        });
        return;
      }

      try {
        const response = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            businessId: currentBusinessId,
            ...productForm
          })
        });

        const data = await response.json();

        if (data.success && data.product) {
          setProducts(prev => {
            const newProducts = prev.map(p =>
              p.id === editingProduct.id
                ? (data.product as Product)
                : p
            );
            localStorage.setItem('businessProducts', JSON.stringify(newProducts));
            return newProducts;
          });
          console.log('[Products] Updated product:', data.product.name);
        }
      } catch (error) {
        console.error('[Products] Error updating product:', error);
      }
      setEditingProduct(null);
    } else {
      // Create new product via API
      await addProductToList({
        businessId: profileId || user.businessId || 'default',
        categoryId: productForm.categoryId,
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        currency: 'COP',
        category: productForm.category,
        isAvailable: productForm.isAvailable,
        isFeatured: productForm.isFeatured,
        image: productForm.image,
        stock: productForm.stock,
        requiereEmpaque: productForm.requiereEmpaque,
        onSale: productForm.onSale,
        salePrice: productForm.salePrice,
        saleStartDate: productForm.saleStartDate,
        saleEndDate: productForm.saleEndDate,
        order: products.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Omit<Product, 'id'>);
    }

    setShowProductModal(false);
    resetProductForm();
  };

  const openEditProduct = (product: Product): void => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category || 'Entradas',
      categoryId: product.categoryId || 'cat-1',
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      image: product.image,
      stock: product.stock ?? 0,
      requiereEmpaque: product.requiereEmpaque ?? true,
      // Campos de Oferta
      onSale: product.onSale ?? false,
      salePrice: product.salePrice ?? 0,
      saleStartDate: product.saleStartDate ?? '',
      saleEndDate: product.saleEndDate ?? ''
    });
    setImagePreview(product.image);
    setShowProductModal(true);
  };

  const openDeleteConfirm = (product: Product): void => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProduct = async (): Promise<void> => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products?id=${productToDelete.id}&businessId=${profileId ?? user.businessId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setProducts(prev => {
          const newProducts = prev.filter(p => p.id !== productToDelete.id);
          localStorage.setItem('businessProducts', JSON.stringify(newProducts));
          return newProducts;
        });
        console.log('[Products] Deleted product:', productToDelete.name);
      }
    } catch (error) {
      console.error('[Products] Error deleting product:', error);
    }

    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const resetProductForm = (): void => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      category: 'Entradas',
      categoryId: 'cat-1',
      isAvailable: true,
      isFeatured: false,
      image: null,
      stock: 0,
      requiereEmpaque: true,
      onSale: false,
      salePrice: 0,
      saleStartDate: '',
      saleEndDate: ''
    });
    setImagePreview(null);
    setEditingProduct(null);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setNewCategoryIcon('📦');
  };

  // --- Create New Category Function ---
  const handleCreateCategory = (): void => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      return; // Category already exists
    }

    // Create new category
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      businessId: profileId || 'default',
      name: trimmedName,
      description: '',
      icon: newCategoryIcon,
      isActive: true,
      order: categories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to categories list
    setCategories(prev => [...prev, newCategory]);

    // Select the new category in the form
    setProductForm(prev => ({ ...prev, category: trimmedName }));

    // Reset new category input
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setNewCategoryIcon('📦');

    console.log('[Categories] Created new category:', trimmedName);
  };

  // ============================================================================
  // TPV DOMICILIO FUNCTIONS
  // ============================================================================

  // Add product to delivery cart
  const addToDeliveryCart = (product: Product): void => {
    setDeliveryCart(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: product.price,
        stock: product.stock,
        requiereEmpaque: product.requiereEmpaque ?? true
      } as DeliveryCartItem];
    });
  };

  // Remove product from delivery cart
  const removeFromDeliveryCart = (productId: string): void => {
    setDeliveryCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Update delivery cart quantity
  const updateDeliveryCartQuantity = (productId: string, quantity: number): void => {
    if (quantity <= 0) {
      removeFromDeliveryCart(productId);
      return;
    }
    setDeliveryCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Get delivery cart totals
  const getDeliveryCartTotals = (): { subtotal: number; empaqueTotal: number; total: number; itemCount: number } => {
    const subtotal = deliveryCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const empaqueTotal = deliveryCart.reduce((sum, item) => {
      if (item.requiereEmpaque) {
        return sum + (valorEmpaqueUnitario * item.quantity);
      }
      return sum;
    }, 0);
    const total = subtotal + deliveryFee + empaqueTotal;
    const itemCount = deliveryCart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, empaqueTotal, total, itemCount };
  };

  // Clear delivery cart
  const clearDeliveryCart = (): void => {
    setDeliveryCart([]);
    setDeliveryCustomerName('');
    setDeliveryCustomerPhone('');
    setDeliveryCustomerAddress('');
    setDeliveryCustomerNeighborhood('');
    setDeliveryPaymentMethod('cash');
    setDeliveryPaymentStatus('pending');
    setDeliveryNotes('');
    setDeliveryInvoiceCreated(false);
    setLastDeliveryInvoiceNumber('');
  };

  // Create delivery invoice
  const handleCreateDeliveryInvoice = async (): Promise<void> => {
    if (deliveryCart.length === 0 || !deliveryCustomerName.trim() || !deliveryCustomerPhone.trim() || !deliveryCustomerAddress.trim()) {
      return;
    }

    setIsCreatingDeliveryInvoice(true);

    try {
      const { subtotal, empaqueTotal, total, itemCount } = getDeliveryCartTotals();
      const now = new Date();
      
      // Generate invoice number matching the order number format (ORD-0001, ORD-0002, etc.)
      // This ensures consistency with the order number shown in Gestión de Pedidos - Domicilio column
      const nextInvoiceNum = deliveryInvoices.length + 1;
      const invoiceNumber = `ORD-${String(nextInvoiceNum).padStart(4, '0')}`;

      const newInvoice: DeliveryInvoice = {
        id: `DEL-${Date.now()}`,
        invoiceNumber,  // Same as orderNumber (ORD-0001)
        orderNumber: invoiceNumber,  // Add orderNumber field for consistency
        customerName: deliveryCustomerName,
        customerPhone: deliveryCustomerPhone,
        customerAddress: deliveryCustomerAddress,
        customerNeighborhood: deliveryCustomerNeighborhood,
        items: [...deliveryCart],
        subtotal,
        deliveryFee,
        empaqueTotal,
        total,
        paymentMethod: deliveryPaymentMethod,
        paymentStatus: deliveryPaymentStatus,
        notes: deliveryNotes,
        status: 'pending',
        createdAt: now.toISOString(),
        estimatedDelivery: new Date(now.getTime() + 45 * 60000).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };

      // Save to localStorage
      const savedInvoices = localStorage.getItem('deliveryInvoices');
      const existingInvoices: DeliveryInvoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
      const updatedInvoices = [newInvoice, ...existingInvoices];
      localStorage.setItem('deliveryInvoices', JSON.stringify(updatedInvoices));

      setDeliveryInvoices(updatedInvoices);
      setLastDeliveryInvoiceNumber(invoiceNumber);
      setDeliveryInvoiceCreated(true);

      console.log('[DeliveryInvoice] Created:', invoiceNumber);
    } catch (error) {
      console.error('[DeliveryInvoice] Error creating invoice:', error);
    } finally {
      setIsCreatingDeliveryInvoice(false);
    }
  };

  // Load delivery invoices from localStorage AND database (public cart orders)
  const loadDeliveryInvoices = async (): Promise<void> => {
    setIsLoadingDeliveryInvoices(true);
    try {
      // 1. Load from localStorage (created from admin panel)
      const savedInvoices = localStorage.getItem('deliveryInvoices');
      let localInvoices: DeliveryInvoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];

      // Fix: Update old invoices with long format to use short ORD-XXXX format
      let needsUpdate = false;
      localInvoices = localInvoices.map((invoice, index) => {
        // Check if invoice has long format (DOM-20260312-XXXXXX or FAC-DOM-*)
        if (invoice.invoiceNumber.startsWith('DOM-') || invoice.invoiceNumber.startsWith('FAC-DOM-')) {
          // Generate new short format based on position in list
          const newInvoiceNumber = `ORD-${String(localInvoices.length - index).padStart(4, '0')}`;
          needsUpdate = true;
          return {
            ...invoice,
            invoiceNumber: newInvoiceNumber,
            orderNumber: newInvoiceNumber
          };
        }
        // Ensure orderNumber is set for consistency
        if (!invoice.orderNumber) {
          return { ...invoice, orderNumber: invoice.invoiceNumber };
        }
        return invoice;
      });

      // Save updated invoices back to localStorage if changes were made
      if (needsUpdate) {
        localStorage.setItem('deliveryInvoices', JSON.stringify(localInvoices));
        console.log('[DeliveryInvoices] Updated old invoice numbers to short format');
      }

      // 2. Load from database (created from public cart "Tu pedido")
      let dbInvoices: DeliveryInvoice[] = [];
      try {
        // Use real business ID from profile or user state
        const businessId = profileId || user.businessId;
        if (!businessId) {
          console.warn('[DeliveryInvoices] No businessId available to load from DB');
          return;
        }
        const response = await fetch(`/api/orders?businessId=${businessId}&orderType=DELIVERY`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Convert database orders to DeliveryInvoice format
            // Note: Prisma schema uses productName and unitPrice, not name and price
            dbInvoices = data.data.map((order: {
              id: string;
              orderNumber?: string;
              invoiceNumber?: string;
              customerName: string;
              customerPhone?: string;
              customerAddress?: string;
              items: Array<{
                productId: string;
                productName: string;
                unitPrice: number;
                quantity: number;
              }>;
              subtotal: number;
              deliveryFee: number;
              total: number;
              paymentMethod?: string;
              paymentStatus: string;
              status: string;
              createdAt: string;
              estimatedDelivery?: string;
              neighborhood?: string;
              notes?: string;
            }): DeliveryInvoice => ({
              id: order.id,
              orderNumber: order.orderNumber, // Número amigable (ORD-0001)
              invoiceNumber: order.orderNumber ?? order.invoiceNumber ?? `PED-${order.id.slice(-6)}`,  // Use orderNumber as invoiceNumber
              customerName: order.customerName,
              customerPhone: order.customerPhone ?? '',
              customerAddress: order.customerAddress ?? '',
              customerNeighborhood: order.neighborhood ?? '',
              items: order.items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                totalPrice: item.unitPrice * item.quantity,
                stock: 0,
                requiereEmpaque: false
              })),
              subtotal: order.subtotal,
              deliveryFee: order.deliveryFee,
              empaqueTotal: 0,
              total: order.total,
              paymentMethod: (order.paymentMethod === 'Efectivo' || order.paymentMethod === 'cash') ? 'cash' :
                (order.paymentMethod === 'Tarjeta' || order.paymentMethod === 'card') ? 'card' : 'transfer',
              paymentStatus: order.paymentStatus === 'PAID' ? 'paid' : 'pending',
              notes: order.notes ?? '',
              status: order.status === 'PENDING' ? 'pending' :
                order.status === 'CONFIRMED' ? 'confirmed' :
                  order.status === 'PREPARING' ? 'preparing' :
                    order.status === 'ON_THE_WAY' ? 'on_the_way' :
                      order.status === 'DELIVERED' ? 'delivered' : 'pending',
              createdAt: order.createdAt,
              estimatedDelivery: order.estimatedDelivery ?? ''
            }));
          }
        }
      } catch (dbError) {
        console.error('[DeliveryInvoices] Error loading from DB:', dbError);
      }

      // 3. Combine and deduplicate by id
      const allInvoices = [...localInvoices];
      for (const dbInvoice of dbInvoices) {
        if (!allInvoices.some(inv => inv.id === dbInvoice.id)) {
          allInvoices.push(dbInvoice);
        }
      }

      // 4. Sort by createdAt descending
      allInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setDeliveryInvoices(allInvoices);
      console.log(`[DeliveryInvoices] Loaded ${localInvoices.length} local + ${dbInvoices.length} from DB = ${allInvoices.length} total`);
    } catch (error) {
      console.error('[DeliveryInvoices] Error loading:', error);
    } finally {
      setIsLoadingDeliveryInvoices(false);
    }
  };

  // Load ALL orders from database for "Gestión de Pedidos"
  const loadAllOrdersFromDatabase = async (): Promise<void> => {
    setIsLoadingOrders(true);
    try {
      const businessId = user.businessId || profileId;
      if (!businessId) {
        console.warn('[Orders] No businessId available to load from DB');
        setIsLoadingOrders(false);
        return;
      }

      // Load restaurant orders
      const restaurantResponse = await fetch(`/api/orders?businessId=${businessId}&orderType=RESTAURANT`);
      const contentType1 = restaurantResponse.headers.get('content-type');
      if (restaurantResponse.ok && contentType1?.includes('application/json')) {
        const data = await restaurantResponse.json();
        if (data.success && data.data) {
          const orders: Order[] = data.data.map((order: {
            id: string;
            orderNumber?: string;
            customerName: string;
            items: Array<{ quantity: number }>;
            total: number;
            status: string;
            createdAt: string;
            customerPhone?: string;
            customerAddress?: string;
            notes?: string;
          }) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: order.customerName,
            items: order.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
            total: order.total,
            status: (order.status === 'PENDING' ? 'pending' :
              order.status === 'PREPARING' ? 'preparing' :
                order.status === 'READY' ? 'ready' :
                  order.status === 'DELIVERED' ? 'delivered' : 'pending') as Order['status'],
            time: new Date(order.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(order.createdAt).toLocaleDateString('es-CO'),
            phone: order.customerPhone,
            address: order.customerAddress,
            notes: order.notes, paymentStatus: (order as any).paymentStatus || 'pending', paymentMethod: (order as any).paymentMethod || 'cash',
            createdAt: order.createdAt
          }));
          setDbRestaurantOrders(orders);
          console.log(`[Orders] Loaded ${orders.length} restaurant orders from DB`);
        }
      }

      // Load delivery orders
      const deliveryResponse = await fetch(`/api/orders?businessId=${businessId}&orderType=DELIVERY`);
      const contentType2 = deliveryResponse.headers.get('content-type');
      if (deliveryResponse.ok && contentType2?.includes('application/json')) {
        const data = await deliveryResponse.json();
        if (data.success && data.data) {
          const orders: DeliveryOrder[] = data.data.map((order: {
            id: string;
            orderNumber?: string;
            invoiceNumber?: string;
            customerName: string;
            customerPhone?: string;
            customerAddress?: string;
            items: Array<{ quantity: number }>;
            subtotal: number;
            deliveryFee: number;
            total: number;
            status: string;
            paymentMethod?: string;
            paymentStatus: string;
            createdAt: string;
            estimatedDelivery?: string;
            neighborhood?: string;
            notes?: string;
          }) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            invoiceNumber: order.invoiceNumber ?? `DOM-${order.id.slice(-6)}`,
            customer: order.customerName,
            phone: order.customerPhone ?? '',
            address: order.customerAddress ?? '',
            neighborhood: order.neighborhood ?? '',
            items: order.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            total: order.total,
            status: (order.status === 'PENDING' ? 'pending' :
              order.status === 'CONFIRMED' ? 'confirmed' :
                order.status === 'PREPARING' ? 'preparing' :
                  order.status === 'ON_THE_WAY' ? 'on_the_way' :
                    order.status === 'DELIVERED' ? 'delivered' :
                      order.status === 'CANCELLED' ? 'cancelled' : 'pending') as DeliveryOrder['status'],
            paymentMethod: (order.paymentMethod === 'Efectivo' || order.paymentMethod === 'cash') ? 'cash' :
              (order.paymentMethod === 'Tarjeta' || order.paymentMethod === 'card') ? 'card' : 'transfer',
            paymentStatus: (order.paymentStatus === 'PAID' ? 'paid' :
              order.paymentStatus === 'REFUNDED' ? 'refunded' : 'pending') as DeliveryOrder['paymentStatus'],
            notes: order.notes,
            createdAt: order.createdAt,
            date: new Date(order.createdAt).toLocaleDateString('es-CO'),
            estimatedDelivery: order.estimatedDelivery ?? ''
          }));
          setDbDeliveryOrders(orders);
          console.log(`[Orders] Loaded ${orders.length} delivery orders from DB`);
        }
      }
    } catch (error) {
      console.error('[Orders] Error loading from database:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Get filtered products for delivery invoice
  const getFilteredProductsForDelivery = (): Product[] => {
    return products.filter(p => {
      if (!p.isAvailable) return false;
      if (deliverySearchQuery) {
        return p.name.toLowerCase().includes(deliverySearchQuery.toLowerCase());
      }
      return true;
    });
  };

  // ============================================================================
  // TPV RESTAURANTE FUNCTIONS
  // ============================================================================

  // Add product to cart
  const addToCart = (product: Product): void => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: product.price,
        stock: product.stock
      } as CartItem];
    });
  };

  // Remove product from cart
  const removeFromCart = (productId: string): void => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  // Update cart quantity
  const updateCartQuantity = (productId: string, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Get cart totals
  const getCartTotals = (): { subtotal: number; tax: number; total: number } => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const tax = Math.round(subtotal * (profileForm.impoconsumo / 100));
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // Clear cart
  const clearCart = (): void => {
    setCart([]);
    setInvoiceCustomerName('');
    setInvoiceCustomerPhone('');
    setInvoicePaymentMethod('cash');
  };

  // Create invoice
  const handleCreateInvoice = async (): Promise<void> => {
    if (cart.length === 0) {
      setInvoiceToast({ type: 'warning', message: 'El carrito está vacío' });
      return;
    }

    setIsCreatingInvoice(true);

    const totals = getCartTotals();
    const newInvoiceNumber = lastInvoiceNumber + 1;
    const businessId = profileId || user.businessId;

    if (!businessId) {
      console.error('[TPV] No businessId available');
      setInvoiceToast({ type: 'error', message: 'Error: No se pudo identificar el negocio' });
      setIsCreatingInvoice(false);
      return;
    }

    const newInvoice: RestaurantInvoice = {
      id: `inv-${Date.now()}`,
      businessId,
      invoiceNumber: `FAC-${String(newInvoiceNumber).padStart(4, '0')}`,
      customerName: invoiceCustomerName || 'Cliente Mostrador',
      customerPhone: invoiceCustomerPhone,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.unitPrice * item.quantity
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      paymentMethod: invoicePaymentMethod,
      status: 'paid',
      createdAt: new Date().toISOString()
    };

    try {
      console.log('[TPV] Creating invoice:', newInvoice);
      const response = await fetch('/api/restaurant-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
      });

      const result = await response.json();
      console.log('[TPV] API response:', result);

      if (response.ok && result.success) {
        setLastInvoiceNumber(newInvoiceNumber);
        setInvoices(prev => [result.invoice || newInvoice, ...prev]);
        clearCart();
        setInvoiceToast({ type: 'success', message: 'Factura creada exitosamente' });
        setTimeout(() => setInvoiceToast(null), 3000);
      } else {
        console.error('[TPV] API error:', result.error);
        setInvoiceToast({ type: 'error', message: result.error || 'Error al crear la factura' });
      }
    } catch (error) {
      console.error('[TPV] Error creating invoice:', error);
      setInvoiceToast({ type: 'error', message: 'Error de conexión al crear la factura' });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Load invoices (includes TPV invoices + RESTAURANT orders from cart)
  const loadInvoices = useCallback(async (): Promise<void> => {
    setIsLoadingInvoices(true);
    try {
      const businessId = profileId || user.businessId;
      if (!businessId) {
        console.warn('[Invoices] No businessId available to load from DB');
        setIsLoadingInvoices(false);
        return;
      }
      const response = await fetch(`/api/restaurant-invoice?businessId=${businessId}`);
      const data = await response.json();
      if (data.success && data.invoices) {
        setInvoices(data.invoices);
        // Get last invoice number - handle both FAC-XXXX and ORD-XXXX formats
        if (data.invoices.length > 0) {
          const lastNum = data.invoices.reduce((max: number, inv: RestaurantInvoice) => {
            // Extract number from FAC-0001 or ORD-0001 format
            const match = inv.invoiceNumber.match(/^(?:FAC|ORD)-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              return num > max ? num : max;
            }
            return max;
          }, 0);
          setLastInvoiceNumber(lastNum);
        }
      }
    } catch (error) {
      console.error('[TPV] Error loading invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [profileId]);

  // --- Invoice Detail Functions ---
  const openInvoiceDetail = (invoice: RestaurantInvoice): void => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  const closeInvoiceDetail = (): void => {
    setSelectedInvoice(null);
    setShowInvoiceDetail(false);
  };

  // --- Invoice Selection Functions ---
  const toggleInvoiceSelection = (invoiceId: string): void => {
    setSelectedInvoiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const toggleAllInvoices = (): void => {
    const filteredInvoices = getFilteredInvoices();
    if (selectedInvoiceIds.size === filteredInvoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(filteredInvoices.map(inv => inv.id)));
    }
  };

  // --- Filter Invoices by Date ---
  const getFilteredInvoices = (): RestaurantInvoice[] => {
    let filtered = invoices;

    if (invoiceDateFrom) {
      const fromDate = new Date(invoiceDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(inv => new Date(inv.createdAt) >= fromDate);
    }

    if (invoiceDateTo) {
      const toDate = new Date(invoiceDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => new Date(inv.createdAt) <= toDate);
    }

    return filtered;
  };

  // --- Get Paginated Invoices ---
  const getPaginatedInvoices = (): RestaurantInvoice[] => {
    const filtered = getFilteredInvoices();
    const start = (invoicePage - 1) * invoicePageSize;
    return filtered.slice(start, start + invoicePageSize);
  };

  // --- Get Total Pages ---
  const getTotalInvoicePages = (): number => {
    return Math.ceil(getFilteredInvoices().length / invoicePageSize);
  };

  // --- Clear Date Filters ---
  const clearInvoiceFilters = (): void => {
    setInvoiceDateFrom('');
    setInvoiceDateTo('');
    setInvoicePage(1);
  };

  // --- NUEVAS FUNCIONES PARA SELECCIÓN POR RANGO DE FECHAS Y BATCH >500 ---

  // Función para dividir array en chunks de tamaño específico (máximo 500 para Firestore)
  const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  // Seleccionar invoices por rango de fechas
  const selectInvoicesByDateRange = (): void => {
    if (!invoiceDateFrom || !invoiceDateTo) {
      showInvoiceToastMessage('warning', '⚠️ Debes seleccionar fecha inicio y fecha fin');
      return;
    }

    const fromDate = new Date(invoiceDateFrom);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(invoiceDateTo);
    toDate.setHours(23, 59, 59, 999);

    if (fromDate > toDate) {
      showInvoiceToastMessage('warning', '⚠️ La fecha inicio no puede ser mayor a la fecha fin');
      return;
    }

    const filtered = getFilteredInvoices();
    const invoicesInRange = filtered.filter(inv => {
      const invDate = new Date(inv.createdAt);
      return invDate >= fromDate && invDate <= toDate;
    });

    if (invoicesInRange.length === 0) {
      showInvoiceToastMessage('warning', '📭 No se encontraron facturas en ese rango de fechas');
      return;
    }

    const newIds = invoicesInRange.map(inv => inv.id);
    const merged = [...new Set([...Array.from(selectedInvoiceIds), ...newIds])];
    setSelectedInvoiceIds(new Set(merged));
    setDateSelectionCount(invoicesInRange.length);

    showInvoiceToastMessage('success', `✅ ${invoicesInRange.length} factura(s) seleccionada(s)`);
  };

  // Limpiar selección y date pickers
  const clearDateSelection = (): void => {
    setSelectedInvoiceIds(new Set());
    setDateSelectionCount(0);
    setInvoiceDateFrom('');
    setInvoiceDateTo('');
    setInvoicePage(1);
  };

  // --- Show Toast Notification ---
  const showInvoiceToastMessage = (type: 'success' | 'error' | 'warning', message: string): void => {
    setInvoiceToast({ type, message });
    setTimeout(() => setInvoiceToast(null), 4000);
  };

  // --- Delete Single Invoice ---
  const deleteSingleInvoice = async (invoiceId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/restaurant-invoice?id=${invoiceId}&businessId=${profileId ?? user.businessId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        showInvoiceToastMessage('success', 'Factura eliminada correctamente');
      } else {
        showInvoiceToastMessage('error', data.error || 'Error al eliminar factura');
      }
    } catch (error) {
      console.error('[Invoice] Error deleting:', error);
      showInvoiceToastMessage('error', 'Error al eliminar factura');
    }
  };

  // --- Bulk Delete Invoices (con Batch >500) ---
  const bulkDeleteInvoices = async (): Promise<void> => {
    if (selectedInvoiceIds.size === 0) {
      showInvoiceToastMessage('warning', 'No hay facturas seleccionadas');
      return;
    }

    const rangeText = (invoiceDateFrom && invoiceDateTo)
      ? `📅 Rango: ${invoiceDateFrom} → ${invoiceDateTo}`
      : dateSelectionCount > 0
        ? `📅 Selección por rango: ${dateSelectionCount} facturas`
        : '☑ Selección manual';

    // Guardar referencia antes de limpiar
    const idsToDelete = Array.from(selectedInvoiceIds);
    const totalToDelete = idsToDelete.length;

    if (!confirm(`¿Estás seguro de eliminar ${totalToDelete} factura(s)?\n${rangeText}\n\n⚠️ Esta acción NO se puede deshacer.`)) {
      return;
    }

    setIsDeletingInvoices(true);
    setDeleteProgress({ current: 0, total: totalToDelete, batch: 0, totalBatches: 0 });

    try {
      const BATCH_SIZE = 500;
      const chunks = chunkArray(idsToDelete, BATCH_SIZE);
      const totalBatches = chunks.length;

      setDeleteProgress({ current: 0, total: totalToDelete, batch: 0, totalBatches });

      let deletedCount = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batchNumber = i + 1;

        try {
          const response = await fetch('/api/restaurant-invoice/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ids: chunk,
              businessId: profileId ?? user.businessId
            })
          });

          const data = await response.json();

          if (data.success) {
            deletedCount += chunk.length;
            setDeleteProgress(prev => ({
              ...prev,
              current: deletedCount,
              batch: batchNumber
            }));
          } else {
            console.error('[Invoice] Error en batch', batchNumber, ':', data.error);
          }
        } catch (batchError) {
          console.error('[Invoice] Error procesando batch', batchNumber, ':', batchError);
        }

        // Pequeña pausa entre batches para no saturar
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Actualizar estado local
      setInvoices(prev => prev.filter(inv => !selectedInvoiceIds.has(inv.id)));
      setSelectedInvoiceIds(new Set());
      setShowBulkDeleteConfirm(false);
      clearDateSelection();

      setDeleteProgress(prev => ({ ...prev, current: totalToDelete }));

      showInvoiceToastMessage('success', `✅ ${deletedCount} de ${totalToDelete} factura(s) eliminada(s) correctamente`);

    } catch (error) {
      console.error('[Invoice] Error bulk deleting:', error);
      showInvoiceToastMessage('error', `❌ Error parcial: eliminadas ${deleteProgress.current} de ${totalToDelete}. Intenta de nuevo.`);
    } finally {
      setIsDeletingInvoices(false);
      setDeleteProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

  // --- Export Invoices to CSV ---
  const exportInvoicesToCSV = (): void => {
    const filtered = getFilteredInvoices();

    if (filtered.length === 0) {
      showInvoiceToastMessage('warning', 'No hay facturas para exportar');
      return;
    }

    const headers = ['Factura', 'Cliente', 'Teléfono', 'Items', 'Subtotal', 'Impuesto', 'Total', 'Método Pago', 'Estado', 'Fecha'];
    const rows = filtered.map(inv => [
      inv.invoiceNumber,
      inv.customerName,
      inv.customerPhone || '',
      inv.items.length.toString(),
      inv.subtotal.toString(),
      inv.tax.toString(),
      inv.total.toString(),
      inv.paymentMethod === 'cash' ? 'Efectivo' : inv.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia',
      inv.status === 'paid' ? 'Pagado' : inv.status === 'pending' ? 'Pendiente' : 'Cancelado',
      new Date(inv.createdAt).toLocaleDateString('es-CO')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showInvoiceToastMessage('success', `${filtered.length} factura(s) exportada(s) a CSV`);
  };

  // --- Unified Print Function for all POS Modules ---
  const handlePrintUnifiedTicket = (order: PrintableOrder): void => {
    const config = invoiceSettings;
    
    // Helper to determine if text should be bold
    const isBold = (zone: keyof InvoiceSettingsType['bold']['zones']): boolean => {
      if (config.bold.allBold) return true;
      return config.bold.zones[zone] ?? false;
    };

    // Determine font family
    const fontStack = config.style.font === 'monospace' ? 'monospace' : 'sans-serif';
    
    // QR Code URL logic
    let qrCodeUrl = '';
    if (config.qr.show) {
      if (config.qr.linkType === 'image' && config.qr.customImageUrl) {
        qrCodeUrl = config.qr.customImageUrl;
      } else {
        const qrData = config.qr.url || `FACTURA: ${order.invoiceNumber}\nCliente: ${order.customerName}\nTotal: $${order.total.toLocaleString()}`;
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
      }
    }

    const ticketContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Imprimir Factura - ${order.invoiceNumber}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${fontStack}; 
            font-size: ${config.style.fontSize}; 
            background: white;
            color: black;
            display: flex;
            justify-content: center;
            padding: 0;
          }
          .invoice-root { 
            width: 100%; 
            max-width: ${config.style.paperSize === '58mm' ? '58mm' : config.style.paperSize === 'A4' ? '190mm' : '80mm'};
            padding: 4mm;
            background: white;
          }
          /* Layout Utilities */
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .text-xs { font-size: 0.85em; }
          .font-bold { font-weight: bold; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mt-1 { margin-top: 0.25rem; }
          .my-2 { margin: 0.5rem 0; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .inline-block { display: inline-block; }
          
          /* Separators */
          .separator { 
            border-top: ${config.style.separatorStyle === 'solid' ? '2' : '1'}px ${config.style.separatorStyle === 'dashed' ? 'dashed' : config.style.separatorStyle === 'solid' ? 'solid' : 'none'} black;
            margin: 0.5rem 0;
            width: 100%;
          }
          
          .logo-container { margin-bottom: 0.5rem; }
          .logo-img { width: ${config.logo.size}; height: auto; }
          
          @media print {
            body { padding: 0; }
            @page { margin: 0; size: auto; }
            .invoice-root { width: 100%; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-root">
          <!-- Logo -->
          ${config.logo.url ? `
            <div class="logo-container ${config.logo.position === 'center' ? 'text-center' : config.logo.position === 'right' ? 'text-right' : 'text-left'}">
              <img src="${config.logo.url}" alt="Logo" class="logo-img">
            </div>
          ` : ''}

          <!-- Header -->
          <div class="text-center mb-2">
            <p class="${isBold('businessName') ? 'font-bold' : ''}">${config.header.businessName || profileForm.businessName || 'NOMBRE DEL NEGOCIO'}</p>
            <p class="text-xs ${isBold('address') ? 'font-bold' : ''}">${config.header.address || profileForm.address || 'Dirección del negocio'}</p>
            <p class="text-xs ${isBold('nit') ? 'font-bold' : ''}">${config.header.nit ? 'NIT: ' + config.header.nit : ''}</p>
          </div>

          <div class="separator"></div>

          <!-- Invoice Info -->
          <div class="mb-2">
            ${config.fields.showInvoiceNumber ? `<p class="${isBold('invoiceNumber') ? 'font-bold' : ''}">Factura: ${order.invoiceNumber}</p>` : ''}
            ${config.fields.showDateTime ? `<p class="text-xs ${isBold('dateTime') ? 'font-bold' : ''}">Fecha: ${order.dateTime}</p>` : ''}
          </div>

          <!-- Client Info -->
          <div class="mb-2">
            <p class="${isBold('clientName') ? 'font-bold' : ''}">Cliente: ${order.customerName}</p>
            ${config.fields.showClientPhone && order.customerPhone ? `<p class="text-xs ${isBold('clientPhone') ? 'font-bold' : ''}">Teléfono: ${order.customerPhone}</p>` : ''}
            ${config.fields.showClientAddress && order.customerAddress ? `<p class="text-xs ${isBold('clientAddress') ? 'font-bold' : ''}">Dirección: ${order.customerAddress}</p>` : ''}
          </div>

          <div class="separator"></div>

          <!-- Items -->
          <div class="mb-2">
            <p class="${isBold('items') ? 'font-bold' : ''}">Productos:</p>
            <div class="mt-1">
              ${order.items.map(item => `
                <div class="flex justify-between text-xs mb-1">
                  <span>${item.quantity} x ${item.productName}${item.notes ? ` <i>(${item.notes})</i>` : ''}</span>
                  <span>$${(item.totalPrice || (item.unitPrice * item.quantity) || 0).toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="separator"></div>

          <!-- Totals -->
          <div class="mb-2">
            <div class="flex justify-between text-xs">
              <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">Subtotal:</span>
              <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">$${order.subtotal.toLocaleString()}</span>
            </div>
            ${config.fields.showDeliveryFee && order.deliveryFee > 0 ? `
              <div class="flex justify-between text-xs">
                <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">Domicilio:</span>
                <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">$${order.deliveryFee.toLocaleString()}</span>
              </div>
            ` : ''}
            ${config.fields.showPackaging && order.packagingFee > 0 ? `
              <div class="flex justify-between text-xs">
                <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">Empaque:</span>
                <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">$${order.packagingFee.toLocaleString()}</span>
              </div>
            ` : ''}
            ${order.tax > 0 ? `
              <div class="flex justify-between text-xs">
                <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">Impuesto:</span>
                <span class="${isBold('subtotalFees') ? 'font-bold' : ''}">$${order.tax.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="flex justify-between mt-1 ${isBold('total') ? 'font-bold' : ''}">
              <span>Total:</span>
              <span>$${order.total.toLocaleString()}</span>
            </div>
            ${config.fields.showPaymentMethod && order.paymentMethod ? `
              <p class="text-xs mt-1">Pago: ${order.paymentMethod}</p>
            ` : ''}
            ${config.fields.showEstimatedDelivery && order.estimatedDelivery ? `
              <p class="text-xs mt-1 ${isBold('estimatedDelivery') ? 'font-bold' : ''}">Entrega estimada: ${order.estimatedDelivery}</p>
            ` : ''}
          </div>

          <!-- Promo -->
          ${config.promo.show && config.promo.text ? `
            <div class="separator"></div>
            <p class="text-center text-xs font-bold mb-2">${config.promo.text}</p>
          ` : ''}

          <!-- QR Code -->
          ${config.qr.show ? `
            <div class="separator"></div>
            <div class="text-center mb-2">
              <img src="${qrCodeUrl}" alt="QR" class="inline-block" style="width: 20mm; height: 20mm; object-fit: contain;">
              <p class="text-xs ${isBold('qrText') ? 'font-bold' : ''}">${config.qr.labelText}</p>
            </div>
          ` : ''}

          <!-- Social Media -->
          ${config.socialMedia.show ? `
            <div class="separator"></div>
            <div class="text-center mb-2">
              <p class="text-xs mb-1 ${isBold('socialMedia') ? 'font-bold' : ''}">Síguenos:</p>
              <div class="flex justify-center gap-2 text-xs">
                ${config.socialMedia.instagram ? `<span>📷 @${config.socialMedia.instagram}</span>` : ''}
                ${config.socialMedia.whatsapp ? `<span>💬 ${config.socialMedia.whatsapp}</span>` : ''}
                ${config.socialMedia.facebook ? `<span>👍 ${config.socialMedia.facebook}</span>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Footer -->
          <div class="separator"></div>
          <div class="text-center mb-2">
            ${config.footer.repeatBusinessName ? `<p class="text-xs ${isBold('footer') ? 'font-bold' : ''}">${config.header.businessName || profileForm.businessName || 'NOMBRE DEL NEGOCIO'}</p>` : ''}
            <p class="text-xs ${isBold('footer') ? 'font-bold' : ''}">${config.footer.message || '¡Gracias por su compra!'}</p>
            <p class="text-xs" style="color: #999; margin-top: 5px;">Powered by MINIMENU</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
    }
  };

  // --- Print Restaurant Invoice Ticket ---
  const printRestaurantInvoiceTicket = (invoice: RestaurantInvoice): void => {
    const printableOrder: PrintableOrder = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone || undefined,
      dateTime: new Date(invoice.createdAt).toLocaleString('es-CO'),
      items: invoice.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: (item as any).notes || ''
      })),
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      deliveryFee: 0,
      packagingFee: 0,
      total: invoice.total,
      paymentMethod: invoice.paymentMethod === 'cash' ? 'Efectivo' : invoice.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'
    };

    handlePrintUnifiedTicket(printableOrder);
  };

  // --- Print Delivery Invoice Ticket ---
  const printDeliveryInvoiceTicket = (invoice: DeliveryInvoice): void => {
    const printableOrder: PrintableOrder = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone || undefined,
      customerAddress: invoice.customerAddress || undefined,
      dateTime: new Date(invoice.createdAt).toLocaleString('es-CO'),
      items: invoice.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice || (item.unitPrice * item.quantity),
        notes: item.notes || ''
      })),
      subtotal: invoice.subtotal,
      tax: 0,
      deliveryFee: invoice.deliveryFee || 0,
      packagingFee: invoice.empaqueTotal || 0,
      total: invoice.total,
      paymentMethod: getDeliveryInvoicePaymentMethodText(invoice.paymentMethod)
    };

    handlePrintUnifiedTicket(printableOrder);
  };

  // --- Print Unified Order Ticket (Restaurant/Kanban) ---
  const printUnifiedOrderTicket = (order: UnifiedOrder): void => {
    const printableOrder: PrintableOrder = {
      invoiceNumber: order.orderNumber || order.id,
      customerName: order.customer,
      customerPhone: order.phone || undefined,
      customerAddress: order.address || undefined,
      dateTime: order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : `${order.date} ${order.time}`,
      items: [{
        productName: 'Detalle del Pedido',
        quantity: order.items || 1,
        unitPrice: (order.total || 0) / (order.items || 1),
        totalPrice: order.total || 0,
        notes: order.notes || ''
      }],
      subtotal: order.total || 0,
      tax: 0,
      deliveryFee: 0,
      packagingFee: 0,
      total: order.total || 0,
      paymentMethod: order.paymentMethod ? (order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia') : 'Efectivo'
    };
    handlePrintUnifiedTicket(printableOrder);
  };

  // --- Print Delivery Order Ticket (Delivery/Kanban) ---
  const printDeliveryOrderTicket = (order: DeliveryOrder): void => {
    const printableOrder: PrintableOrder = {
      invoiceNumber: order.invoiceNumber || order.orderNumber || order.id,
      customerName: order.customer,
      customerPhone: order.phone || undefined,
      customerAddress: order.address || undefined,
      dateTime: order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : order.date,
      items: [{
        productName: 'Detalle del Pedido',
        quantity: order.items || 1,
        unitPrice: (order.subtotal || 0) / (order.items || 1),
        totalPrice: order.subtotal || 0,
        notes: order.notes || ''
      }],
      subtotal: order.subtotal || 0,
      tax: 0,
      deliveryFee: order.deliveryFee || 0,
      packagingFee: 0,
      total: order.total || 0,
      paymentMethod: order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'
    };
    handlePrintUnifiedTicket(printableOrder);
  };

  // --- Download Restaurant Invoice PDF ---
  const downloadRestaurantInvoicePDF = (invoice: RestaurantInvoice): void => {
    const qrData = `FACTURA: ${invoice.invoiceNumber}\\nCliente: ${invoice.customerName}\\nTotal: $${invoice.total.toLocaleString()}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    const logoUrl = profileForm.logo || profileForm.avatar || '';

    const pdfContent = `
      <html>
      <head>
        <title>Factura - ${invoice.invoiceNumber}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #333; background: #fff; }
          .invoice { max-width: 100%; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #8b5cf6; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo-img { max-width: 80px; max-height: 60px; object-fit: contain; }
          .business-info h1 { font-size: 24px; color: #8b5cf6; }
          .business-info p { font-size: 12px; color: #666; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { font-size: 18px; color: #333; }
          .invoice-info p { font-size: 12px; color: #666; }
          .customer-section { margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .customer-section h3 { font-size: 14px; margin-bottom: 10px; color: #8b5cf6; }
          .customer-section p { font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th { background: #8b5cf6; color: white; padding: 12px 8px; text-align: left; font-size: 11px; }
          td { padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
          .totals-section { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; }
          .total-row.grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #8b5cf6; padding-top: 12px; margin-top: 8px; }
          .status-section { margin: 20px 0; padding: 15px; background: ${invoice.status === 'paid' ? '#d4edda' : '#fff3cd'}; border-radius: 8px; text-align: center; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
          .footer p { font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="logo-section">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo-img">` : ''}
              <div class="business-info">
                <h1>${profileForm.businessName || 'MINIMENU'}</h1>
                <p>${profileForm.address || ''}</p>
                <p>${profileForm.phone || ''}</p>
              </div>
            </div>
            <div class="invoice-info">
              <h2>FACTURA</h2>
              <p><strong>No:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Fecha:</strong> ${new Date(invoice.createdAt).toLocaleString('es-CO')}</p>
            </div>
          </div>
          
          <div class="customer-section">
            <h3>Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${invoice.customerName}</p>
            ${invoice.customerPhone ? `<p><strong>Teléfono:</strong> ${invoice.customerPhone}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toLocaleString()}</td>
                  <td>$${(item.unitPrice * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${invoice.subtotal.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Impuesto:</span>
              <span>$${invoice.tax.toLocaleString()}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>$${invoice.total.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="status-section">
            <strong>${invoice.status === 'paid' ? '✓ FACTURA PAGADA' : '⏳ PENDIENTE DE PAGO'}</strong>
            <br>
            <span>Método: ${invoice.paymentMethod === 'cash' ? 'Efectivo' : invoice.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</span>
          </div>
          
          <div class="footer">
            <p>¡Gracias por su preferencia!</p>
            <p>${profileForm.businessName || 'MINIMENU'} - Sistema de Gestión</p>
            <p>Documento generado el ${new Date().toLocaleString('es-CO')}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
    }
  };

  // Get filtered products for invoice
  const getFilteredProductsForInvoice = (): Product[] => {
    let filtered = products.filter(p => p.isAvailable);

    if (productSearchQuery.trim()) {
      const query = productSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Load invoices on mount
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Load delivery invoices on mount and when tab changes to domicilios
  useEffect(() => {
    loadDeliveryInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all data on mount and refresh periodically
  useEffect(() => {
    loadAllOrdersFromDatabase();
    // Refresh every 30 seconds for real-time dashboard
    const interval = setInterval(loadAllOrdersFromDatabase, 30000);
    return () => clearInterval(interval);
  }, [user.businessId, profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'domicilios') {
      loadDeliveryInvoices();
    }
    // Refresh orders when navigating to dashboard or pedidos
    if (activeTab === 'dashboard' || activeTab === 'pedidos') {
      loadAllOrdersFromDatabase();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeAIModals = (): void => {
    // Stop any ongoing speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setShowAITextModal(false);
    setShowAIVoiceModal(false);
    setAiGeneratedProduct(null);
    setAiTextPrompt('');
    setIsRecording(false);
    setIsAIProcessing(false);
    setSpeechError(null);
  };

  // --- Order Detail Functions ---
  const openOrderDetail = (order: Order): void => {
    // Map backend Order to frontend UnifiedOrder safely handling pre-mapped objects
    const runtimeOrder = order as unknown as Partial<UnifiedOrder>;
    const uniOrder: UnifiedOrder = {
      id: order.id,
      orderNumber: runtimeOrder.orderNumber || order.id.slice(0, 8).toUpperCase(),
      customer: runtimeOrder.customer || order.customerName,
      phone: runtimeOrder.phone || order.customerPhone,
      address: runtimeOrder.address || (order.notes?.includes('Dir:') ? order.notes.split('Dir:')[1].split('\n')[0].trim() : undefined),
      items: typeof runtimeOrder.items === 'number' ? runtimeOrder.items : (Array.isArray(order.items) ? order.items.reduce((acc, item) => acc + item.quantity, 0) : 1),
      total: order.total,
      status: runtimeOrder.status || (order.status as unknown as UnifiedOrder['status']),
      type: 'restaurante',
      time: runtimeOrder.time || new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: runtimeOrder.date || new Date(order.createdAt).toLocaleDateString(),
      notes: order.notes || undefined,
      createdAt: order.createdAt,
      paymentStatus: runtimeOrder.paymentStatus,
      paymentMethod: runtimeOrder.paymentMethod
    };
    setSelectedOrder(uniOrder);
    setShowOrderDetail(true);
  };


  // --- Función para abrir el modal correcto según tipo de pedido ---
  const handleViewUnifiedOrder = (unifiedOrder: UnifiedOrder): void => {
    if (unifiedOrder.type === 'domicilio') {
      const deliveryOrder = dbDeliveryOrders.find(d => d.id === unifiedOrder.id);
      if (deliveryOrder) {
        openDeliveryDetail(deliveryOrder);
      }
    } else {
      const restaurantOrder = dbRestaurantOrders.find(o => o.id === unifiedOrder.id);
      if (restaurantOrder) {
        openOrderDetail(restaurantOrder);
      }
    }
  };

  const closeOrderDetail = (): void => {
    setSelectedOrder(null);
    setShowOrderDetail(false);
  };

  const updateOrderStatus = (newStatus: Order['status']): void => {
    if (!selectedOrder) return;
    setSelectedOrder({ ...selectedOrder, status: newStatus as UnifiedOrder['status'] });
  };

  const updateOrderPaymentStatus = (newPaymentStatus: any): void => {
    if (!selectedOrder) return;
    setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus } as any);
  };

  const handleSaveOrderChanges = async (): Promise<void> => {
    if (!selectedOrder) return;

    setIsSavingOrderChanges(true);
    try {

      // Guardar en la base de datos via API para pedidos reales
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: selectedOrder.status.toUpperCase(),
          paymentStatus: selectedOrder.paymentStatus?.toUpperCase() || 'PENDING',
          paymentMethod: selectedOrder.paymentMethod,
          notes: selectedOrder.notes
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar');
      }

      // Mostrar mensaje de éxito
      setToastMessage({ type: 'success', message: `Pedido ${selectedOrder.id} actualizado correctamente` });

      // Cerrar el modal
      closeOrderDetail();
    } catch (error) {
      console.error('Error saving order changes:', error);
      setToastMessage({ type: 'error', message: 'Error al guardar los cambios' });
    } finally {
      setIsSavingOrderChanges(false);
    }
  };

  // --- Delivery Order Functions ---
  const openDeliveryDetail = (delivery: DeliveryOrder): void => {
    setSelectedDelivery(delivery);
    setShowDeliveryDetail(true);
  };

  const closeDeliveryDetail = (): void => {
    setSelectedDelivery(null);
    setShowDeliveryDetail(false);
  };

  const updateDeliveryStatus = (newStatus: DeliveryOrder['status']): void => {
    if (!selectedDelivery) return;
    setSelectedDelivery({ ...selectedDelivery, status: newStatus });
  };

  const updatePaymentStatus = (newStatus: DeliveryOrder['paymentStatus']): void => {
    if (!selectedDelivery) return;
    setSelectedDelivery({ ...selectedDelivery, paymentStatus: newStatus });
  };

  // --- Guardar cambios de pedido de domicilio ---
  const handleSaveDeliveryChanges = async (): Promise<void> => {
    if (!selectedDelivery) return;

    setIsSavingDeliveryChanges(true);
    try {

      // Guardar en la base de datos via API para pedidos reales
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDelivery.id,
          status: selectedDelivery.status.toUpperCase(),
          paymentStatus: selectedDelivery.paymentStatus.toUpperCase(),
          paymentMethod: selectedDelivery.paymentMethod,
          driverName: selectedDelivery.driver,
          notes: selectedDelivery.notes
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar');
      }

      // Mostrar mensaje de éxito
      setToastMessage({ type: 'success', message: `Pedido de domicilio ${selectedDelivery.invoiceNumber} actualizado correctamente` });

      // Cerrar el modal
      closeDeliveryDetail();
    } catch (error) {
      console.error('Error saving delivery changes:', error);
      setToastMessage({ type: 'error', message: 'Error al guardar los cambios del domicilio' });
    } finally {
      setIsSavingDeliveryChanges(false);
    }
  };

  const getFilteredDeliveries = (): DeliveryOrder[] => {
    return dbDeliveryOrders.filter(delivery => {
      const matchesFilter = deliveryFilter === 'all' || delivery.status === deliveryFilter;
      const matchesSearch = !deliverySearch ||
        delivery.customer.toLowerCase().includes(deliverySearch.toLowerCase()) ||
        delivery.invoiceNumber.toLowerCase().includes(deliverySearch.toLowerCase()) ||
        delivery.address.toLowerCase().includes(deliverySearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  };

  // Get filtered delivery invoices (real invoices from TPV)
  const getFilteredDeliveryInvoices = (): DeliveryInvoice[] => {
    return deliveryInvoices.filter(invoice => {
      const matchesFilter = deliveryFilter === 'all' || invoice.status === deliveryFilter;
      const matchesSearch = !deliverySearch ||
        invoice.customerName.toLowerCase().includes(deliverySearch.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(deliverySearch.toLowerCase()) ||
        invoice.customerAddress.toLowerCase().includes(deliverySearch.toLowerCase()) ||
        invoice.customerPhone.includes(deliverySearch);
      return matchesFilter && matchesSearch;
    });
  };

  // Filter delivery invoices by date range
  const getFilteredDeliveryInvoicesByDate = (): DeliveryInvoice[] => {
    const baseFiltered = getFilteredDeliveryInvoices();
    if (!deliveryDateFrom && !deliveryDateTo) return baseFiltered;

    return baseFiltered.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      const dateFrom = deliveryDateFrom ? new Date(deliveryDateFrom) : null;
      const dateTo = deliveryDateTo ? new Date(deliveryDateTo) : null;

      if (dateFrom && dateTo) {
        return invoiceDate >= dateFrom && invoiceDate <= dateTo;
      } else if (dateFrom) {
        return invoiceDate >= dateFrom;
      } else if (dateTo) {
        return invoiceDate <= dateTo;
      }
      return true;
    });
  };

  // Get delivery invoice status color
  const getDeliveryInvoiceStatusColor = (status: DeliveryInvoice['status']): string => {
    const colors: Record<DeliveryInvoice['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status];
  };

  // Get delivery invoice status text
  const getDeliveryInvoiceStatusText = (status: DeliveryInvoice['status']): string => {
    const texts: Record<DeliveryInvoice['status'], string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      on_the_way: 'En Camino',
      delivered: 'Entregado'
    };
    return texts[status];
  };

  // Get delivery invoice payment status color
  const getDeliveryInvoicePaymentStatusColor = (status: DeliveryInvoice['paymentStatus']): string => {
    const colors: Record<DeliveryInvoice['paymentStatus'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800'
    };
    return colors[status];
  };

  // Get delivery invoice payment method text
  const getDeliveryInvoicePaymentMethodText = (method: DeliveryInvoice['paymentMethod']): string => {
    const texts: Record<DeliveryInvoice['paymentMethod'], string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia'
    };
    return texts[method];
  };

  // Toggle delivery invoice selection
  const toggleDeliveryInvoiceSelection = (invoiceId: string): void => {
    setSelectedDeliveryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  // Select/deselect all visible delivery invoices
  const toggleAllDeliveryInvoices = (checked: boolean): void => {
    const filteredInvoices = getFilteredDeliveryInvoicesByDate();
    if (checked) {
      setSelectedDeliveryIds(new Set(filteredInvoices.map(inv => inv.id)));
    } else {
      setSelectedDeliveryIds(new Set());
    }
  };

  // Delete selected delivery invoices
  const deleteSelectedDeliveryInvoices = async (): Promise<void> => {
    setIsDeletingDeliveries(true);
    const idsArray = Array.from(selectedDeliveryIds);
    setDeliveryDeleteProgress({ current: 0, total: idsArray.length, batch: 0, totalBatches: 0 });

    try {
      // Delete from localStorage
      const savedInvoices = localStorage.getItem('deliveryInvoices');
      let existingInvoices: DeliveryInvoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
      existingInvoices = existingInvoices.filter(inv => !idsArray.includes(inv.id));
      localStorage.setItem('deliveryInvoices', JSON.stringify(existingInvoices));

      setDeliveryInvoices(existingInvoices);
      setToastMessage({
        type: 'success',
        message: `✅ ${idsArray.length} domicilios eliminados correctamente`
      });
      setSelectedDeliveryIds(new Set());
      setShowDeliveryDeleteConfirm(false);
    } catch (error) {
      setToastMessage({
        type: 'error',
        message: '❌ Error al eliminar algunos domicilios'
      });
    } finally {
      setIsDeletingDeliveries(false);
      setDeliveryDeleteProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

  const getDeliveryStatusColor = (status: DeliveryOrder['status']): string => {
    const colors: Record<DeliveryOrder['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getDeliveryStatusText = (status: DeliveryOrder['status']): string => {
    const texts: Record<DeliveryOrder['status'], string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      on_the_way: 'En Camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return texts[status];
  };

  const getPaymentMethodText = (method: DeliveryOrder['paymentMethod']): string => {
    const texts: Record<DeliveryOrder['paymentMethod'], string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia'
    };
    return texts[method];
  };

  const getPaymentStatusColor = (status: DeliveryOrder['paymentStatus']): string => {
    const colors: Record<DeliveryOrder['paymentStatus'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  // ============================================================================
  // BULK SELECTION HELPER FUNCTIONS
  // ============================================================================

  // Process items in batches (for >500 records)
  const processBatch = async <T,>(
    items: T[],
    processor: (batch: T[]) => Promise<void>,
    batchSize = 500,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;
    const totalBatches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        await processor(batch);
        success += batch.length;
      } catch {
        failed += batch.length;
      }
      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }
    }

    return { success, failed };
  };

  // Filter orders by date range
  const getFilteredOrdersByDate = (orders: Order[]): Order[] => {
    if (!orderDateFrom && !orderDateTo) return orders;

    return orders.filter(order => {
      // Parse time string (e.g., "12:30 PM") to a comparable date
      // For this mock data, we'll use a simple approach
      const orderDate = new Date();
      const [time, period] = (order as any).time.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours, 10);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      orderDate.setHours(hour, parseInt(minutes, 10), 0, 0);

      // For demo purposes, use today's date with the time
      const dateFrom = orderDateFrom ? new Date(orderDateFrom) : null;
      const dateTo = orderDateTo ? new Date(orderDateTo) : null;

      if (dateFrom && dateTo) {
        return orderDate >= dateFrom && orderDate <= dateTo;
      } else if (dateFrom) {
        return orderDate >= dateFrom;
      } else if (dateTo) {
        return orderDate <= dateTo;
      }
      return true;
    });
  };

  // Filter deliveries by date range
  const getFilteredDeliveriesByDate = (deliveries: DeliveryOrder[]): DeliveryOrder[] => {
    if (!deliveryDateFrom && !deliveryDateTo) return deliveries;

    return deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.createdAt);
      const dateFrom = deliveryDateFrom ? new Date(deliveryDateFrom) : null;
      const dateTo = deliveryDateTo ? new Date(deliveryDateTo) : null;

      if (dateFrom && dateTo) {
        return deliveryDate >= dateFrom && deliveryDate <= dateTo;
      } else if (dateFrom) {
        return deliveryDate >= dateFrom;
      } else if (dateTo) {
        return deliveryDate <= dateTo;
      }
      return true;
    });
  };

  // Get filtered orders (combined with date filter)
  const getFilteredOrders = (): Order[] => {
    return getFilteredOrdersByDate(dbRestaurantOrders);
  };

  // Get filtered deliveries (combined with date filter) - replaces original
  const getFilteredDeliveriesWithDate = (): DeliveryOrder[] => {
    const baseFiltered = getFilteredDeliveries();
    return getFilteredDeliveriesByDate(baseFiltered);
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: string): void => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Toggle delivery selection
  const toggleDeliverySelection = (deliveryId: string): void => {
    setSelectedDeliveryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deliveryId)) {
        newSet.delete(deliveryId);
      } else {
        newSet.add(deliveryId);
      }
      return newSet;
    });
  };

  // Select/deselect all visible orders
  const toggleAllOrders = (checked: boolean): void => {
    const filteredOrders = getFilteredOrders();
    if (checked) {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  // Select/deselect all visible deliveries
  const toggleAllDeliveries = (checked: boolean): void => {
    const filteredDeliveries = getFilteredDeliveriesWithDate();
    if (checked) {
      setSelectedDeliveryIds(new Set(filteredDeliveries.map(d => d.id)));
    } else {
      setSelectedDeliveryIds(new Set());
    }
  };

  // Delete selected orders with batch processing
  const deleteSelectedOrders = async (): Promise<void> => {
    setIsDeletingOrders(true);
    const idsArray = Array.from(selectedOrderIds);
    setDeleteProgress({ current: 0, total: idsArray.length, batch: 0, totalBatches: 0 });

    try {
      // In a real app, this would call an API
      // For demo, we'll simulate the deletion
      await processBatch(
        idsArray,
        async (batch) => {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('Deleting orders batch:', batch);
        },
        500,
        (current, total) => setDeleteProgress({ current, total, batch: 0, totalBatches: 0 })
      );

      setToastMessage({
        type: 'success',
        message: `✅ ${idsArray.length} pedidos eliminados correctamente`
      });
      setSelectedOrderIds(new Set());
      setShowOrderDeleteConfirm(false);
    } catch (error) {
      setToastMessage({
        type: 'error',
        message: '❌ Error al eliminar algunos pedidos'
      });
    } finally {
      setIsDeletingOrders(false);
      setDeleteProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

  // Delete selected deliveries with batch processing
  const deleteSelectedDeliveries = async (): Promise<void> => {
    setIsDeletingDeliveries(true);
    const idsArray = Array.from(selectedDeliveryIds);
    setDeliveryDeleteProgress({ current: 0, total: idsArray.length, batch: 0, totalBatches: 0 });

    try {
      // In a real app, this would call an API
      await processBatch(
        idsArray,
        async (batch) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('Deleting deliveries batch:', batch);
        },
        500,
        (current, total) => setDeliveryDeleteProgress({ current, total, batch: 0, totalBatches: 0 })
      );

      setToastMessage({
        type: 'success',
        message: `✅ ${idsArray.length} domicilios eliminados correctamente`
      });
      setSelectedDeliveryIds(new Set());
      setShowDeliveryDeleteConfirm(false);
    } catch (error) {
      setToastMessage({
        type: 'error',
        message: '❌ Error al eliminar algunos domicilios'
      });
    } finally {
      setIsDeletingDeliveries(false);
      setDeliveryDeleteProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

  // Clear date filters
  const clearOrderDateFilter = (): void => {
    setOrderDateFrom('');
    setOrderDateTo('');
  };

  const clearDeliveryDateFilter = (): void => {
    setDeliveryDateFrom('');
    setDeliveryDateTo('');
  };

  // ============================================================================
  // PEDIDOS KANBAN - NOTIFICATIONS, TIMERS & UNIFIED ORDERS
  // ============================================================================

  // Play notification sound using Web Audio API
  const playNotificationSound = (): void => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Create a pleasant notification sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  // Add notification
  const addNotification = (message: string, type: 'restaurante' | 'domicilio'): void => {
    const notification = {
      id: `notif-${Date.now()}`,
      message,
      type,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);
    playNotificationSound();

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Remove notification
  const removeNotification = (id: string): void => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };


  // Get all unified orders (restaurant + delivery) - ONLY from DB (No mock data)
  const getAllUnifiedOrders = (): UnifiedOrder[] => {
    const restaurantOrders: UnifiedOrder[] = dbRestaurantOrders.map(order => ({
      id: order.id,
      orderNumber: (order as any).orderNumber || order.id.slice(0, 8),
      customer: (order as any).customer || 'Cliente',
      items: order.items,
      total: order.total,
      status: order.status as UnifiedOrder['status'],
      type: 'restaurante' as const,
      time: (order as any).time,
      date: (order as any).date,
      phone: (order as any).phone,
      address: (order as any).address,
      notes: order.notes,
      paymentStatus: (order as any).paymentStatus || 'pending',
      paymentMethod: (order as any).paymentMethod || 'cash',
      createdAt: order.createdAt ?? new Date().toISOString()
    } as unknown as UnifiedOrder));

    const deliveryOrders: UnifiedOrder[] = dbDeliveryOrders.map(order => ({
      id: order.id,
      orderNumber: (order as any).orderNumber || order.id.slice(0, 8),
      customer: (order as any).customer || 'Cliente',
      items: order.items,
      total: order.total,
      status: order.status as UnifiedOrder['status'],
      type: 'domicilio' as const,
      time: order.createdAt,
      date: (order as any).date,
      phone: (order as any).phone,
      address: (order as any).address,
      notes: order.notes,
      paymentStatus: (order as any).paymentStatus || 'pending',
      paymentMethod: (order as any).paymentMethod || 'cash',
      createdAt: order.createdAt ?? new Date().toISOString()
    } as unknown as UnifiedOrder));

    return [...restaurantOrders, ...deliveryOrders];
  };

  // Get filtered orders by type with search
  const getOrdersByType = (type: 'all' | 'restaurante' | 'domicilio'): UnifiedOrder[] => {
    const allOrders = getAllUnifiedOrders();

    // Filter by type
    let filtered = type === 'all' ? allOrders : allOrders.filter(order => order.type === type);

    // Filter by status
    if (pedidosStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === pedidosStatusFilter);
    }

    // Filter by date
    if (pedidosDateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (pedidosDateFilter === 'today') {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
      } else if (pedidosDateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === yesterday.getTime();
        });
      } else if (pedidosDateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= weekAgo;
        });
      } else if (pedidosDateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthAgo;
        });
      }
    }

    // Filter by search query
    if (pedidosSearchQuery.trim()) {
      const query = pedidosSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        (order.phone && order.phone.toLowerCase().includes(query)) ||
        (order.address && order.address.toLowerCase().includes(query)) ||
        (order.notes && order.notes.toLowerCase().includes(query))
      );
    }

    return filtered;
  };


  // Update timers every 10 seconds - SE EXTIENDE A TODOS LOS PEDIDOS (RESTAURANTE Y DOMICILIO)
  useEffect(() => {
    const updateTimers = (): void => {
      const allOrders = getAllUnifiedOrders();
      const newTimers = new Map<string, number>();

      allOrders.forEach(order => {
        if (shouldShowTimer(order.status)) {
          const minutes = getElapsedMinutes(order.createdAt);
          // Solo mostrar timer si es >= 0 (pedido válido)
          if (minutes >= 0) {
            newTimers.set(order.id, minutes);
          }
        }
      });

      setOrderTimers(newTimers);
    };

    // Actualizar inmediatamente
    updateTimers();
    // Actualizar cada 10 segundos para mayor precisión
    const interval = setInterval(updateTimers, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbRestaurantOrders, dbDeliveryOrders]);

  // Check for new orders and notify
  useEffect(() => {
    const currentCount = dbRestaurantOrders.length + dbDeliveryOrders.length;

    if (previousOrderCount > 0 && currentCount > previousOrderCount) {
      const newCount = currentCount - previousOrderCount;
      addNotification(`🔔 ${newCount} nuevo${newCount > 1 ? 's' : ''} pedido${newCount > 1 ? 's' : ''} recibido${newCount > 1 ? 's' : ''}`, 'restaurante');
    }

    setPreviousOrderCount(currentCount);
  }, [dbRestaurantOrders.length, dbDeliveryOrders.length]);

  // --- Ticket and PDF Functions ---
  const printThermalTicket = (delivery: DeliveryOrder): void => {
    // Generate QR Code URL for thermal ticket
    const qrData = `FACTURA: ${delivery.invoiceNumber}\\nPedido: ${delivery.id}\\nTotal: $${delivery.total.toLocaleString()}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

    // Logo URL (use business logo)
    const logoUrl = profileForm.logo || profileForm.avatar || '';

    // Create thermal ticket content (80mm width = ~302px at 96 DPI)
    const ticketContent = `
      <html>
      <head>
        <title>Ticket de Domicilio - ${delivery.invoiceNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 5mm;
            background: white;
          }
          .ticket {
            width: 100%;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .logo-img {
            max-width: 50mm;
            max-height: 20mm;
            object-fit: contain;
            margin-bottom: 5px;
          }
          .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 10px;
          }
          .info-section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .label {
            font-weight: bold;
          }
          .value {
            text-align: right;
          }
          .customer-section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          .customer-section h2 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .address {
            font-size: 10px;
            word-wrap: break-word;
            margin-top: 3px;
          }
          .payment-section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: bold;
          }
          .qr-section {
            text-align: center;
            margin: 15px 0;
            padding: 10px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
          }
          .qr-code {
            width: 80px;
            height: 80px;
            margin: 0 auto 5px;
          }
          .qr-label {
            font-size: 9px;
            color: #333;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          .footer p {
            font-size: 10px;
            margin-bottom: 3px;
          }
          .notes {
            background: #f5f5f5;
            padding: 5px;
            margin: 10px 0;
            font-size: 10px;
            border-radius: 3px;
          }
          @media print {
            body {
              width: 80mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">` : ''}
            <h1>${profileForm.businessName || 'MINIMENU'}</h1>
            <p>${profileForm.address || 'Sistema de Gestión de Menús'}</p>
            <p>Factura: ${delivery.invoiceNumber}</p>
            <p>${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">Pedido:</span>
              <span class="value">${delivery.id}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora:</span>
              <span class="value">${delivery.createdAt}</span>
            </div>
            <div class="info-row">
              <span class="label">Entrega Est.:</span>
              <span class="value">${delivery.estimatedDelivery}</span>
            </div>
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="value">${getDeliveryStatusText(delivery.status).toUpperCase()}</span>
            </div>
          </div>

          <div class="customer-section">
            <h2>📍 DATOS DEL CLIENTE</h2>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${delivery.customer}</span>
            </div>
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">${delivery.phone}</span>
            </div>
            <div class="address">
              <strong>Dirección:</strong> ${delivery.address}
            </div>
            <div class="info-row">
              <span class="label">Barrio:</span>
              <span class="value">${delivery.neighborhood}</span>
            </div>
            ${delivery.driver ? `<div class="info-row"><span class="label">Mensajero:</span><span class="value">${delivery.driver}</span></div>` : ''}
          </div>

          <div class="payment-section">
            <div class="info-row">
              <span class="label">Items:</span>
              <span class="value">${delivery.items}</span>
            </div>
            <div class="info-row">
              <span class="label">Subtotal:</span>
              <span class="value">$${delivery.subtotal.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Domicilio:</span>
              <span class="value">$${delivery.deliveryFee.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>TOTAL:</span>
              <span>$${delivery.total.toLocaleString()}</span>
            </div>
            <div class="info-row" style="margin-top: 5px;">
              <span class="label">Método:</span>
              <span class="value">${getPaymentMethodText(delivery.paymentMethod)}</span>
            </div>
            <div class="info-row">
              <span class="label">Pago:</span>
              <span class="value">${delivery.paymentStatus === 'paid' ? '✓ PAGADO' : delivery.paymentStatus === 'pending' ? '⏳ PENDIENTE' : '↩ REEMBOLSADO'}</span>
            </div>
          </div>

          ${delivery.notes ? `<div class="notes"><strong>📝 Notas:</strong> ${delivery.notes}</div>` : ''}

          <div class="qr-section">
            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
            <div class="qr-label">Escanea para verificar factura</div>
          </div>

          <div class="footer">
            <p>═══════════════════════════</p>
            <p>¡Gracias por su pedido!</p>
            <p>Powered by MINIMENU</p>
            <p>═══════════════════════════</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
    }
  };

  const downloadDeliveryPDF = (delivery: DeliveryOrder): void => {
    // Generate QR Code URL for the invoice
    const qrData = `FACTURA: ${delivery.invoiceNumber}\\nPedido: ${delivery.id}\\nCliente: ${delivery.customer}\\nTotal: $${delivery.total.toLocaleString()}\\nFecha: ${new Date().toLocaleDateString('es-CO')}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    // Logo URL (use business logo)
    const logoUrl = profileForm.logo || profileForm.avatar || '';

    // Create professional PDF content as printable HTML
    const pdfContent = `
      <html>
      <head>
        <title>Factura de Domicilio - ${delivery.invoiceNumber}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }
          .invoice {
            max-width: 100%;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 3px solid #8b5cf6;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-img {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
            border-radius: 8px;
          }
          .business-info h1 {
            font-size: 26px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 5px;
          }
          .business-info p {
            font-size: 11px;
            color: #666;
          }
          .invoice-badge {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 12px 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);
          }
          .invoice-badge h2 {
            font-size: 12px;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .invoice-badge p {
            font-size: 18px;
            font-weight: bold;
          }
          .invoice-badge .date {
            font-size: 10px;
            margin-top: 5px;
            opacity: 0.9;
          }
          .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }
          .section {
            background: #f9fafb;
            border-radius: 10px;
            padding: 18px;
            border: 1px solid #e5e7eb;
          }
          .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dotted #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 11px;
          }
          .info-value {
            font-weight: 500;
            color: #111827;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
          }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-confirmed { background: #dbeafe; color: #1e40af; }
          .status-preparing { background: #ffedd5; color: #9a3412; }
          .status-on_the_way { background: #ede9fe; color: #6b21a8; }
          .status-delivered { background: #dcfce7; color: #166534; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .payment-pending { background: #fef3c7; color: #92400e; }
          .payment-paid { background: #dcfce7; color: #166534; }
          .payment-refunded { background: #f3f4f6; color: #374151; }
          .address-box {
            background: #fff;
            border: 1px solid #e5e7eb;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
          }
          .address-box .address-label {
            font-size: 11px;
            color: #8b5cf6;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .address-box .address-text {
            font-size: 12px;
            color: #333;
          }
          .table-section {
            margin: 25px 0;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }
          .table th {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table td {
            padding: 14px 15px;
            border-bottom: 1px solid #e5e7eb;
            background: #fff;
          }
          .table tr:last-child td {
            border-bottom: none;
          }
          .table .text-right {
            text-align: right;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          .totals {
            width: 320px;
            background: #f9fafb;
            border-radius: 10px;
            padding: 15px;
            border: 1px solid #e5e7eb;
          }
          .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals .row:last-child {
            border-bottom: none;
          }
          .totals .total-row {
            font-size: 20px;
            font-weight: bold;
            color: #8b5cf6;
            padding-top: 15px;
            margin-top: 5px;
            border-top: 2px solid #8b5cf6;
          }
          .payment-section {
            margin: 25px 0;
            padding: 18px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 10px;
            border: 1px solid #86efac;
          }
          .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .notes-box {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border-left: 4px solid #f59e0b;
            padding: 15px 18px;
            margin: 20px 0;
            border-radius: 0 10px 10px 0;
          }
          .notes-box h4 {
            font-size: 12px;
            color: #92400e;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .notes-box p {
            color: #78350f;
            font-size: 12px;
          }
          .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 25px;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-radius: 12px;
            border: 2px dashed #8b5cf6;
          }
          .qr-code {
            width: 130px;
            height: 130px;
            margin: 0 auto 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .qr-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
          }
          .qr-info {
            font-size: 10px;
            color: #9ca3af;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 35px;
            padding-top: 25px;
            border-top: 2px solid #e5e7eb;
          }
          .footer p {
            font-size: 11px;
            color: #9ca3af;
            margin-bottom: 6px;
          }
          .footer .brand {
            font-size: 14px;
            color: #8b5cf6;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .footer .thank-you {
            font-size: 16px;
            color: #8b5cf6;
            font-weight: 600;
            margin-bottom: 15px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .invoice { page-break-inside: avoid; }
            .qr-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="logo-section">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">` : ''}
              <div class="business-info">
                <h1>${profileForm.businessName || 'MINIMENU'}</h1>
                ${profileForm.address ? `<p>${profileForm.address}</p>` : ''}
                ${profileForm.phone ? `<p>Tel: ${profileForm.phone}</p>` : ''}
              </div>
            </div>
            <div class="invoice-badge">
              <h2>Factura de Domicilio</h2>
              <p>${delivery.invoiceNumber}</p>
              <div class="date">${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          <div class="content-grid">
            <div class="section">
              <div class="section-title">📋 Información del Pedido</div>
              <div class="info-row">
                <span class="info-label">ID del Pedido:</span>
                <span class="info-value">${delivery.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Hora de Creación:</span>
                <span class="info-value">${delivery.createdAt}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Entrega Estimada:</span>
                <span class="info-value">${delivery.estimatedDelivery}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Estado:</span>
                <span class="info-value">
                  <span class="status-badge status-${delivery.status}">${getDeliveryStatusText(delivery.status)}</span>
                </span>
              </div>
              ${delivery.driver ? `
              <div class="info-row">
                <span class="info-label">Mensajero:</span>
                <span class="info-value">${delivery.driver}</span>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">👤 Información del Cliente</div>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${delivery.customer}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Teléfono:</span>
                <span class="info-value">${delivery.phone}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Barrio:</span>
                <span class="info-value">${delivery.neighborhood}</span>
              </div>
              <div class="address-box">
                <div class="address-label">📍 Dirección de Entrega</div>
                <div class="address-text">${delivery.address}</div>
              </div>
            </div>
          </div>

          <div class="table-section">
            <div class="section-title">🛒 Detalle del Pedido</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Valor Unitario</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Productos del pedido</td>
                  <td class="text-right">${delivery.items}</td>
                  <td class="text-right">$${Math.round(delivery.subtotal / Math.max(delivery.items, 1)).toLocaleString()}</td>
                  <td class="text-right">$${delivery.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Servicio de Domicilio</td>
                  <td class="text-right">1</td>
                  <td class="text-right">$${delivery.deliveryFee.toLocaleString()}</td>
                  <td class="text-right">$${delivery.deliveryFee.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals">
                <div class="row">
                  <span>Subtotal:</span>
                  <span>$${delivery.subtotal.toLocaleString()} COP</span>
                </div>
                <div class="row">
                  <span>Domicilio:</span>
                  <span>$${delivery.deliveryFee.toLocaleString()} COP</span>
                </div>
                <div class="row total-row">
                  <span>TOTAL A PAGAR:</span>
                  <span>$${delivery.total.toLocaleString()} COP</span>
                </div>
              </div>
            </div>
          </div>

          <div class="payment-section">
            <div class="content-grid" style="margin-bottom: 0;">
              <div>
                <div class="section-title" style="border-bottom: none; margin-bottom: 10px;">💳 Información de Pago</div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Método de Pago:</span>
                  <span class="info-value">${getPaymentMethodText(delivery.paymentMethod)}</span>
                </div>
              </div>
              <div>
                <div class="section-title" style="border-bottom: none; margin-bottom: 10px;">📊 Estado del Pago</div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Estado:</span>
                  <span class="info-value">
                    <span class="status-badge payment-${delivery.paymentStatus}">${delivery.paymentStatus === 'paid' ? '✓ Pagado' : delivery.paymentStatus === 'pending' ? '⏳ Pendiente' : '↩ Reembolsado'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          ${delivery.notes ? `
          <div class="notes-box">
            <h4>📝 Notas del Cliente</h4>
            <p>${delivery.notes}</p>
          </div>
          ` : ''}

          <div class="qr-section">
            <img src="${qrCodeUrl}" alt="Código QR de la Factura" class="qr-code">
            <div class="qr-label">Escanea el código QR para verificar la factura</div>
            <div class="qr-info">Factura: ${delivery.invoiceNumber} | Total: $${delivery.total.toLocaleString()} COP</div>
          </div>

          <div class="footer">
            <div class="thank-you">¡Gracias por su pedido!</div>
            <div class="brand">${profileForm.businessName || 'MINIMENU'} - Sistema de Gestión de Pedidos</div>
            <p>Documento generado el ${new Date().toLocaleString('es-CO')}</p>
            <p>Powered by MINIMENU - www.minimenu.com</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
    }
  };

  // --- Order Ticket and PDF Functions (Restaurant Orders) ---
  const printOrderTicket = (order: UnifiedOrder): void => {
    const statusText: Record<string, string> = {
      pending: 'Pendiente',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado'
    };

    // Generate QR Code URL using a free QR API
    const orderDisplayId = order.orderNumber ?? order.id;
    const qrData = `PEDIDO: ${orderDisplayId}\\nCliente: ${order.customer}\\nTotal: $${order.total.toLocaleString()}\\nFecha: ${order.date} ${order.time}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;

    // Logo URL (use business logo or fallback to a default)
    const logoUrl = profileForm.logo || profileForm.avatar || '';

    const ticketContent = `
      <html>
      <head>
        <title>Ticket de Pedido - ${orderDisplayId}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            width: 72mm;
            padding: 3mm;
            background: white;
          }
          .ticket {
            width: 100%;
            max-width: 72mm;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .logo-container {
            text-align: center;
            margin-bottom: 5px;
          }
          .logo {
            max-width: 50mm;
            max-height: 25mm;
            object-fit: contain;
          }
          .business-name {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            text-transform: uppercase;
          }
          .business-info {
            font-size: 9px;
            color: #333;
            margin-top: 2px;
          }
          .order-title {
            font-size: 12px;
            font-weight: bold;
            background: #000;
            color: #fff;
            padding: 3px 5px;
            margin: 8px 0;
            text-align: center;
          }
          .info-section {
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px dashed #000;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 10px;
          }
          .label {
            font-weight: bold;
          }
          .customer-section {
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px dashed #000;
          }
          .section-title {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 3px;
            background: #f0f0f0;
            padding: 2px;
          }
          .total-section {
            font-size: 14px;
            font-weight: bold;
            text-align: right;
            padding: 8px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            margin: 8px 0;
          }
          .total-amount {
            font-size: 16px;
          }
          .qr-section {
            text-align: center;
            margin: 10px 0;
            padding: 8px 0;
            border-top: 1px dashed #000;
          }
          .qr-code {
            width: 80px;
            height: 80px;
            margin: 5px auto;
          }
          .qr-label {
            font-size: 8px;
            color: #666;
          }
          .footer {
            text-align: center;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            font-size: 9px;
          }
          .status {
            display: inline-block;
            padding: 2px 6px;
            font-size: 9px;
            font-weight: bold;
            border: 1px solid #000;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .dotted-line {
            border-top: 1px dotted #000;
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            ${logoUrl ? `
            <div class="logo-container">
              <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'">
            </div>
            ` : ''}
            <div class="business-name">${profileForm.businessName || 'MINIMENU'}</div>
            ${profileForm.address ? `<div class="business-info">${profileForm.address}</div>` : ''}
            ${profileForm.phone ? `<div class="business-info">Tel: ${profileForm.phone}</div>` : ''}
          </div>
          
          <div class="order-title">PEDIDO ${order.orderNumber ?? order.id}</div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span>${order.date}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora:</span>
              <span>${order.time}</span>
            </div>
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="status">${statusText[order.status]}</span>
            </div>
          </div>

          <div class="customer-section">
            <div class="section-title">DATOS DEL CLIENTE</div>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span>${order.customer}</span>
            </div>
            ${order.phone ? `
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span>${order.phone}</span>
            </div>
            ` : ''}
            ${order.address ? `
            <div class="dotted-line"></div>
            <div class="info-row">
              <span class="label">Dirección:</span>
            </div>
            <div style="font-size: 9px; word-wrap: break-word;">${order.address}</div>
            ` : ''}
          </div>

          <div class="info-section">
            <div class="section-title">DETALLE DEL PEDIDO</div>
            <div class="info-row">
              <span class="label">Cantidad Items:</span>
              <span>${order.items}</span>
            </div>
            ${order.notes ? `
            <div class="dotted-line"></div>
            <div class="info-row">
              <span class="label">Notas:</span>
            </div>
            <div style="font-size: 9px; word-wrap: break-word; background: #fffbe6; padding: 2px;">${order.notes}</div>
            ` : ''}
          </div>

          <div class="total-section">
            <div>TOTAL A PAGAR:</div>
            <div class="total-amount">$${order.total.toLocaleString()}</div>
          </div>

          <div class="qr-section">
            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
            <div class="qr-label">Escanea para ver el pedido</div>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p>¡Gracias por su preferencia!</p>
            <p>---</p>
            <p>Generado por MINIMENU</p>
            <p>${new Date().toLocaleString('es-CO')}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=320,height=500');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
    }
  };

  const downloadOrderPDF = (order: UnifiedOrder): void => {
    const statusText: Record<string, string> = {
      pending: 'Pendiente',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado'
    };

    // Generate QR Code URL
    const orderDisplayId = order.orderNumber ?? order.id;
    const qrData = `PEDIDO: ${orderDisplayId}\\nCliente: ${order.customer}\\nTotal: $${order.total.toLocaleString()}\\nFecha: ${order.date} ${order.time}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    // Logo URL
    const logoUrl = profileForm.logo || profileForm.avatar || '';

    const pdfContent = `
      <html>
      <head>
        <title>Pedido ${orderDisplayId}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }
          .invoice {
            max-width: 100%;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #8b5cf6;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-img {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
            border-radius: 8px;
          }
          .business-info h1 {
            font-size: 24px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 5px;
          }
          .business-info p {
            font-size: 11px;
            color: #666;
          }
          .invoice-badge {
            background: #8b5cf6;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-align: center;
          }
          .invoice-badge h2 {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .invoice-badge p {
            font-size: 20px;
            font-weight: bold;
          }
          .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .section {
            background: #f9fafb;
            border-radius: 8px;
            padding: 15px;
            border: 1px solid #e5e7eb;
          }
          .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dotted #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 11px;
          }
          .info-value {
            font-weight: 500;
            color: #111827;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
          }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-preparing { background: #ffedd5; color: #9a3412; }
          .status-ready { background: #dcfce7; color: #166534; }
          .status-delivered { background: #f3f4f6; color: #374151; }
          .total-section {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 14px;
            opacity: 0.9;
          }
          .total-amount {
            font-size: 28px;
            font-weight: bold;
          }
          .notes-box {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 12px 15px;
            margin: 15px 0;
            border-radius: 0 8px 8px 0;
          }
          .notes-box h4 {
            font-size: 12px;
            color: #92400e;
            margin-bottom: 6px;
          }
          .notes-box p {
            color: #78350f;
            font-size: 11px;
          }
          .qr-section {
            text-align: center;
            margin: 25px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }
          .qr-code {
            width: 120px;
            height: 120px;
            margin: 0 auto 10px;
          }
          .qr-label {
            font-size: 11px;
            color: #6b7280;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .footer p {
            font-size: 11px;
            color: #9ca3af;
            margin-bottom: 5px;
          }
          .footer .brand {
            font-size: 13px;
            color: #8b5cf6;
            font-weight: bold;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="logo-section">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">` : ''}
              <div class="business-info">
                <h1>${profileForm.businessName || 'MINIMENU'}</h1>
                ${profileForm.address ? `<p>${profileForm.address}</p>` : ''}
                ${profileForm.phone ? `<p>Tel: ${profileForm.phone}</p>` : ''}
              </div>
            </div>
            <div class="invoice-badge">
              <h2>PEDIDO</h2>
              <p>${order.id}</p>
            </div>
          </div>

          <div class="content-grid">
            <div class="section">
              <div class="section-title">📋 Información del Pedido</div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${order.date}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Hora:</span>
                <span class="info-value">${order.time}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cantidad de Items:</span>
                <span class="info-value">${order.items}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Estado:</span>
                <span class="info-value">
                  <span class="status-badge status-${order.status}">${statusText[order.status]}</span>
                </span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">👤 Información del Cliente</div>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${order.customer}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Teléfono:</span>
                <span class="info-value">${order.phone || 'No especificado'}</span>
              </div>
              ${order.address ? `
              <div class="info-row">
                <span class="info-label">Dirección:</span>
                <span class="info-value">${order.address}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="total-section">
            <div class="total-label">TOTAL A PAGAR</div>
            <div class="total-amount">$${order.total.toLocaleString()}</div>
          </div>

          ${order.notes ? `
          <div class="notes-box">
            <h4>📝 Notas del Cliente</h4>
            <p>${order.notes}</p>
          </div>
          ` : ''}

          <div class="qr-section">
            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
            <div class="qr-label">Escanea el código QR para ver información del pedido</div>
          </div>

          <div class="footer">
            <p class="brand">¡Gracias por su preferencia!</p>
            <p>Documento generado el ${new Date().toLocaleString('es-CO')}</p>
            <p>MINIMENU - Sistema de Gestión de Pedidos</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
    }
  };

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // --- Share Menu Helper Functions ---
  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };

  const validateSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (!slug) return false;
    setIsCheckingSlug(true);
    setSlugError(null);

    try {
      // Simular verificación de slug - en producción sería una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simular que algunos slugs no están disponibles
      const reservedSlugs = ['admin', 'api', 'menu', 'dashboard', 'login', 'register'];
      if (reservedSlugs.includes(slug)) {
        setSlugError('Este slug no está disponible');
        return false;
      }

      return true;
    } catch {
      setSlugError('Error al verificar disponibilidad');
      return false;
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string): void => {
    const formattedSlug = generateSlugFromName(value);
    setMenuSlug(formattedSlug);
    setSlugError(null);
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setToastMessage({ type: 'success', message: 'Enlace copiado al portapapeles' });
      setTimeout(() => {
        setCopiedToClipboard(false);
        setToastMessage(null);
      }, 2000);
    } catch {
      setToastMessage({ type: 'error', message: 'Error al copiar al portapapeles' });
    }
  };

  const handleShareImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage({ type: 'error', message: 'Por favor selecciona un archivo de imagen válido' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage({ type: 'error', message: 'La imagen no debe superar los 5MB' });
      return;
    }

    setIsUploadingShareImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomShareImage(base64);
      setIsUploadingShareImage(false);
      setToastMessage({ type: 'success', message: 'Imagen cargada correctamente' });
    };
    reader.onerror = () => {
      setIsUploadingShareImage(false);
      setToastMessage({ type: 'error', message: 'Error al cargar la imagen' });
    };
    reader.readAsDataURL(file);
  };

  const removeShareImage = (): void => {
    setCustomShareImage(null);
  };

  const getMenuUrl = (): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (menuSlugActive && menuSlug) {
      return `${baseUrl}/menu/${menuSlug}`;
    }
    // Usar el ID del negocio real como fallback
    return `${baseUrl}/menu/${profileId ?? user.businessId ?? ''}`;
  };

  const getQRCodeUrl = (): string => {
    const menuUrl = getMenuUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;
  };

  const getWhatsAppShareUrl = (): string => {
    const menuUrl = getMenuUrl();
    const defaultMessage = customShareMessage || `¡Hola! Te invito a ver nuestro menú digital 🍽️\n${menuUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(defaultMessage)}`;
  };

  const handleSaveShareSettings = async (): Promise<void> => {
    setIsSavingShare(true);
    setToastMessage(null);

    try {
      // Validar slug si está activo
      if (menuSlugActive && menuSlug) {
        if (!validateSlug(menuSlug)) {
          setSlugError('El slug debe tener entre 3-50 caracteres, solo letras minúsculas, números y guiones');
          setIsSavingShare(false);
          return;
        }

        const isAvailable = await checkSlugAvailability(menuSlug);
        if (!isAvailable) {
          setIsSavingShare(false);
          return;
        }
      }

      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: user.businessId,
          slug: menuSlugActive && menuSlug ? menuSlug : undefined
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setToastMessage({ type: 'success', message: 'Enlace guardado correctamente' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Error al guardar la URL' });
    } finally {
      setIsSavingShare(false);
    }
  };

  const downloadQR = async (): Promise<void> => {
    try {
      const qrUrl = getQRCodeUrl();
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-menu-${menuSlug || 'restaurant'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setToastMessage({ type: 'success', message: 'Código QR descargado' });
    } catch {
      setToastMessage({ type: 'error', message: 'Error al descargar el código QR' });
    }
  };

  // --- Profile Save Function ---
  const handleSaveProfile = async (): Promise<void> => {
    setIsSavingProfile(true);

    try {
      // Validar campos requeridos
      if (!profileForm.businessName.trim()) {
        setToastMessage({ type: 'error', message: 'El nombre del negocio es requerido' });
        setIsSavingProfile(false);
        return;
      }

      // Call the API to save the profile
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: user.businessId,
          name: profileForm.businessName,
          slug: profileForm.slug,
          phone: profileForm.phone,
          address: profileForm.address,
          primaryColor: profileForm.primaryColor,
          secondaryColor: profileForm.secondaryColor,
          impoconsumo: profileForm.impoconsumo,
          // Imágenes del negocio
          avatar: profileForm.avatar,
          logo: profileForm.logo,
          banner: profileForm.banner,
          bannerEnabled: profileForm.bannerEnabled,
          // Franja Hero Sutil
          heroImageUrl: profileForm.heroImageUrl,
          showHeroBanner: profileForm.showHeroBanner,
          // Propina Voluntaria
          tipEnabled: profileForm.tipEnabled,
          tipPercentageDefault: profileForm.tipPercentageDefault,
          tipOnlyOnPremise: profileForm.tipOnlyOnPremise,
          // Métodos de Pago
          paymentMethods: profileForm.paymentMethods
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar el perfil');
      }

      // Update local state with saved data
      if (data.data) {
        setProfileId(data.data.id);
        setProfileForm({
          businessName: data.data.name || '',
          slug: data.data.slug || '',
          phone: data.data.phone || '',
          address: data.data.address || '',
          primaryColor: data.data.primaryColor || '#8b5cf6',
          secondaryColor: data.data.secondaryColor || '#ffffff',
          impoconsumo: data.data.impoconsumo ?? 8,
          // Imágenes del negocio
          avatar: data.data.avatar || null,
          logo: data.data.logo || null,
          banner: data.data.banner || null,
          bannerEnabled: data.data.bannerEnabled ?? true,
          // Franja Hero Sutil
          heroImageUrl: data.data.heroImageUrl || null,
          showHeroBanner: data.data.showHeroBanner ?? false,
          // Favicon
          favicon: data.data.favicon || null,
          // Propina Voluntaria
          tipEnabled: data.data.tipEnabled ?? true,
          tipPercentageDefault: data.data.tipPercentageDefault ?? 10,
          tipOnlyOnPremise: data.data.tipOnlyOnPremise ?? true,
          // Métodos de Pago
          paymentMethods: data.data.paymentMethods ?? [
            { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true },
            { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
            { id: 'brepb', name: 'BRE-B', icon: '🔵', phone: '', accountHolder: '', qrImage: null, enabled: false },
            { id: 'daviplata', name: 'Daviplata', icon: '🔴', phone: '', accountHolder: '', qrImage: null, enabled: false },
            { id: 'bancolombia', name: 'Bancolombia', icon: '🟡', phone: '', accountHolder: '', qrImage: null, enabled: false }
          ]
        });
        // Note: Data is persisted in database via API. localStorage removed to avoid quota exceeded errors.
      }

      setToastMessage({ type: 'success', message: 'Perfil actualizado correctamente' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar el perfil';
      console.error('[Profile] Save error:', errorMsg);
      setToastMessage({ type: 'error', message: errorMsg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Save Empaque Function ---
  const handleSaveEmpaque = async (): Promise<void> => {
    // Validate
    if (valorEmpaqueUnitario < 0) {
      setToastMessage({ type: 'error', message: 'El valor no puede ser negativo' });
      return;
    }

    setIsSavingEmpaque(true);
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: user.businessId,
          valorEmpaqueUnitario: valorEmpaqueUnitario
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar el valor de empaque');
      }

      // Update localStorage (lightweight, no images)
      const savedProfile = localStorage.getItem('businessProfile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          parsed.valorEmpaqueUnitario = valorEmpaqueUnitario;
          localStorage.setItem('businessProfile', JSON.stringify(parsed));
        } catch (storageError) {
          // Ignore localStorage errors - data is already saved in database
          console.warn('[Empaque] localStorage update skipped:', storageError);
        }
      }

      setToastMessage({ type: 'success', message: 'Valor de empaque guardado correctamente' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar el valor de empaque';
      console.error('[Empaque] Save error:', errorMsg);
      setToastMessage({ type: 'error', message: errorMsg });
    } finally {
      setIsSavingEmpaque(false);
    }
  };

  const handleDownloadQR = async (): Promise<void> => {
    try {
      const qrUrl = getQRCodeUrl();
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-menu-${menuSlug || 'restaurant'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setToastMessage({ type: 'success', message: 'Código QR descargado' });
    } catch {
      setToastMessage({ type: 'error', message: 'Error al descargar el código QR' });
    }
  };

  // --- Printer Functions ---
  const loadPrinters = useCallback((): void => {
    try {
      const saved = localStorage.getItem('printers');
      if (saved) {
        setPrinters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('[Printers] Error loading:', error);
    }
  }, []);

  const savePrinters = useCallback((newPrinters: Printer[]): void => {
    try {
      localStorage.setItem('printers', JSON.stringify(newPrinters));
      setPrinters(newPrinters);
    } catch (error) {
      console.error('[Printers] Error saving:', error);
    }
  }, []);

  const openAddPrinterModal = (): void => {
    setEditingPrinter(null);
    setPrinterForm({
      name: '',
      type: 'Térmica',
      area: 'Cocina',
      ip: '',
      port: 9100,
      isDefault: false,
      isActive: true
    });
    setShowPrinterModal(true);
  };

  const openEditPrinterModal = (printer: Printer): void => {
    setEditingPrinter(printer);
    setPrinterForm({
      name: printer.name,
      type: printer.type,
      area: printer.area,
      ip: printer.ip,
      port: printer.port,
      isDefault: printer.isDefault,
      isActive: printer.isActive
    });
    setShowPrinterModal(true);
  };

  const handleSavePrinter = (): void => {
    if (!printerForm.name.trim() || !printerForm.ip.trim()) return;

    if (editingPrinter) {
      // Update existing
      const updated = printers.map(p =>
        p.id === editingPrinter.id
          ? { ...p, ...printerForm }
          : p
      );
      savePrinters(updated);
    } else {
      // Create new
      const newPrinter: Printer = {
        id: `printer-${Date.now()}`,
        ...printerForm,
        createdAt: new Date().toISOString()
      };
      savePrinters([...printers, newPrinter]);
    }

    setShowPrinterModal(false);
  };

  const handleDeletePrinter = (): void => {
    if (!printerToDelete) return;
    savePrinters(printers.filter(p => p.id !== printerToDelete.id));
    setShowPrinterDeleteConfirm(false);
    setPrinterToDelete(null);
  };

  const togglePrinterActive = (printerId: string): void => {
    const updated = printers.map(p =>
      p.id === printerId ? { ...p, isActive: !p.isActive } : p
    );
    savePrinters(updated);
  };

  const getAllPrinterTypes = (): string[] => {
    return [...defaultPrinterTypes, ...customPrinterTypes];
  };

  const getAllPrinterAreas = (): string[] => {
    return [...defaultPrinterAreas, ...customPrinterAreas];
  };

  const getPrinterTypeBadge = (type: string): string => {
    const colors: Record<string, string> = {
      'Térmica': 'bg-blue-100 text-blue-800',
      'Inyección': 'bg-green-100 text-green-800',
      'Láser': 'bg-purple-100 text-purple-800',
      'Matricial': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPrinterAreaBadge = (area: string): string => {
    const colors: Record<string, string> = {
      'Cocina': 'bg-red-100 text-red-800',
      'Barra': 'bg-yellow-100 text-yellow-800',
      'Caja': 'bg-green-100 text-green-800',
      'General': 'bg-blue-100 text-blue-800'
    };
    return colors[area] || 'bg-gray-100 text-gray-800';
  };

  // Load printers on mount
  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full" key={`sidebar-${hasReviews}`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            MINIMENU
          </h1>
          <p className="text-xs text-gray-400 mt-1">Panel de Negocio</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
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

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-800">
          <Button
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 mb-2"
            onClick={() => {
              console.log('[DEBUG] user.businessId:', user.businessId);
              console.log('[DEBUG] profileId:', profileId);
              console.log('[DEBUG] hasReviews:', hasReviews);
              console.log('[DEBUG] sidebarItems:', sidebarItems.map(i => ({ id: i.id, label: i.label })));
              alert(`DEBUG:\nuser.businessId: ${user.businessId}\nprofileId: ${profileId}\nhasReviews: ${hasReviews}\nItems: ${sidebarItems.length}`);
            }}
          >
            🔍 Debug Info
          </Button>
          <Button
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Mi Código QR
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            {profileForm.avatar ? (
              <img
                src={profileForm.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
              />
            ) : (
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                {(user.name ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{user.name ?? 'Usuario'}</p>
              <p className="text-xs text-gray-400">{user.email ?? ''}</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-gray-600 mt-1">
              Bienvenido, {user.name}
            </p>
          </div>
          <Button variant="outline" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pedidos Hoy</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ingresos Hoy</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${(stats.todayRevenue / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pedidos Pendientes</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Bell className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Productos</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getAllUnifiedOrders().slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[150px]">{order.customer}</p>
                          <p className="text-xs text-gray-500">{order.orderNumber || order.id.slice(-6)} • {order.items} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">${order.total.toLocaleString()}</p>
                        <StatusBadge status={order.status as any} />
                      </div>
                    </div>
                  ))}
                  {getAllUnifiedOrders().length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>No hay pedidos recientes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Catálogo Tab */}
        {activeTab === 'catalogo' && (
          <div className="space-y-6">
            <Tabs defaultValue="productos">
              <TabsList>
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="categorias">Categorías</TabsTrigger>
              </TabsList>

              <TabsContent value="productos" className="space-y-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <Button
                    onClick={() => setShowProductModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>

                  {/* AI Buttons - Only show if business has active AI Catalog service */}
                  {!isCheckingAI && hasCatalogAI && (
                    <>
                      <Button
                        onClick={() => setShowAITextModal(true)}
                        variant="outline"
                        className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Crear con IA (Texto)
                      </Button>

                      <Button
                        onClick={() => setShowAIVoiceModal(true)}
                        variant="outline"
                        className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Crear con IA (Voz)
                      </Button>
                    </>
                  )}

                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchProduct}
                      onChange={e => setSearchProduct(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Product Filters */}
                  <div className="flex gap-2 flex-wrap">
                    <select
                      className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">📁 Todas las categorías</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>

                    <select
                      className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                      value={filterAvailability}
                      onChange={(e) => setFilterAvailability(e.target.value)}
                    >
                      <option value="all">📋 Todos los estados</option>
                      <option value="available">✅ Activos</option>
                      <option value="unavailable">❌ Inactivos</option>
                    </select>

                    <select
                      className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                      value={filterFeatured}
                      onChange={(e) => setFilterFeatured(e.target.value)}
                    >
                      <option value="all">⭐ Todos</option>
                      <option value="featured">⭐ Destacados</option>
                      <option value="normal">📌 Normales</option>
                    </select>

                    {(filterCategory !== 'all' || filterAvailability !== 'all' || filterFeatured !== 'all' || searchProduct) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilterCategory('all');
                          setFilterAvailability('all');
                          setFilterFeatured('all');
                          setSearchProduct('');
                        }}
                        className="text-gray-600"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Limpiar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products
                    .filter(p => {
                      // Filter by search text
                      const matchesSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase());
                      // Filter by category
                      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
                      // Filter by availability
                      const matchesAvailability = filterAvailability === 'all' ||
                        (filterAvailability === 'available' && p.isAvailable) ||
                        (filterAvailability === 'unavailable' && !p.isAvailable);
                      // Filter by featured
                      const matchesFeatured = filterFeatured === 'all' ||
                        (filterFeatured === 'featured' && p.isFeatured) ||
                        (filterFeatured === 'normal' && !p.isFeatured);

                      return matchesSearch && matchesCategory && matchesAvailability && matchesFeatured;
                    })
                    .map(product => (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                        {/* Product Image */}
                        <div className="w-full h-40 bg-gray-100 relative">
                          {product.image && product.image.startsWith('data:image/') ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center">
                                    <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  </div>
                                `;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-500">{product.category}</p>
                            </div>
                            {product.isFeatured && (
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xl font-bold">${product.price.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">Stock: {product.stock ?? 0}</p>
                            </div>
                            <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                              {product.isAvailable ? 'Disponible' : 'Agotado'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openEditProduct(product)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => openDeleteConfirm(product)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="categorias" className="space-y-6">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Categoría
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map(category => (
                    <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="text-4xl mb-2">{category.icon}</div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-gray-500">{products.filter(p => p.category === category.name).length} productos</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Pedidos Tab - Kanban 3 Columnas */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4">
            {/* Notifications Toast */}
            {notifications.length > 0 && (
              <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg shadow-lg flex items-start gap-3 animate-slide-in ${notif.type === 'restaurante'
                      ? 'bg-orange-500 text-white'
                      : 'bg-blue-500 text-white'
                      }`}
                  >
                    <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.message}</p>
                      <p className="text-xs opacity-80 mt-1">
                        {notif.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notif.id)}
                      className="text-white/80 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Bar and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por ID, cliente, teléfono, dirección..."
                  value={pedidosSearchQuery}
                  onChange={(e) => setPedidosSearchQuery(e.target.value)}
                  className="pl-10 pr-10 bg-white"
                />
                {pedidosSearchQuery && (
                  <button
                    onClick={() => setPedidosSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                className="h-10 rounded-md border border-gray-300 px-3 text-sm bg-white"
                value={pedidosStatusFilter}
                onChange={(e) => setPedidosStatusFilter(e.target.value)}
              >
                <option value="all">📋 Todos los estados</option>
                <option value="pending">⏳ Pendiente</option>
                <option value="confirmed">✅ Confirmado</option>
                <option value="preparing">🍳 Preparando</option>
                <option value="ready">🍽️ Listo</option>
                <option value="on_the_way">🚚 En camino</option>
                <option value="delivered">✓ Entregado</option>
                <option value="cancelled">❌ Cancelado</option>
              </select>

              {/* Date Filter */}
              <select
                className="h-10 rounded-md border border-gray-300 px-3 text-sm bg-white"
                value={pedidosDateFilter}
                onChange={(e) => setPedidosDateFilter(e.target.value)}
              >
                <option value="all">📅 Todas las fechas</option>
                <option value="today">📅 Hoy</option>
                <option value="yesterday">📅 Ayer</option>
                <option value="week">📅 Última semana</option>
                <option value="month">📅 Último mes</option>
              </select>

              {/* Clear Filters Button */}
              {(pedidosStatusFilter !== 'all' || pedidosDateFilter !== 'all' || pedidosSearchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPedidosStatusFilter('all');
                    setPedidosDateFilter('all');
                    setPedidosSearchQuery('');
                  }}
                  className="text-gray-600 whitespace-nowrap"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>

            {/* Mobile Column Selector */}
            <div className="flex md:hidden gap-2 mb-4">
              <Button
                variant={mobileOrderColumn === 'all' ? 'default' : 'outline'}
                onClick={() => setMobileOrderColumn('all')}
                className={mobileOrderColumn === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                Todos ({getOrdersByType('all').length})
              </Button>
              <Button
                variant={mobileOrderColumn === 'restaurante' ? 'default' : 'outline'}
                onClick={() => setMobileOrderColumn('restaurante')}
                className={mobileOrderColumn === 'restaurante' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                🍽️ Restaurante ({getOrdersByType('restaurante').length})
              </Button>
              <Button
                variant={mobileOrderColumn === 'domicilio' ? 'default' : 'outline'}
                onClick={() => setMobileOrderColumn('domicilio')}
                className={mobileOrderColumn === 'domicilio' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                🚚 Domicilio ({getOrdersByType('domicilio').length})
              </Button>
            </div>

            {/* 3 Column Layout - Desktop/Tablet */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Columna TODOS - Solo Desktop (lg) */}
              <div className="hidden lg:flex flex-col bg-gray-50 rounded-lg overflow-hidden">
                {/* Encabezado TODOS */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <List className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white text-lg tracking-wide">
                        TODOS
                      </h3>
                    </div>
                    <Badge className="bg-white/90 text-blue-700 font-bold px-3 py-1 text-sm shadow-sm">
                      {getOrdersByType('all').length}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-3 pr-1">
                    {getOrdersByType('all').map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        timer={orderTimers.get(order.id)}
                        onView={() => handleViewUnifiedOrder(order)}
                      />
                    ))}
                    {getOrdersByType('all').length === 0 && (
                      <p className="text-center text-gray-500 py-8">No hay pedidos</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna RESTAURANTE */}
              <div className="flex flex-col bg-green-50 rounded-lg overflow-hidden">
                {/* Encabezado RESTAURANTE */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white text-lg tracking-wide">
                        RESTAURANTE
                      </h3>
                    </div>
                    <Badge className="bg-white/90 text-green-700 font-bold px-3 py-1 text-sm shadow-sm">
                      {getOrdersByType('restaurante').length}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-3 pr-1">
                    {getOrdersByType('restaurante').map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        timer={orderTimers.get(order.id)}
                        onView={() => handleViewUnifiedOrder(order)}
                      />
                    ))}
                    {getOrdersByType('restaurante').length === 0 && (
                      <p className="text-center text-gray-500 py-8">No hay pedidos de restaurante</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna DOMICILIO */}
              <div className="flex flex-col bg-orange-50 rounded-lg overflow-hidden">
                {/* Encabezado DOMICILIO */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Bike className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white text-lg tracking-wide">
                        DOMICILIO
                      </h3>
                    </div>
                    <Badge className="bg-white/90 text-orange-600 font-bold px-3 py-1 text-sm shadow-sm">
                      {getOrdersByType('domicilio').length}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-3 pr-1">
                    {getOrdersByType('domicilio').map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        timer={orderTimers.get(order.id)}
                        onView={() => handleViewUnifiedOrder(order)}
                      />
                    ))}
                    {getOrdersByType('domicilio').length === 0 && (
                      <p className="text-center text-gray-500 py-8">No hay pedidos a domicilio</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile View - Single Column */}
            <div className="md:hidden">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex-1 overflow-y-auto max-h-[70vh] space-y-3">
                  {getOrdersByType(mobileOrderColumn).map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      timer={orderTimers.get(order.id)}
                      onView={() => handleViewUnifiedOrder(order)}
                    />
                  ))}
                  {getOrdersByType(mobileOrderColumn).length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay pedidos</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TPV Restaurante Tab */}
        {activeTab === 'tpv' && (
          <div className="space-y-6">
            {/* Header with Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Factura Restaurante</h2>
                <p className="text-gray-600 mt-1">TPV para crear facturas de consumo en sitio</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={invoiceViewMode === 'create' ? 'default' : 'outline'}
                  onClick={() => setInvoiceViewMode('create')}
                  className={invoiceViewMode === 'create' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Factura
                </Button>
                <Button
                  variant={invoiceViewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setInvoiceViewMode('list')}
                  className={invoiceViewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Facturas ({invoices.length})
                </Button>
              </div>
            </div>

            {/* Success Message */}
            {invoiceCreated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-green-700 font-medium">Factura creada exitosamente</p>
              </div>
            )}

            {invoiceViewMode === 'create' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products Section */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar productos..."
                      value={productSearchQuery}
                      onChange={e => setProductSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {getFilteredProductsForInvoice().map(product => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Utensils className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-purple-600 font-bold text-sm">${product.price.toLocaleString()}</p>
                          {product.stock !== undefined && product.stock > 0 && (
                            <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Cart Section */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Carrito</span>
                      {cart.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearCart}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Carrito vacío</p>
                      ) : (
                        cart.map(item => (
                          <div key={item.productId} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.productName}</p>
                              <p className="text-xs text-gray-500">${item.unitPrice.toLocaleString()} c/u</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label className="text-sm text-gray-600">Nombre del Cliente</Label>
                        <Input
                          placeholder="Cliente Mostrador"
                          value={invoiceCustomerName}
                          onChange={e => setInvoiceCustomerName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Teléfono (Opcional)</Label>
                        <Input
                          placeholder="+57 300 000 0000"
                          value={invoiceCustomerPhone}
                          onChange={e => setInvoiceCustomerPhone(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Método de Pago</Label>
                        <div className="flex gap-2 mt-1">
                          {[
                            { value: 'cash', label: 'Efectivo', icon: '💵' },
                            { value: 'card', label: 'Tarjeta', icon: '💳' },
                            { value: 'transfer', label: 'Transfer', icon: '📱' }
                          ].map(method => (
                            <Button
                              key={method.value}
                              type="button"
                              variant={invoicePaymentMethod === method.value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setInvoicePaymentMethod(method.value as 'cash' | 'card' | 'transfer')}
                              className={invoicePaymentMethod === method.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
                            >
                              <span className="mr-1">{method.icon}</span>
                              {method.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Totals */}
                    {cart.length > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">${getCartTotals().subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Impoconsumo ({profileForm.impoconsumo}%):</span>
                          <span className="font-medium">${getCartTotals().tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Total:</span>
                          <span className="text-purple-600">${getCartTotals().total.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Create Invoice Button */}
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={cart.length === 0 || isCreatingInvoice}
                      onClick={handleCreateInvoice}
                    >
                      {isCreatingInvoice ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Crear Factura
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Invoices List */
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle>Facturas Creadas</CardTitle>
                    {/* Export Button */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportInvoicesToCSV}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Exportar CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Toast Notification */}
                  {invoiceToast && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${invoiceToast.type === 'success' ? 'bg-green-100 text-green-800' :
                      invoiceToast.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {invoiceToast.type === 'success' && <Check className="w-4 h-4" />}
                      {invoiceToast.type === 'error' && <X className="w-4 h-4" />}
                      {invoiceToast.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                      <span className="text-sm">{invoiceToast.message}</span>
                    </div>
                  )}

                  {/* Date Filters - FILTROS EXISTENTES */}
                  <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Filtrar por fecha:</span>
                    </div>
                    <Input
                      type="date"
                      value={invoiceDateFrom}
                      onChange={(e) => { setInvoiceDateFrom(e.target.value); setInvoicePage(1); }}
                      className="w-40"
                      placeholder="Desde"
                    />
                    <span className="text-gray-400">—</span>
                    <Input
                      type="date"
                      value={invoiceDateTo}
                      onChange={(e) => { setInvoiceDateTo(e.target.value); setInvoicePage(1); }}
                      className="w-40"
                      placeholder="Hasta"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearInvoiceFilters}
                      className="text-gray-600"
                    >
                      Limpiar
                    </Button>
                    {(invoiceDateFrom || invoiceDateTo) && (
                      <span className="text-sm text-purple-600">
                        {getFilteredInvoices().length} factura(s) encontrada(s)
                      </span>
                    )}
                  </div>

                  {/* NUEVA BARRA DE HERRAMIENTAS - Selección por rango de fechas */}
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Seleccionar por rango:</span>
                        </div>
                        <Input
                          type="date"
                          value={invoiceDateFrom}
                          onChange={(e) => setInvoiceDateFrom(e.target.value)}
                          className="w-40 h-9 bg-white"
                          placeholder="Desde"
                        />
                        <span className="text-gray-400">—</span>
                        <Input
                          type="date"
                          value={invoiceDateTo}
                          onChange={(e) => setInvoiceDateTo(e.target.value)}
                          className="w-40 h-9 bg-white"
                          placeholder="Hasta"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectInvoicesByDateRange}
                          className="text-orange-600 border-orange-300 hover:bg-orange-100"
                        >
                          🔍 Seleccionar por fechas
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearDateSelection}
                          className="text-gray-600"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Limpiar selección
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedInvoiceIds.size > 0 && (
                    <>
                      {/* CHIP DE RESUMEN DE SELECCIÓN */}
                      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">
                              <strong>{selectedInvoiceIds.size}</strong> factura(s) seleccionada(s)
                            </span>
                          </div>
                          {(invoiceDateFrom && invoiceDateTo) && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                              <Calendar className="w-3 h-3 text-purple-600" />
                              <span className="text-xs text-purple-700">
                                📅 {invoiceDateFrom} → {invoiceDateTo}
                              </span>
                            </div>
                          )}
                          {dateSelectionCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                              <span className="text-xs text-purple-700">
                                📊 {dateSelectionCount} del rango
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearDateSelection}
                            className="text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* BARRA DE ACCIONES MASIVAS */}
                      <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-red-700 font-medium">
                          {selectedInvoiceIds.size} factura(s) seleccionada(s)
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoiceIds(new Set())}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowBulkDeleteConfirm(true)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar Seleccionadas
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* BARRA DE PROGRESO - Eliminación masiva en curso */}
                  {isDeletingInvoices && (
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">
                            🔄 Eliminando facturas... {deleteProgress.batch} de {deleteProgress.totalBatches}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-orange-800">
                          {deleteProgress.current} de {deleteProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-orange-500 h-full transition-all duration-300 ease-in-out"
                          style={{
                            width: `${deleteProgress.total > 0 ? (deleteProgress.current / deleteProgress.total) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-orange-700 mt-2">
                        Procesando lote {deleteProgress.batch} de {deleteProgress.totalBatches}...
                      </p>
                    </div>
                  )}

                  {/* Bulk Delete Confirmation Modal */}
                  {showBulkDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar eliminación</h3>
                        <p className="text-gray-600 mb-4">
                          Estás a punto de eliminar <strong>{selectedInvoiceIds.size} factura(s)</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowBulkDeleteConfirm(false)}
                            disabled={isDeletingInvoices}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={bulkDeleteInvoices}
                            disabled={isDeletingInvoices}
                          >
                            {isDeletingInvoices ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Eliminando...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoadingInvoices ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay facturas creadas</p>
                      <p className="text-sm">Crea tu primera factura para comenzar</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-3 text-gray-500 font-medium w-10">
                                <input
                                  type="checkbox"
                                  checked={getFilteredInvoices().length > 0 && selectedInvoiceIds.size === getFilteredInvoices().length}
                                  onChange={toggleAllInvoices}
                                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                              </th>
                              <th className="text-left py-3 px-3 text-gray-500 font-medium">Factura</th>
                              <th className="text-left py-3 px-3 text-gray-500 font-medium">Cliente</th>
                              <th className="text-left py-3 px-3 text-gray-500 font-medium">Items</th>
                              <th className="text-left py-3 px-3 text-gray-500 font-medium">Total</th>
                              <th className="text-left py-3 px-3 text-gray-500 font-medium">Pago</th>
                              <th className="text-left py-3 px-3 text-gray-500 font-medium">Fecha</th>
                              <th className="text-left py-3 px-3 text-gray-500 font-medium">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getPaginatedInvoices().map(invoice => (
                              <tr key={invoice.id} className={`border-b hover:bg-gray-50 ${selectedInvoiceIds.has(invoice.id) ? 'bg-purple-50' : ''}`}>
                                <td className="py-3 px-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedInvoiceIds.has(invoice.id)}
                                    onChange={() => toggleInvoiceSelection(invoice.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-purple-600">{invoice.invoiceNumber}</span>
                                    {invoice.source === 'cart' && (
                                      <Badge className="bg-blue-100 text-blue-700 text-xs">Carrito</Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div>
                                    <p className="font-medium">{invoice.customerName}</p>
                                    {invoice.customerPhone && (
                                      <p className="text-xs text-gray-500">{invoice.customerPhone}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {invoice.items.length} items
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-bold text-green-600">
                                  ${invoice.total.toLocaleString()}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`text-xs px-2 py-1 rounded ${invoice.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                                    invoice.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                                      'bg-purple-100 text-purple-700'
                                    }`}>
                                    {invoice.paymentMethod === 'cash' ? 'Efectivo' :
                                      invoice.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-gray-600">
                                  {new Date(invoice.createdAt).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                      onClick={() => openInvoiceDetail(invoice)}
                                      title="Ver detalle"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                      onClick={() => printRestaurantInvoiceTicket(invoice)}
                                      title="Imprimir ticket"
                                    >
                                      <PrinterIcon className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                                      onClick={() => downloadRestaurantInvoicePDF(invoice)}
                                      title="Descargar PDF"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        if (confirm('¿Estás seguro de eliminar esta factura?')) {
                                          deleteSingleInvoice(invoice.id);
                                        }
                                      }}
                                      title="Eliminar"
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

                      {/* Pagination */}
                      {getTotalInvoicePages() > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-sm text-gray-600">
                            Mostrando {((invoicePage - 1) * invoicePageSize) + 1} - {Math.min(invoicePage * invoicePageSize, getFilteredInvoices().length)} de {getFilteredInvoices().length} facturas
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                              disabled={invoicePage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Anterior
                            </Button>
                            <span className="px-3 py-1 bg-gray-100 rounded text-sm">
                              Página {invoicePage} de {getTotalInvoicePages()}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInvoicePage(p => Math.min(getTotalInvoicePages(), p + 1))}
                              disabled={invoicePage === getTotalInvoicePages()}
                            >
                              Siguiente
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Domicilios Tab */}
        {activeTab === 'domicilios' && (
          <div className="space-y-6">
            {/* Header with Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Facturación Domicilio</h2>
                <p className="text-gray-600 mt-1">TPV para crear facturas de domicilios</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={deliveryViewMode === 'create' ? 'default' : 'outline'}
                  onClick={() => setDeliveryViewMode('create')}
                  className={deliveryViewMode === 'create' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Factura
                </Button>
                <Button
                  variant={deliveryViewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setDeliveryViewMode('list')}
                  className={deliveryViewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Facturas ({deliveryInvoices.length})
                </Button>
              </div>
            </div>

            {/* TPV Domicilio - Create Mode */}
            {deliveryViewMode === 'create' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Productos */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Productos</CardTitle>
                      <div className="relative mt-2">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Buscar producto..."
                          value={deliverySearchQuery}
                          onChange={(e) => setDeliverySearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                        {getFilteredProductsForDelivery().map(product => (
                          <div
                            key={product.id}
                            onClick={() => addToDeliveryCart(product)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-purple-400 hover:bg-purple-50 ${deliveryCart.some(item => item.productId === product.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200'
                              }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-8 h-8 rounded object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <span className="text-xs font-medium text-purple-600">{product.category}</span>
                            </div>
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-sm font-bold text-green-600">{formatPrice(product.price)}</p>
                            {deliveryCart.some(item => item.productId === product.id) && (
                              <Badge className="mt-1 bg-purple-500 text-white text-xs">
                                {deliveryCart.find(item => item.productId === product.id)?.quantity || 0}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Carrito y Cliente */}
                <div className="space-y-4">
                  {/* Cliente */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Datos del Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Nombre *</Label>
                        <Input
                          placeholder="Nombre del cliente"
                          value={deliveryCustomerName}
                          onChange={(e) => setDeliveryCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Teléfono *</Label>
                        <Input
                          placeholder="+57 300 000 0000"
                          value={deliveryCustomerPhone}
                          onChange={(e) => setDeliveryCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Dirección *</Label>
                        <Input
                          placeholder="Calle #..."
                          value={deliveryCustomerAddress}
                          onChange={(e) => setDeliveryCustomerAddress(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Barrio</Label>
                        <Input
                          placeholder="Barrio"
                          value={deliveryCustomerNeighborhood}
                          onChange={(e) => setDeliveryCustomerNeighborhood(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Carrito */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          Carrito
                        </span>
                        {deliveryCart.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearDeliveryCart}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deliveryCart.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          Selecciona productos para agregar
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {deliveryCart.map(item => (
                            <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.productName}</p>
                                <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-7 h-7 p-0"
                                  onClick={() => updateDeliveryCartQuantity(item.productId, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-7 h-7 p-0"
                                  onClick={() => updateDeliveryCartQuantity(item.productId, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pago y Totales */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Pago y Totales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Método de Pago</Label>
                        <div className="flex gap-2 mt-1">
                          {(['cash', 'card', 'transfer'] as const).map(method => (
                            <Button
                              key={method}
                              size="sm"
                              variant={deliveryPaymentMethod === method ? 'default' : 'outline'}
                              onClick={() => setDeliveryPaymentMethod(method)}
                              className={deliveryPaymentMethod === method ? 'bg-purple-600 hover:bg-purple-700' : ''}
                            >
                              {method === 'cash' ? '💵 Efectivo' : method === 'card' ? '💳 Tarjeta' : '🏦 Transfer'}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Estado del Pago</Label>
                        <div className="flex gap-2 mt-1">
                          <Button
                            size="sm"
                            variant={deliveryPaymentStatus === 'pending' ? 'default' : 'outline'}
                            onClick={() => setDeliveryPaymentStatus('pending')}
                            className={deliveryPaymentStatus === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                          >
                            Pendiente
                          </Button>
                          <Button
                            size="sm"
                            variant={deliveryPaymentStatus === 'paid' ? 'default' : 'outline'}
                            onClick={() => setDeliveryPaymentStatus('paid')}
                            className={deliveryPaymentStatus === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                          >
                            Pagado
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Valor Domicilio</Label>
                        <Input
                          type="number"
                          value={deliveryFee}
                          onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Notas</Label>
                        <textarea
                          className="w-full h-16 px-3 py-2 text-sm border border-gray-300 rounded-md resize-none"
                          placeholder="Notas del pedido..."
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                        />
                      </div>

                      {/* Totales */}
                      <div className="border-t pt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatPrice(getDeliveryCartTotals().subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Empaque ({deliveryCart.filter(i => i.requiereEmpaque).reduce((s, i) => s + i.quantity, 0)} items):</span>
                          <span>{formatPrice(getDeliveryCartTotals().empaqueTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Domicilio:</span>
                          <span>{formatPrice(deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>TOTAL:</span>
                          <span className="text-green-600">{formatPrice(getDeliveryCartTotals().total)}</span>
                        </div>
                      </div>

                      {/* Crear Factura Button */}
                      <Button
                        onClick={handleCreateDeliveryInvoice}
                        disabled={
                          deliveryCart.length === 0 ||
                          !deliveryCustomerName.trim() ||
                          !deliveryCustomerPhone.trim() ||
                          !deliveryCustomerAddress.trim() ||
                          isCreatingDeliveryInvoice
                        }
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isCreatingDeliveryInvoice ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creando...
                          </>
                        ) : deliveryInvoiceCreated ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Factura {lastDeliveryInvoiceNumber} Creada
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Crear Factura
                          </>
                        )}
                      </Button>

                      {deliveryInvoiceCreated && (
                        <Button
                          onClick={clearDeliveryCart}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nueva Factura
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Lista de Facturas */}
            {deliveryViewMode === 'list' && (
              <>
                {/* Stats Cards - Using real delivery invoices */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-600">Pendientes</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            {deliveryInvoices.filter(d => d.status === 'pending').length}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600">Preparando</p>
                          <p className="text-2xl font-bold text-orange-700">
                            {deliveryInvoices.filter(d => d.status === 'preparing').length}
                          </p>
                        </div>
                        <Package className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">En Camino</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {deliveryInvoices.filter(d => d.status === 'on_the_way').length}
                          </p>
                        </div>
                        <Truck className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Entregados</p>
                          <p className="text-2xl font-bold text-green-700">
                            {deliveryInvoices.filter(d => d.status === 'delivered').length}
                          </p>
                        </div>
                        <Check className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={deliveryFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setDeliveryFilter('all')}
                      className={deliveryFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={deliveryFilter === 'pending' ? 'default' : 'outline'}
                      onClick={() => setDeliveryFilter('pending')}
                      className={deliveryFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                      Pendientes
                    </Button>
                    <Button
                      variant={deliveryFilter === 'on_the_way' ? 'default' : 'outline'}
                      onClick={() => setDeliveryFilter('on_the_way')}
                      className={deliveryFilter === 'on_the_way' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                    >
                      En Camino
                    </Button>
                    <Button
                      variant={deliveryFilter === 'delivered' ? 'default' : 'outline'}
                      onClick={() => setDeliveryFilter('delivered')}
                      className={deliveryFilter === 'delivered' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      Entregados
                    </Button>
                  </div>
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, factura o dirección..."
                      value={deliverySearch}
                      onChange={(e) => setDeliverySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* NEW: Date Filter Row for Domicilios */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Filtrar por fecha:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={deliveryDateFrom}
                      onChange={(e) => setDeliveryDateFrom(e.target.value)}
                      className="px-3 py-1.5 border rounded-lg text-sm"
                      placeholder="Desde"
                    />
                    <span className="text-gray-500">a</span>
                    <input
                      type="date"
                      value={deliveryDateTo}
                      onChange={(e) => setDeliveryDateTo(e.target.value)}
                      className="px-3 py-1.5 border rounded-lg text-sm"
                      placeholder="Hasta"
                    />
                  </div>
                  {(deliveryDateFrom || deliveryDateTo) && (
                    <Button size="sm" variant="outline" onClick={clearDeliveryDateFilter}>
                      Limpiar
                    </Button>
                  )}
                </div>

                {/* NEW: Bulk Actions Bar for Domicilios */}
                {selectedDeliveryIds.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-sm font-medium text-purple-700">
                      {selectedDeliveryIds.size} domicilio{selectedDeliveryIds.size !== 1 ? 's' : ''} seleccionado{selectedDeliveryIds.size !== 1 ? 's' : ''}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowDeliveryDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar seleccionados
                    </Button>
                  </div>
                )}

                {/* Delivery Invoices Table - Using real invoices from TPV */}
                <Card>
                  <CardContent className="p-0">
                    {isLoadingDeliveryInvoices ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      </div>
                    ) : deliveryInvoices.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Truck className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No hay facturas de domicilio</p>
                        <p className="text-sm mt-1">Crea facturas de domicilio desde el TPV para verlas aquí</p>
                        <Button
                          className="mt-4 bg-purple-600 hover:bg-purple-700"
                          onClick={() => setDeliveryViewMode('create')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Primera Factura
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedDeliveryIds.size === getFilteredDeliveryInvoicesByDate().length && getFilteredDeliveryInvoicesByDate().length > 0}
                                  onChange={(e) => toggleAllDeliveryInvoices(e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                              </th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Factura</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Cliente</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Dirección</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Items</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Total</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Estado</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Pago</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Fecha</th>
                              <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Entrega Est.</th>
                              <th className="text-right px-4 py-3 font-medium text-gray-600 text-sm">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {getFilteredDeliveryInvoicesByDate().map(invoice => (
                              <tr key={invoice.id} className="hover:bg-gray-50">
                                <td className="px-3 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedDeliveryIds.has(invoice.id)}
                                    onChange={() => toggleDeliveryInvoiceSelection(invoice.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-medium text-purple-600">{invoice.invoiceNumber}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-gray-900">{invoice.customerName}</p>
                                    <p className="text-xs text-gray-500">{invoice.customerPhone}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="max-w-[200px]">
                                    <p className="text-sm text-gray-900 truncate">{invoice.customerAddress}</p>
                                    <p className="text-xs text-gray-500">{invoice.customerNeighborhood}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">{invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-bold text-gray-900">${invoice.total.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Domicilio: ${invoice.deliveryFee.toLocaleString()}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={getDeliveryInvoiceStatusColor(invoice.status)}>
                                    {getDeliveryInvoiceStatusText(invoice.status)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <Badge className={getDeliveryInvoicePaymentStatusColor(invoice.paymentStatus)}>
                                      {invoice.paymentStatus === 'pending' ? 'Pendiente' : 'Pagado'}
                                    </Badge>
                                    <p className="text-xs text-gray-500 mt-1">{getDeliveryInvoicePaymentMethodText(invoice.paymentMethod)}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {new Date(invoice.createdAt).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{invoice.estimatedDelivery}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Ver detalles */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                                      title="Ver detalles"
                                      onClick={() => {
                                        setSelectedDeliveryInvoice(invoice);
                                        setShowDeliveryInvoiceDetail(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {/* Imprimir directo */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                      title="Imprimir ticket"
                                      onClick={() => printDeliveryInvoiceTicket(invoice)}
                                    >
                                      <PrinterIcon className="w-4 h-4" />
                                    </Button>
                                    {/* Editar */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50"
                                      title="Editar factura"
                                      onClick={() => {
                                        setEditingDeliveryInvoice({ ...invoice });
                                        setShowDeliveryInvoiceEdit(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    {/* Descargar PDF */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                                      title="Descargar PDF"
                                      onClick={() => {
                                        const pdfContent = `
                                      <html>
                                      <head>
                                        <title>Factura ${invoice.invoiceNumber}</title>
                                        <meta charset="UTF-8">
                                        <style>
                                          @page { size: A4; margin: 15mm; }
                                          * { margin: 0; padding: 0; box-sizing: border-box; }
                                          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; }
                                          .invoice { max-width: 100%; margin: 0 auto; }
                                          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #8b5cf6; }
                                          .business-info h1 { font-size: 24px; font-weight: bold; color: #8b5cf6; }
                                          .business-info p { font-size: 11px; color: #666; }
                                          .invoice-badge { background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 8px; text-align: center; }
                                          .invoice-badge h2 { font-size: 14px; }
                                          .invoice-badge p { font-size: 20px; font-weight: bold; }
                                          .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                                          .section { background: #f9fafb; border-radius: 8px; padding: 15px; border: 1px solid #e5e7eb; }
                                          .section-title { font-size: 13px; font-weight: bold; color: #8b5cf6; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
                                          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
                                          .info-label { font-weight: 600; color: #6b7280; }
                                          .info-value { font-weight: 500; color: #111827; }
                                          .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                                          .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                                          .items-table th { background: #f9fafb; font-weight: 600; color: #6b7280; }
                                          .total-section { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
                                          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                                          .total-row.grand { font-size: 24px; font-weight: bold; }
                                          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
                                          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="invoice">
                                          <div class="header">
                                            <div class="business-info">
                                              <h1>${profileForm.businessName || 'MINIMENU'}</h1>
                                              <p>${profileForm.address || ''}</p>
                                              <p>${profileForm.phone || ''}</p>
                                            </div>
                                            <div class="invoice-badge">
                                              <h2>FACTURA DOMICILIO</h2>
                                              <p>${invoice.invoiceNumber}</p>
                                            </div>
                                          </div>
                                          <div class="content-grid">
                                            <div class="section">
                                              <div class="section-title">👤 Cliente</div>
                                              <div class="info-row"><span class="info-label">Nombre:</span><span class="info-value">${invoice.customerName}</span></div>
                                              <div class="info-row"><span class="info-label">Teléfono:</span><span class="info-value">${invoice.customerPhone}</span></div>
                                              <div class="info-row"><span class="info-label">Dirección:</span><span class="info-value">${invoice.customerAddress}</span></div>
                                              <div class="info-row"><span class="info-label">Barrio:</span><span class="info-value">${invoice.customerNeighborhood}</span></div>
                                            </div>
                                            <div class="section">
                                              <div class="section-title">📦 Pedido</div>
                                              <div class="info-row"><span class="info-label">Fecha:</span><span class="info-value">${new Date(invoice.createdAt).toLocaleDateString('es-CO')}</span></div>
                                              <div class="info-row"><span class="info-label">Entrega Est.:</span><span class="info-value">${invoice.estimatedDelivery}</span></div>
                                              <div class="info-row"><span class="info-label">Método Pago:</span><span class="info-value">${invoice.paymentMethod === 'cash' ? 'Efectivo' : invoice.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</span></div>
                                              <div class="info-row"><span class="info-label">Estado:</span><span class="info-value">${invoice.status}</span></div>
                                            </div>
                                          </div>
                                          <table class="items-table">
                                            <thead><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
                                            <tbody>
                                              ${invoice.items.map(i => `<tr><td>${i.productName}</td><td>${i.quantity}</td><td>$${i.unitPrice.toLocaleString()}</td><td>$${(i.unitPrice * i.quantity).toLocaleString()}</td></tr>`).join('')}
                                            </tbody>
                                          </table>
                                          <div class="total-section">
                                            <div class="total-row"><span>Subtotal:</span><span>$${invoice.subtotal.toLocaleString()}</span></div>
                                            <div class="total-row"><span>Domicilio:</span><span>$${invoice.deliveryFee.toLocaleString()}</span></div>
                                            <div class="total-row"><span>Empaque:</span><span>$${invoice.empaqueTotal.toLocaleString()}</span></div>
                                            <div class="total-row grand"><span>TOTAL:</span><span>$${invoice.total.toLocaleString()}</span></div>
                                          </div>
                                          ${invoice.notes ? `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 0 8px 8px 0;"><strong>📝 Notas:</strong> ${invoice.notes}</div>` : ''}
                                          <div class="footer">
                                            <p>¡Gracias por su preferencia!</p>
                                            <p>Generado por MINIMENU - ${new Date().toLocaleString('es-CO')}</p>
                                          </div>
                                        </div>
                                      </body>
                                      </html>
                                    `;
                                        // Crear blob y descargar como archivo
                                        const blob = new Blob([pdfContent], { type: 'text/html;charset=utf-8' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `Factura_${invoice.invoiceNumber}.html`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                        setToastMessage({ type: 'success', message: `✅ PDF descargado: Factura_${invoice.invoiceNumber}.html` });
                                        setTimeout(() => setToastMessage(null), 3000);
                                      }}
                                    >
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                    {/* Eliminar */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                      title="Eliminar factura"
                                      onClick={() => {
                                        if (confirm(`¿Está seguro de eliminar la factura ${invoice.invoiceNumber}?\n\nEsta acción no se puede deshacer.`)) {
                                          const savedInvoices = localStorage.getItem('deliveryInvoices');
                                          let existingInvoices: DeliveryInvoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
                                          existingInvoices = existingInvoices.filter(inv => inv.id !== invoice.id);
                                          localStorage.setItem('deliveryInvoices', JSON.stringify(existingInvoices));
                                          setDeliveryInvoices(existingInvoices);
                                          setToastMessage({ type: 'success', message: `✅ Factura ${invoice.invoiceNumber} eliminada correctamente` });
                                          setTimeout(() => setToastMessage(null), 3000);
                                        }
                                      }}
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
                    )}
                    {getFilteredDeliveryInvoicesByDate().length === 0 && deliveryInvoices.length > 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No se encontraron domicilios con los filtros aplicados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Modal Ver Detalles Factura Domicilio */}
        {showDeliveryInvoiceDetail && selectedDeliveryInvoice && (
          <Dialog open={showDeliveryInvoiceDetail} onOpenChange={setShowDeliveryInvoiceDetail}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Detalle de Factura {selectedDeliveryInvoice.invoiceNumber}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Información del Cliente */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-lg">👤</span> Información del Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{selectedDeliveryInvoice.customerName}</span></div>
                    <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{selectedDeliveryInvoice.customerPhone}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Dirección:</span> <span className="font-medium">{selectedDeliveryInvoice.customerAddress}</span></div>
                    <div><span className="text-gray-500">Barrio:</span> <span className="font-medium">{selectedDeliveryInvoice.customerNeighborhood || '-'}</span></div>
                  </div>
                </div>
                {/* Items del Pedido */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-lg">📦</span> Productos
                  </h4>
                  <div className="space-y-2">
                    {selectedDeliveryInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div>
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-medium">${(item.unitPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Totales */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-lg">💰</span> Resumen de Pago
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>${selectedDeliveryInvoice.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Domicilio:</span><span>${selectedDeliveryInvoice.deliveryFee.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Empaque:</span><span>${selectedDeliveryInvoice.empaqueTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-purple-200">
                      <span>TOTAL:</span>
                      <span className="text-purple-600">${selectedDeliveryInvoice.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {/* Estado y Pago */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">Estado del Pedido</h4>
                    <Badge className={getDeliveryInvoiceStatusColor(selectedDeliveryInvoice.status)}>
                      {getDeliveryInvoiceStatusText(selectedDeliveryInvoice.status)}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">Estado del Pago</h4>
                    <Badge className={getDeliveryInvoicePaymentStatusColor(selectedDeliveryInvoice.paymentStatus)}>
                      {selectedDeliveryInvoice.paymentStatus === 'pending' ? 'Pendiente' : 'Pagado'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {getDeliveryInvoicePaymentMethodText(selectedDeliveryInvoice.paymentMethod)}
                    </p>
                  </div>
                </div>
                {/* Notas */}
                {selectedDeliveryInvoice.notes && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-yellow-700 mb-1 text-sm">📝 Notas</h4>
                    <p className="text-sm text-yellow-800">{selectedDeliveryInvoice.notes}</p>
                  </div>
                )}
                {/* Fechas */}
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Creado: {new Date(selectedDeliveryInvoice.createdAt).toLocaleString('es-CO')}</span>
                  <span>Entrega Est.: {selectedDeliveryInvoice.estimatedDelivery}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeliveryInvoiceDetail(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal Editar Factura Domicilio */}
        {showDeliveryInvoiceEdit && editingDeliveryInvoice && (
          <Dialog open={showDeliveryInvoiceEdit} onOpenChange={setShowDeliveryInvoiceEdit}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-green-600" />
                  Editar Factura {editingDeliveryInvoice.invoiceNumber}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Datos del Cliente */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Datos del Cliente</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Nombre</Label>
                      <Input
                        value={editingDeliveryInvoice.customerName}
                        onChange={(e) => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, customerName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Teléfono</Label>
                      <Input
                        value={editingDeliveryInvoice.customerPhone}
                        onChange={(e) => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, customerPhone: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Dirección</Label>
                      <Input
                        value={editingDeliveryInvoice.customerAddress}
                        onChange={(e) => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, customerAddress: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Barrio</Label>
                      <Input
                        value={editingDeliveryInvoice.customerNeighborhood}
                        onChange={(e) => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, customerNeighborhood: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {/* Estado del Pedido */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Estado del Pedido</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
                      { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
                      { value: 'preparing', label: 'Preparando', color: 'bg-orange-100 text-orange-800' },
                      { value: 'on_the_way', label: 'En Camino', color: 'bg-purple-100 text-purple-800' },
                      { value: 'delivered', label: 'Entregado', color: 'bg-green-100 text-green-800' }
                    ].map(status => (
                      <Button
                        key={status.value}
                        size="sm"
                        variant={editingDeliveryInvoice.status === status.value ? 'default' : 'outline'}
                        onClick={() => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, status: status.value as DeliveryInvoice['status'] })}
                        className={editingDeliveryInvoice.status === status.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Estado del Pago */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Estado del Pago</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={editingDeliveryInvoice.paymentStatus === 'pending' ? 'default' : 'outline'}
                      onClick={() => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, paymentStatus: 'pending' })}
                      className={editingDeliveryInvoice.paymentStatus === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                      Pendiente
                    </Button>
                    <Button
                      size="sm"
                      variant={editingDeliveryInvoice.paymentStatus === 'paid' ? 'default' : 'outline'}
                      onClick={() => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, paymentStatus: 'paid' })}
                      className={editingDeliveryInvoice.paymentStatus === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      Pagado
                    </Button>
                  </div>
                </div>
                {/* Método de Pago */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Método de Pago</h4>
                  <div className="flex gap-2">
                    {[
                      { value: 'cash', label: '💵 Efectivo' },
                      { value: 'card', label: '💳 Tarjeta' },
                      { value: 'transfer', label: '🏦 Transferencia' }
                    ].map(method => (
                      <Button
                        key={method.value}
                        size="sm"
                        variant={editingDeliveryInvoice.paymentMethod === method.value ? 'default' : 'outline'}
                        onClick={() => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, paymentMethod: method.value as DeliveryInvoice['paymentMethod'] })}
                        className={editingDeliveryInvoice.paymentMethod === method.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        {method.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Notas */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">Notas Adicionales</h4>
                  <textarea
                    className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-md resize-none"
                    value={editingDeliveryInvoice.notes}
                    onChange={(e) => setEditingDeliveryInvoice({ ...editingDeliveryInvoice, notes: e.target.value })}
                    placeholder="Notas del pedido..."
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDeliveryInvoiceEdit(false)}>Cancelar</Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSavingDeliveryInvoice}
                  onClick={() => {
                    setIsSavingDeliveryInvoice(true);
                    // Guardar cambios en localStorage
                    const savedInvoices = localStorage.getItem('deliveryInvoices');
                    let existingInvoices: DeliveryInvoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
                    existingInvoices = existingInvoices.map(inv =>
                      inv.id === editingDeliveryInvoice.id ? editingDeliveryInvoice : inv
                    );
                    localStorage.setItem('deliveryInvoices', JSON.stringify(existingInvoices));
                    setDeliveryInvoices(existingInvoices);
                    setIsSavingDeliveryInvoice(false);
                    setShowDeliveryInvoiceEdit(false);
                    setToastMessage({ type: 'success', message: `✅ Factura ${editingDeliveryInvoice.invoiceNumber} actualizada correctamente` });
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                >
                  {isSavingDeliveryInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Configuracion Domicilio Tab */}
        {activeTab === 'configuracion-domicilio' && (
          <iframe
            src="/dashboard/configuracion-domicilio"
            className="w-full h-[calc(100vh-200px)] border-0"
            title="Configuración de Domicilio"
          />
        )}

        {/* Configuracion Factura Tab */}
        {activeTab === 'configuracion-factura' && (
          <iframe
            src="/dashboard/configuracion/factura"
            className="w-full h-[calc(100vh-200px)] border-0"
            title="Editor de Factura"
          />
        )}

        {/* Impresoras Tab */}
        {activeTab === 'impresoras' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Impresoras</h2>
                <p className="text-gray-600 mt-1">Configura las impresoras para tu negocio</p>
              </div>
              <Button
                onClick={openAddPrinterModal}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Impresora
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">Total Impresoras</p>
                      <p className="text-2xl font-bold text-purple-700">{printers.length}</p>
                    </div>
                    <PrinterIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Activas</p>
                      <p className="text-2xl font-bold text-green-700">
                        {printers.filter(p => p.isActive).length}
                      </p>
                    </div>
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600">Inactivas</p>
                      <p className="text-2xl font-bold text-red-700">
                        {printers.filter(p => !p.isActive).length}
                      </p>
                    </div>
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Predeterminadas</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {printers.filter(p => p.isDefault).length}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Printers Grid */}
            {printers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {printers.map(printer => (
                  <Card key={printer.id} className={`hover:shadow-lg transition-shadow ${!printer.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${printer.isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            <PrinterIcon className={`w-5 h-5 ${printer.isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{printer.name}</h4>
                            {printer.isDefault && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                ⭐ Predeterminada
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={printer.isActive}
                          onCheckedChange={() => togglePrinterActive(printer.id)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getPrinterTypeBadge(printer.type)}>
                            {printer.type}
                          </Badge>
                          <Badge className={getPrinterAreaBadge(printer.area)}>
                            {printer.area}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          📍 {printer.ip}:{printer.port}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openEditPrinterModal(printer)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setPrinterToDelete(printer);
                            setShowPrinterDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <PrinterIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay impresoras configuradas</h3>
                  <p className="text-gray-500 mb-4">
                    Agrega tu primera impresora para comenzar a imprimir comandas y tickets.
                  </p>
                  <Button
                    onClick={openAddPrinterModal}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Impresora
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empaque Tab */}
        {activeTab === 'empaque' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Empaque</CardTitle>
                <CardDescription>
                  Configura el valor unitario del empaque para pedidos a domicilio.
                  Este valor se multiplicará por la cantidad de productos que requieran empaque.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">¿Cómo funciona?</h4>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• El costo de empaque solo aplica a pedidos <strong>tipo Domicilio</strong></li>
                        <li>• Se calcula: <code className="bg-blue-100 px-1 rounded">valor unitario × cantidad de productos aplicables</code></li>
                        <li>• Cada producto puede configurarse para requerir o no empaque</li>
                        <li>• Si el valor es 0, no se aplicará cargo de empaque</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="valorEmpaque">Valor Unitario de Empaque ($)</Label>
                    <Input
                      id="valorEmpaque"
                      type="number"
                      min="0"
                      value={valorEmpaqueUnitario}
                      onChange={(e) => setValorUnitarioEmpaque(Number(e.target.value) || 0)}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Este valor se multiplicará por cada producto que requiera empaque.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Vista Previa del Cálculo</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor unitario:</span>
                        <span className="font-medium">{formatPrice(valorEmpaqueUnitario)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ejemplo (3 productos):</span>
                        <span className="font-medium">{formatPrice(valorEmpaqueUnitario * 3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ejemplo (5 productos):</span>
                        <span className="font-medium">{formatPrice(valorEmpaqueUnitario * 5)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    onClick={handleSaveEmpaque}
                    disabled={isSavingEmpaque}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSavingEmpaque ? (
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
              </CardContent>
            </Card>

            {/* Productos con Empaque */}
            <Card>
              <CardHeader>
                <CardTitle>Productos con Empaque</CardTitle>
                <CardDescription>
                  Lista de productos y su configuración de empaque.
                  Edita cada producto para cambiar si requiere empaque.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Producto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Categoría</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">¿Requiere Empaque?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{product.category}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const updatedProducts = products.map(p =>
                                  p.id === product.id ? { ...p, requiereEmpaque: !p.requiereEmpaque } : p
                                );
                                setProducts(updatedProducts);
                                // Save to API
                                fetch('/api/products', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: product.id,
                                    requiereEmpaque: !product.requiereEmpaque
                                  })
                                });
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                                product.requiereEmpaque
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              )}
                            >
                              {product.requiereEmpaque ? '✓ Sí' : '✕ No'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay productos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compartir Menú Tab */}
        {activeTab === 'compartir' && (
          <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
              <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2`}>
                {toastMessage.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <span>{toastMessage.message}</span>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Compartir Menú</h2>
                <p className="text-gray-600 mt-1">Personaliza y comparte el enlace de tu menú digital</p>
              </div>
              <Button
                onClick={handleSaveShareSettings}
                disabled={isSavingShare || isCheckingSlug}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSavingShare ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>

            {/* URL Personalizada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  URL Personalizada
                </CardTitle>
                <CardDescription>
                  Crea un enlace corto y memorable para tu menú
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {menuSlugActive ? 'Alias activo' : 'Usar alias personalizado'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {menuSlugActive
                        ? 'Tu menú tendrá una URL personalizada'
                        : 'Activa para crear una URL corta para tu menú'}
                    </p>
                  </div>
                  <Switch
                    checked={menuSlugActive}
                    onCheckedChange={setMenuSlugActive}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>

                {menuSlugActive && (
                  <div className="space-y-3">
                    <div>
                      <Label>Alias del menú</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 text-sm whitespace-nowrap">
                          {typeof window !== 'undefined' ? window.location.origin : ''}/menu/
                        </span>
                        <div className="relative flex-1">
                          <Input
                            value={menuSlug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="mi-restaurante"
                            className={`${slugError ? 'border-red-500' : ''}`}
                          />
                          {isCheckingSlug && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </div>
                      {slugError && (
                        <p className="text-red-500 text-sm mt-1">{slugError}</p>
                      )}
                      {menuSlug && !slugError && (
                        <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          URL disponible
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800 mb-2">Vista previa del enlace:</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-1 rounded text-sm flex-1 truncate border">
                          {getMenuUrl()}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(getMenuUrl())}
                        >
                          {copiedToClipboard ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vista Previa Social */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Vista Previa Social
                </CardTitle>
                <CardDescription>
                  Personaliza cómo se ve tu menú al compartirlo en redes sociales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Imagen de vista previa (1200x630 recomendado)</Label>
                  <div className="mt-2">
                    {customShareImage ? (
                      <div className="relative inline-block">
                        <img
                          src={customShareImage}
                          alt="Preview"
                          className="w-full max-w-md h-40 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={removeShareImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        {isUploadingShareImage ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                            <p className="text-sm text-gray-500">Subiendo imagen...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Click para subir imagen</span>
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG (máx. 5MB)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleShareImageUpload}
                          disabled={isUploadingShareImage}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Mensaje personalizado</Label>
                  <textarea
                    className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mt-1"
                    placeholder="¡Hola! Te invito a ver nuestro menú digital 🍽️"
                    value={customShareMessage}
                    onChange={(e) => setCustomShareMessage(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este mensaje se incluirá al compartir por WhatsApp
                  </p>
                </div>

                <Button
                  asChild
                  className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                >
                  <a
                    href={getWhatsAppShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Compartir en WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Código QR */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Código QR
                </CardTitle>
                <CardDescription>
                  Descarga tu código QR para imprimirlo en tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-gray-200 p-2">
                    <img
                      src={getQRCodeUrl()}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <p className="text-sm text-gray-600">
                      Escanea este código para acceder directamente a tu menú digital.
                      El código se actualiza automáticamente si cambias la URL.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={downloadQR}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar PNG
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(getMenuUrl())}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Enlace
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Perfil Tab */}
        {activeTab === 'perfil' && (
          <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
              <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2`}>
                {toastMessage.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <span>{toastMessage.message}</span>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Información del Negocio</CardTitle>
                <CardDescription>Actualiza la información de tu restaurante</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                    <span className="text-gray-600">Cargando perfil...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre del Negocio</Label>
                        <Input
                          placeholder="Nombre del negocio"
                          value={profileForm.businessName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Slug (URL pública)</Label>
                        <Input
                          placeholder="minimenuia"
                          value={profileForm.slug || ''}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          URL de tu menú público: /menu/{profileForm.slug || 'tu-slug'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Teléfono</Label>
                        <Input
                          placeholder="+57 300 000 0000"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Dirección</Label>
                        <Input
                          placeholder="Dirección"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Impoconsumo (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="8"
                          value={profileForm.impoconsumo}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, impoconsumo: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Color Primario</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={profileForm.primaryColor}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Input
                            value={profileForm.primaryColor}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Color Secundario</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={profileForm.secondaryColor}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Input
                            value={profileForm.secondaryColor}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Imágenes del Negocio */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900">Imágenes del Negocio</h3>

                      {/* Franja Hero Sutil */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Franja Hero Sutil</Label>
                            <p className="text-xs text-gray-500">Banner promocional destacado en el menú público</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={profileForm.showHeroBanner}
                              disabled={!profileForm.heroImageUrl}
                              onCheckedChange={async (checked) => {
                                setProfileForm(prev => ({ ...prev, showHeroBanner: checked }));
                                // Auto-save the switch state
                                try {
                                  const response = await fetch('/api/settings/profile', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ showHeroBanner: checked })
                                  });
                                  if (response.ok) {
                                    console.log('[Hero Banner] Switch auto-saved:', checked);
                                    setToastMessage({ type: 'success', message: checked ? 'Franja hero activada' : 'Franja hero desactivada' });
                                    setTimeout(() => setToastMessage(null), 3000);
                                  }
                                } catch (error) {
                                  console.error('[Hero Banner] Switch auto-save error:', error);
                                }
                              }}
                            />
                            <span className={`text-xs font-medium ${profileForm.showHeroBanner ? 'text-green-600' : 'text-gray-400'}`}>
                              {profileForm.showHeroBanner ? 'Visible en menú' : 'Oculta'}
                            </span>
                          </div>
                        </div>

                        {/* Preview de la Franja Hero */}
                        <div
                          className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 group"
                          style={{ backgroundColor: profileForm.heroImageUrl ? 'transparent' : '#1a1a1a' }}
                        >
                          {profileForm.heroImageUrl ? (
                            <>
                              {/* Imagen de fondo */}
                              <img
                                src={profileForm.heroImageUrl}
                                alt="Hero Banner"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              {/* Overlay negro al 45% */}
                              <div className="absolute inset-0 bg-black/45" />
                              {/* Degradado lateral */}
                              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                              {/* Contenido sobre la imagen */}
                              <div className="relative h-full flex flex-col justify-center p-6">
                                <h4 className="text-2xl font-bold text-white mb-1">{profileForm.businessName || 'Mi Negocio'}</h4>
                                <p className="text-white/75 text-sm">Tu descripción o slogan aquí</p>
                                {/* Badge condicional de oferta */}
                                <div className="mt-3 inline-flex">
                                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                                    🔥 Oferta del día
                                  </span>
                                </div>
                              </div>

                              {/* Botón de edición */}
                              <button
                                type="button"
                                onClick={() => setProfileForm(prev => ({ ...prev, heroImageUrl: null, showHeroBanner: false }))}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>
                            </>
                          ) : (
                            /* Placeholder sin imagen */
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-[#252525] transition-colors">
                              <ImageIcon className="w-10 h-10 text-gray-500 mb-2" />
                              <span className="text-gray-400 text-sm font-medium">Click para subir imagen hero</span>
                              <span className="text-gray-500 text-xs mt-1">Recomendado: 1200x300px</span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const heroImageUrl = event.target?.result as string;
                                      // Update state
                                      setProfileForm(prev => ({
                                        ...prev,
                                        heroImageUrl,
                                        showHeroBanner: true
                                      }));
                                      // Auto-save to ensure the hero banner shows in public menu
                                      try {
                                        const response = await fetch('/api/settings/profile', {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            businessId: user.businessId,
                                            heroImageUrl,
                                            showHeroBanner: true
                                          })
                                        });
                                        if (response.ok) {
                                          console.log('[Hero Banner] Auto-saved successfully');
                                          setToastMessage({ type: 'success', message: 'Imagen hero guardada y activada' });
                                          setTimeout(() => setToastMessage(null), 3000);
                                        }
                                      } catch (error) {
                                        console.error('[Hero Banner] Auto-save error:', error);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div>
                        <Label className="text-sm font-medium">Avatar</Label>
                        <p className="text-xs text-gray-500 mb-2">Imagen circular para perfil (recomendado: 200x200px)</p>
                        <div className="flex items-center gap-4">
                          {profileForm.avatar ? (
                            <div className="relative">
                              <img
                                src={profileForm.avatar}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => setProfileForm(prev => ({ ...prev, avatar: null }))}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setProfileForm(prev => ({ ...prev, avatar: event.target?.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <span className="text-xs text-gray-500">PNG, JPG (máx. 2MB)</span>
                        </div>
                      </div>

                      {/* Logo */}
                      <div>
                        <Label className="text-sm font-medium">Logo</Label>
                        <p className="text-xs text-gray-500 mb-2">Logo del negocio (recomendado: 300x100px)</p>
                        <div className="flex items-center gap-4">
                          {profileForm.logo ? (
                            <div className="relative">
                              <img
                                src={profileForm.logo}
                                alt="Logo"
                                className="w-32 h-16 object-contain border border-gray-200 rounded-lg bg-white p-1"
                              />
                              <button
                                type="button"
                                onClick={() => setProfileForm(prev => ({ ...prev, logo: null }))}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-32 h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setProfileForm(prev => ({ ...prev, logo: event.target?.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <span className="text-xs text-gray-500">PNG, JPG (máx. 2MB)</span>
                        </div>
                      </div>

                      {/* Favicon */}
                      <div>
                        <Label className="text-sm font-medium">Favicon (Icono de Favoritos)</Label>
                        <p className="text-xs text-gray-500 mb-2">Icono pequeño para la pestaña del navegador (16x16 o 32x32px)</p>
                        <div className="flex items-center gap-4">
                          {profileForm.favicon ? (
                            <div className="relative">
                              <img
                                src={profileForm.favicon}
                                alt="Favicon"
                                className="w-10 h-10 object-contain border border-gray-200 rounded-lg bg-white p-1"
                              />
                              <button
                                type="button"
                                onClick={() => setProfileForm(prev => ({ ...prev, favicon: null }))}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setProfileForm(prev => ({ ...prev, favicon: event.target?.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <span className="text-xs text-gray-500">PNG, ICO (16x16 o 32x32px)</span>
                        </div>
                      </div>

                      {/* Banner */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <Label className="text-sm font-medium">Banner de Cabecera</Label>
                            <p className="text-xs text-gray-500">Imagen para la cabecera del menú (recomendado: 1200x400px)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={profileForm.bannerEnabled}
                              onCheckedChange={(checked) => setProfileForm(prev => ({ ...prev, bannerEnabled: checked }))}
                            />
                            <span className="text-xs text-gray-500">{profileForm.bannerEnabled ? 'Activo' : 'Inactivo'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {profileForm.banner ? (
                            <div className="relative inline-block">
                              <img
                                src={profileForm.banner}
                                alt="Banner"
                                className="w-full max-w-md h-24 object-cover border border-gray-200 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setProfileForm(prev => ({ ...prev, banner: null }))}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full max-w-md h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                              <span className="text-sm text-gray-500">Click para subir banner</span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setProfileForm(prev => ({ ...prev, banner: event.target?.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <span className="text-xs text-gray-500">PNG, JPG (máx. 5MB)</span>
                        </div>
                      </div>
                    </div>

                    {/* Favicon (Icono de Favoritos) */}
                    <div>
                      <Label className="text-sm font-medium">Favicon (Icono de Favoritos)</Label>
                      <p className="text-xs text-gray-500 mb-2">Imagen cuadrada pequeña para la pestaña del navegador (32x32px recomendado)</p>
                      <div className="flex items-center gap-4">
                        {profileForm.favicon ? (
                          <div className="relative">
                            <img
                              src={profileForm.favicon}
                              alt="Favicon"
                              className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => setProfileForm(prev => ({ ...prev, favicon: null }))}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setProfileForm(prev => ({ ...prev, favicon: event.target?.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                        <span className="text-xs text-gray-500">PNG, ICO (máx. 500KB)</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile || isLoadingProfile}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Cambios'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Propina Voluntaria Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Propina Voluntaria
                </CardTitle>
                <CardDescription>
                  Configura la propina voluntaria para tus clientes (Cumplimiento Colombia)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                    <span className="text-gray-600">Cargando configuración...</span>
                  </div>
                ) : (
                  <>
                    {/* Activar Propina */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profileForm.tipEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <DollarSign className={`w-5 h-5 ${profileForm.tipEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {profileForm.tipEnabled ? 'Propina Activada' : 'Propina Desactivada'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {profileForm.tipEnabled
                              ? 'Los clientes podrán agregar propina voluntaria'
                              : 'No se mostrará opción de propina'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={profileForm.tipEnabled}
                        onCheckedChange={(checked) => setProfileForm(prev => ({ ...prev, tipEnabled: checked }))}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                      />
                    </div>

                    {profileForm.tipEnabled && (
                      <>
                        {/* Porcentaje por defecto */}
                        <div>
                          <Label className="text-sm font-medium">Porcentaje Sugerido (%)</Label>
                          <p className="text-xs text-gray-500 mb-2">
                            Porcentaje que se sugerirá automáticamente sobre el subtotal
                          </p>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={profileForm.tipPercentageDefault}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                tipPercentageDefault: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                              }))}
                              className="w-24"
                            />
                            <span className="text-gray-600 font-medium">%</span>
                            <div className="flex gap-2 ml-2">
                              {[5, 10, 15, 20].map(pct => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setProfileForm(prev => ({ ...prev, tipPercentageDefault: pct }))}
                                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${profileForm.tipPercentageDefault === pct
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Solo en establecimiento */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profileForm.tipOnlyOnPremise ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <Utensils className={`w-5 h-5 ${profileForm.tipOnlyOnPremise ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Solo en Establecimiento
                              </p>
                              <p className="text-sm text-gray-500">
                                {profileForm.tipOnlyOnPremise
                                  ? 'Propina solo para pedidos en el local (no domicilio ni para llevar)'
                                  : 'Propina disponible para todos los tipos de pedido'}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={profileForm.tipOnlyOnPremise}
                            onCheckedChange={(checked) => setProfileForm(prev => ({ ...prev, tipOnlyOnPremise: checked }))}
                            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                          />
                        </div>

                        {/* Info legal */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            <strong>📋 Normativa Colombia:</strong> La propina es voluntaria, no genera IVA,
                            y no se considera ingreso gravado del restaurante. Debe registrarse separadamente en contabilidad.
                          </p>
                        </div>
                      </>
                    )}

                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile || isLoadingProfile}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Configuración'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Métodos de Pago Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Configura tus métodos de pago con número, titular y código QR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                    <span className="text-gray-600">Cargando configuración...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Configura cada método de pago con su información. Solo los métodos activados serán visibles en el menú.
                    </p>

                    <div className="space-y-4">
                      {profileForm.paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`border rounded-lg overflow-hidden ${method.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50'}`}
                        >
                          {/* Header con nombre y switch */}
                          <div className="flex items-center justify-between p-4 bg-white border-b">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <span className="text-lg">{method.icon}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{method.name}</p>
                                <p className={`text-xs ${method.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                  {method.enabled ? '✓ Activo' : '✗ Inactivo'}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={method.enabled}
                              onCheckedChange={(checked) => {
                                setProfileForm(prev => ({
                                  ...prev,
                                  paymentMethods: prev.paymentMethods.map(m =>
                                    m.id === method.id ? { ...m, enabled: checked } : m
                                  )
                                }));
                              }}
                              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                            />
                          </div>

                          {/* Campos editables */}
                          <div className="p-4 space-y-3 bg-white">
                            {/* Número de Celular */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">Número de Celular</Label>
                              <Input
                                placeholder="300 123 4567"
                                value={method.phone}
                                onChange={(e) => {
                                  setProfileForm(prev => ({
                                    ...prev,
                                    paymentMethods: prev.paymentMethods.map(m =>
                                      m.id === method.id ? { ...m, phone: e.target.value } : m
                                    )
                                  }));
                                }}
                                className="text-sm"
                              />
                            </div>

                            {/* Nombre del Titular */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">Nombre del Titular</Label>
                              <Input
                                placeholder="Juan Pérez"
                                value={method.accountHolder}
                                onChange={(e) => {
                                  setProfileForm(prev => ({
                                    ...prev,
                                    paymentMethods: prev.paymentMethods.map(m =>
                                      m.id === method.id ? { ...m, accountHolder: e.target.value } : m
                                    )
                                  }));
                                }}
                                className="text-sm"
                              />
                            </div>

                            {/* Código QR */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">Código QR (Opcional)</Label>
                              <div className="flex items-center gap-3">
                                {method.qrImage ? (
                                  <div className="relative">
                                    <img
                                      src={method.qrImage}
                                      alt={`QR ${method.name}`}
                                      className="w-20 h-20 rounded-lg border object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProfileForm(prev => ({
                                          ...prev,
                                          paymentMethods: prev.paymentMethods.map(m =>
                                            m.id === method.id ? { ...m, qrImage: null } : m
                                          )
                                        }));
                                      }}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-400 mt-1">Subir QR</span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            setProfileForm(prev => ({
                                              ...prev,
                                              paymentMethods: prev.paymentMethods.map(m =>
                                                m.id === method.id ? { ...m, qrImage: event.target?.result as string } : m
                                              )
                                            }));
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                                <p className="text-xs text-gray-400 flex-1">
                                  Sube el código QR de tu cuenta {method.name} para que los clientes puedan escanearlo fácilmente.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>💡 Importante:</strong> Solo los métodos de pago activados serán mostrados a los clientes
                        en el carrito de compras del menú digital. Asegúrate de ingresar la información correcta.
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile || isLoadingProfile}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Configuración'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tu Código QR</CardTitle>
                <CardDescription>Comparte este código para que tus clientes accedan al menú</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center border-2 border-gray-200 p-2">
                  <img
                    src={getQRCodeUrl()}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadQR}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(getMenuUrl())}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Enlace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <BackupSection
            businessName={profileForm.businessName}
            onToast={(message) => setToastMessage(message)}
          />
        )}

        {/* Reseñas Tab */}
        {activeTab === 'resenas' && user?.businessId && (
          <div className="space-y-6">
            <iframe
              src={`/dashboard/reviews?businessId=${user.businessId}`}
              className="w-full h-[calc(100vh-200px)] border-0 rounded-lg shadow-md"
              title="Reseñas y Fidelización"
            />
          </div>
        )}

        {/* Suscripción Tab */}
        {activeTab === 'suscripcion' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Suscripción</h2>
                <p className="text-gray-600 mt-1">Gestiona tu plan y facturación</p>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingPlans ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">Cargando información de suscripción...</p>
                </CardContent>
              </Card>
            ) : currentPlan ? (
              <>
                {/* Banner de Plan Actual */}
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Plan {currentPlan.name}</h3>
                          <p className="text-purple-100">
                            <strong>${currentPlan.price.toLocaleString('es-CO')}</strong> COP/mes
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        <Check className="w-4 h-4 mr-1" />
                        Activo
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Plan Actual - Detalles */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        Detalles del Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-purple-800 text-lg">
                            {currentPlan.name}
                          </h4>
                          <Badge className="bg-green-100 text-green-700">
                            <Check className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Fecha Inicio:</span>
                            <p className="font-medium">
                              {new Date(currentPlan.startDate).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Próximo Pago:</span>
                            <p className="font-medium">
                              {new Date(currentPlan.endDate).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Precio:</span>
                            <p className="font-medium text-purple-600">
                              ${currentPlan.price.toLocaleString('es-CO')} COP/mes
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Estado:</span>
                            <p className="font-medium text-green-600 capitalize">{currentPlan.status}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/#pricing-section'}>
                          Cambiar Plan
                        </Button>
                        <Button variant="outline" className="text-purple-600 hover:bg-purple-50 border-purple-200">
                          <FileText className="w-4 h-4 mr-2" />
                          Facturas
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Uso Actual */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Uso Actual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pedidos */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Pedidos este mes</span>
                          <span className="font-medium">127 / 500</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>

                      {/* Productos */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Productos en catálogo</span>
                          <span className="font-medium">24 / 200</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                        </div>
                      </div>

                      {/* Empleados */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Empleados registrados</span>
                          <span className="font-medium">2 / 3</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          ✅ Verde: &lt;70% | 🟡 Amarillo: 70-90% | 🔴 Rojo: &gt;90%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Planes Disponibles */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Planes Disponibles
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {availablePlans.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {availablePlans.map((plan) => {
                          const isCurrentPlan = currentPlan.id === plan.id;
                          return (
                            <div
                              key={plan.id}
                              className={`border rounded-xl p-5 transition-colors ${
                                isCurrentPlan
                                  ? 'border-2 border-purple-500 bg-purple-50 relative'
                                  : 'hover:border-purple-300'
                              }`}
                            >
                              {plan.isPopular && (
                                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600">
                                  <Star className="w-3 h-3 mr-1" />
                                  Más Popular
                                </Badge>
                              )}
                              {isCurrentPlan && (
                                <Badge className="absolute -top-2 right-2 bg-green-500">
                                  Tu plan
                                </Badge>
                              )}
                              <div className="text-center mb-4">
                                <div
                                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                                  style={{
                                    backgroundColor: `${plan.color}20`,
                                    color: plan.color
                                  }}
                                >
                                  <Star className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-lg">{plan.name}</h4>
                                <p className="text-gray-500 text-sm">{plan.description}</p>
                              </div>
                              <div className="text-center mb-4">
                                <span className="text-3xl font-bold" style={{ color: plan.color }}>
                                  ${plan.price.toLocaleString('es-CO')}
                                </span>
                                <span className="text-gray-500">/{plan.period === 'monthly' ? 'mes' : plan.period}</span>
                              </div>
                              <ul className="space-y-2 text-sm mb-4">
                                {parseFeatures(plan.features).slice(0, 4).map((feature, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-700">{feature.trim()}</span>
                                  </li>
                                ))}
                              </ul>

                              {isCurrentPlan ? (
                                <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                                  Plan Actual
                                </Button>
                              ) : (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                      Seleccionar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Seleccionar Plan {plan.name}</DialogTitle>
                                      <DialogDescription>
                                        Elige tu método de pago para activar el plan
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-3 mt-4">
                                      {/* Título de métodos de pago */}
                                      <div className="border-b pb-2 mb-3">
                                        <h4 className="font-semibold text-sm text-gray-700">Métodos de Pago Disponibles</h4>
                                      </div>

                                      {/* Hotmart */}
                                      {paymentMethods?.hotmartEnabled ? (
                                        <Button
                                          className="w-full justify-start"
                                          onClick={() => {
                                            if (plan.hotmartUrl) {
                                              window.open(plan.hotmartUrl, '_blank');
                                            } else {
                                              setHotmartModalMessage({
                                                title: 'Enlace no configurado',
                                                message: 'El plan no tiene enlace de Hotmart configurado. Contacta al administrador.'
                                              });
                                              setShowHotmartModal(true);
                                            }
                                          }}
                                        >
                                          <CreditCard className="w-5 h-5 mr-3" />
                                          <div className="text-left">
                                            <p className="font-medium">Tarjeta de Crédito/Débito</p>
                                            <p className="text-xs text-gray-500">Procesado por Hotmart</p>
                                          </div>
                                        </Button>
                                      ) : null}

                                      {/* Nequi */}
                                      {paymentMethods?.nequiEnabled ? (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                          <Button
                                            variant="ghost"
                                            className="w-full justify-start p-4 hover:bg-gray-50"
                                            onClick={() => setExpandedPaymentMethod(expandedPaymentMethod === 'nequi' ? null : 'nequi')}
                                          >
                                            <Smartphone className="w-5 h-5 mr-3 text-purple-600" />
                                            <div className="text-left flex-1">
                                              <p className="font-medium text-gray-900">Nequi</p>
                                              <p className="text-xs text-gray-500">
                                                {paymentMethods.nequiPhone ? `${paymentMethods.nequiPhone} - ${paymentMethods.nequiHolder}` : 'Configuración pendiente'}
                                              </p>
                                            </div>
                                            <svg
                                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                                expandedPaymentMethod === 'nequi' ? 'rotate-180' : ''
                                              }`}
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </Button>
                                          
                                          {/* Accordion Content */}
                                          {expandedPaymentMethod === 'nequi' && paymentMethods.nequiPhone && (
                                            <div className="px-4 pb-4 animate-slide-down">
                                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                                                <div>
                                                  <p className="text-xs font-medium text-purple-700 uppercase mb-1">Número de Nequi</p>
                                                  <div className="flex items-center gap-2">
                                                    <p className="text-lg font-bold text-purple-900">{paymentMethods.nequiPhone}</p>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-8 px-2"
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(paymentMethods.nequiPhone);
                                                        toast.showSuccess('¡Copiado!', 'El número de Nequi se copió al portapapeles');
                                                      }}
                                                    >
                                                      <Copy className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                
                                                <div>
                                                  <p className="text-xs font-medium text-purple-700 uppercase mb-1">Titular</p>
                                                  <p className="text-sm text-purple-900">{paymentMethods.nequiHolder}</p>
                                                </div>
                                                
                                                <div>
                                                  <p className="text-xs font-medium text-purple-700 uppercase mb-1">Monto a Pagar</p>
                                                  <p className="text-2xl font-bold text-purple-900">${plan.price.toLocaleString('es-CO')} COP</p>
                                                </div>
                                                
                                                <div className="pt-2 border-t border-purple-200">
                                                  <p className="text-xs text-purple-700">
                                                    <strong>Instrucciones:</strong> Realiza el pago al número mostrado y envía el comprobante al administrador para activar tu plan.
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : null}

                                      {/* Bancolombia */}
                                      {paymentMethods?.bancolombiaEnabled ? (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden mt-3">
                                          <Button
                                            variant="ghost"
                                            className="w-full justify-start p-4 hover:bg-gray-50"
                                            onClick={() => setExpandedPaymentMethod(expandedPaymentMethod === 'bancolombia' ? null : 'bancolombia')}
                                          >
                                            <Landmark className="w-5 h-5 mr-3 text-purple-600" />
                                            <div className="text-left flex-1">
                                              <p className="font-medium text-gray-900">Transferencia Bancolombia</p>
                                              <p className="text-xs text-gray-500">
                                                {paymentMethods.bancolombiaAccount ? 'Copia los datos para transferir' : 'Configuración pendiente'}
                                              </p>
                                            </div>
                                            <svg
                                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                                expandedPaymentMethod === 'bancolombia' ? 'rotate-180' : ''
                                              }`}
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </Button>
                                          
                                          {/* Accordion Content */}
                                          {expandedPaymentMethod === 'bancolombia' && paymentMethods.bancolombiaAccount && (
                                            <div className="px-4 pb-4 animate-slide-down">
                                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                                                <div>
                                                  <p className="text-xs font-medium text-purple-700 uppercase mb-1">Banco</p>
                                                  <p className="text-sm font-medium text-purple-900">Bancolombia</p>
                                                </div>
                                                
                                                <div>
                                                  <p className="text-xs font-medium text-purple-700 uppercase mb-1">Número de Cuenta</p>
                                                  <div className="flex items-center gap-2">
                                                    <p className="text-lg font-bold text-purple-900">{paymentMethods.bancolombiaAccount}</p>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-8 px-2"
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(paymentMethods.bancolombiaAccount);
                                                        toast.showSuccess('¡Copiado!', 'El número de cuenta se copió al portapapeles');
                                                      }}
                                                    >
                                                      <Copy className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                
                                                <div>
                                                  <p className="text-xs font-medium text-purple-700 uppercase mb-1">Titular</p>
                                                  <p className="text-sm text-purple-900">{paymentMethods.nequiHolder || 'No especificado'}</p>
                                                </div>
                                                
                                                <div>
                                                  <p className="text-xs font-medium text-purple-700 uppercase mb-1">Monto a Pagar</p>
                                                  <p className="text-2xl font-bold text-purple-900">${plan.price.toLocaleString('es-CO')} COP</p>
                                                </div>
                                                
                                                <div className="pt-2 border-t border-purple-200">
                                                  <p className="text-xs text-purple-700">
                                                    <strong>Instrucciones:</strong> Realiza la transferencia a la cuenta mostrada y envía el comprobante al administrador para activar tu plan.
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : null}

                                      {/* Sin métodos configurados */}
                                      {!paymentMethods || (!paymentMethods.hotmartEnabled && !paymentMethods.nequiEnabled && !paymentMethods.bancolombiaEnabled) ? (
                                        <div className="text-center py-6">
                                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <CreditCard className="w-8 h-8 text-gray-400" />
                                          </div>
                                          <p className="text-sm text-gray-600 font-medium mb-2">No hay métodos de pago configurados</p>
                                          <p className="text-xs text-gray-500 mb-4">Contacta al administrador para activar tu plan</p>
                                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/support'}>
                                            Contactar Soporte
                                          </Button>
                                        </div>
                                      ) : null}

                                      {/* Instrucciones */}
                                      {(paymentMethods?.nequiEnabled || paymentMethods?.bancolombiaEnabled) && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                                          <p className="text-xs text-blue-800">
                                            <strong>💡 Instrucciones:</strong> Después de realizar el pago, envía el comprobante al administrador para activar tu plan.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No hay planes disponibles en este momento</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No se encontró información de suscripción</p>
                </CardContent>
              </Card>
            )}

            {/* Footer */}
            <div className="text-center py-6 text-sm text-gray-500">
              <p>¿Necesitas ayuda con tu suscripción? <a href="/support" className="text-purple-600 hover:underline">Contactar soporte</a></p>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={(open) => {
        setShowProductModal(open);
        if (!open) resetProductForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Estado del Plato - Switch Prominente */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${productForm.isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
                  {productForm.isAvailable ? (
                    <span className="text-green-600 text-lg">✓</span>
                  ) : (
                    <span className="text-red-600 text-lg">✕</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {productForm.isAvailable ? 'Plato Activo' : 'Plato Inactivo'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {productForm.isAvailable
                      ? 'Este plato será visible en el menú'
                      : 'Este plato no será visible en el menú'}
                  </p>
                </div>
              </div>
              <Switch
                checked={productForm.isAvailable}
                onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isAvailable: checked }))}
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
              />
            </div>

            {/* Imagen del Producto */}
            <div>
              <Label>Imagen del Producto</Label>
              <div className="mt-2">
                {imagePreview || productForm.image ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || productForm.image || ''}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Click para subir imagen</span>
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG (máx. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Nombre del Producto</Label>
              <Input
                placeholder="Nombre del producto"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                placeholder="Descripción corta"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={productForm.stock || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                className="w-full h-10 rounded-md border border-gray-300 px-3"
                value={showNewCategoryInput ? '__new__' : productForm.category}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowNewCategoryInput(true);
                  } else {
                    setShowNewCategoryInput(false);
                    setProductForm(prev => ({ ...prev, category: e.target.value }));
                  }
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
                <option value="__new__">➕ Nueva Categoría...</option>
              </select>

              {/* New Category Input */}
              {showNewCategoryInput && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Crear Nueva Categoría</p>
                  <div className="flex gap-2">
                    <select
                      className="w-16 h-10 rounded-md border border-gray-300 px-2 text-center text-lg"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                    >
                      <option value="📦">📦</option>
                      <option value="🍔">🍔</option>
                      <option value="🍕">🍕</option>
                      <option value="🌮">🌮</option>
                      <option value="🍜">🍜</option>
                      <option value="🍣">🍣</option>
                      <option value="🍰">🍰</option>
                      <option value="🥤">🥤</option>
                      <option value="🥗">🥗</option>
                      <option value="🍳">🍳</option>
                      <option value="🥩">🥩</option>
                      <option value="🍟">🍟</option>
                    </select>
                    <Input
                      placeholder="Nombre de la categoría"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Crear Categoría
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                        setNewCategoryIcon('📦');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={productForm.isFeatured}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: checked }))}
                  className="data-[state=checked]:bg-yellow-500"
                />
                <span className="text-sm">⭐ Destacado</span>
              </label>
            </div>

            {/* Requiere Empaque - Switch */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${productForm.requiereEmpaque ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Package className={`w-5 h-5 ${productForm.requiereEmpaque ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {productForm.requiereEmpaque ? 'Requiere Empaque' : 'Sin Empaque'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {productForm.requiereEmpaque
                      ? 'Se cobrará el valor del empaque en domicilios'
                      : 'No se cobrará el empaque en domicilios'}
                  </p>
                </div>
              </div>
              <Switch
                checked={productForm.requiereEmpaque}
                onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, requiereEmpaque: checked }))}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
              />
            </div>

            {/* Sección de Ofertas */}
            <div className="border border-orange-200 rounded-lg overflow-hidden">
              {/* Header con Switch */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${productForm.onSale ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <span className="text-lg">{productForm.onSale ? '🏷️' : '📍'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {productForm.onSale ? 'Producto en Oferta' : 'Sin Oferta'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {productForm.onSale
                        ? 'Se mostrará con precio especial en el menú'
                        : 'Activa para aplicar un descuento'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={productForm.onSale ?? false}
                  onCheckedChange={(checked) => setProductForm(prev => ({
                    ...prev,
                    onSale: checked,
                    salePrice: checked ? prev.salePrice : 0
                  }))}
                  className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-300"
                />
              </div>

              {/* Campos de Oferta (condicionales) */}
              {productForm.onSale && (
                <div className="p-4 space-y-4 bg-white">
                  {/* Precio de Oferta */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Precio Original</Label>
                      <div className="mt-1 p-2 bg-gray-100 rounded-md text-gray-500 line-through">
                        {formatPrice(productForm.price)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-orange-600">Precio de Oferta *</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={productForm.salePrice || ''}
                        onChange={(e) => setProductForm(prev => ({
                          ...prev,
                          salePrice: parseFloat(e.target.value) || 0
                        }))}
                        className="mt-1 border-orange-300 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Descuento calculado */}
                  {productForm.salePrice > 0 && productForm.salePrice < productForm.price && (
                    <div className="flex items-center justify-center p-2 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-700 font-medium">
                        🎉 Ahorro: {formatPrice(productForm.price - productForm.salePrice)} ({Math.round((1 - productForm.salePrice / productForm.price) * 100)}% OFF)
                      </span>
                    </div>
                  )}

                  {/* Fechas de vigencia */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={productForm.saleStartDate ?? ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, saleStartDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Fecha Fin</Label>
                      <Input
                        type="date"
                        value={productForm.saleEndDate ?? ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, saleEndDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Nota informativa */}
                  <p className="text-xs text-gray-500 flex items-start gap-1">
                    <span>💡</span>
                    <span>Las fechas son opcionales. Si no se especifican, la oferta estará activa indefinidamente.</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowProductModal(false);
              resetProductForm();
            }}>Cancelar</Button>
            <Button
              onClick={handleSaveProduct}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!productForm.name.trim() || productForm.price <= 0}
            >
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Text Modal */}
      <Dialog open={showAITextModal} onOpenChange={closeAIModals}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Crear Producto con IA (Texto)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Describe tu producto</Label>
              <textarea
                className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Ej: Hamburguesa con carne de res, queso cheddar, lechuga, tomate y salsa especial..."
                value={aiTextPrompt}
                onChange={(e) => setAiTextPrompt(e.target.value)}
              />
            </div>

            {!aiGeneratedProduct && (
              <Button
                onClick={handleAITextCreate}
                disabled={isAIProcessing || !aiTextPrompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isAIProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando producto...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
            )}

            {aiGeneratedProduct && (
              <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800">Producto generado:</h4>

                {/* Generated Image with Fallback - Text Modal */}
                <div className="w-full h-40 bg-white rounded-lg overflow-hidden border relative">
                  {isGeneratingImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Generando imagen con IA...</p>
                        <p className="text-xs text-gray-400 mt-1">Esto puede tomar unos segundos</p>
                      </div>
                    </div>
                  ) : aiGeneratedProduct.image ? (
                    <img
                      src={aiGeneratedProduct.image}
                      alt={aiGeneratedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                              <div class="text-center">
                                <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm text-gray-500">Imagen no disponible</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Sin imagen generada</p>
                        <p className="text-xs text-gray-400 mt-1">Se usará un placeholder</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Nombre:</strong> {aiGeneratedProduct.name}</p>
                  <p><strong>Descripción:</strong> {aiGeneratedProduct.description}</p>
                  <p><strong>Precio:</strong> ${aiGeneratedProduct.price.toLocaleString()}</p>
                  <p><strong>Categoría:</strong> {aiGeneratedProduct.category}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAIModals}>Cancelar</Button>
            {aiGeneratedProduct && (
              <Button onClick={handleSaveAIProduct} className="bg-purple-600 hover:bg-purple-700">
                Guardar Producto
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Voice Modal */}
      <Dialog open={showAIVoiceModal} onOpenChange={closeAIModals}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-600" />
              Crear Producto con IA (Voz)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleAIVoiceCreate}
                disabled={isAIProcessing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-700'
                  }`}
              >
                <Mic className={`w-8 h-8 text-white ${isRecording ? 'animate-bounce' : ''}`} />
              </button>
              <p className="text-sm text-gray-500 text-center">
                {isRecording
                  ? '🎤 Grabando... Habla ahora'
                  : isAIProcessing
                    ? '⏳ Procesando...'
                    : 'Toca el micrófono y describe tu producto'}
              </p>
            </div>

            {speechError && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                <p className="font-medium">⚠️ {speechError}</p>
              </div>
            )}

            {aiTextPrompt && !speechError && (
              <div className="p-3 bg-gray-50 rounded-lg border text-sm">
                <p className="text-gray-600">Transcripción:</p>
                <p className="font-medium">{aiTextPrompt}</p>
              </div>
            )}

            {isAIProcessing && (
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generando producto...</span>
              </div>
            )}

            {aiGeneratedProduct && (
              <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800">Producto generado:</h4>

                {/* Generated Image with Fallback - Voice Modal */}
                <div className="w-full h-40 bg-white rounded-lg overflow-hidden border relative">
                  {isGeneratingImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Generando imagen con IA...</p>
                        <p className="text-xs text-gray-400 mt-1">Esto puede tomar unos segundos</p>
                      </div>
                    </div>
                  ) : aiGeneratedProduct.image ? (
                    <img
                      src={aiGeneratedProduct.image}
                      alt={aiGeneratedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                              <div class="text-center">
                                <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm text-gray-500">Imagen no disponible</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Sin imagen generada</p>
                        <p className="text-xs text-gray-400 mt-1">Se usará un placeholder</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Nombre:</strong> {aiGeneratedProduct.name}</p>
                  <p><strong>Descripción:</strong> {aiGeneratedProduct.description}</p>
                  <p><strong>Precio:</strong> ${aiGeneratedProduct.price.toLocaleString()}</p>
                  <p><strong>Categoría:</strong> {aiGeneratedProduct.category}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAIModals}>Cancelar</Button>
            {aiGeneratedProduct && (
              <Button onClick={handleSaveAIProduct} className="bg-purple-600 hover:bg-purple-700">
                Guardar Producto
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
        setShowDeleteConfirm(open);
        if (!open) setProductToDelete(null);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar el producto <strong>"{productToDelete?.name}"</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteConfirm(false);
              setProductToDelete(null);
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog open={showOrderDetail} onOpenChange={(open) => {
        setShowOrderDetail(open);
        if (!open) setSelectedOrder(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              Detalle del Pedido {selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900">Información del Cliente</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Nombre:</span>
                    <p className="font-medium">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <p className="font-medium">{selectedOrder.phone || 'No especificado'}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Dirección:</span>
                  <p className="font-medium">{selectedOrder.address || 'No especificada'}</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900">Información del Pedido</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Hora:</span>
                    <p className="font-medium">{selectedOrder.time}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <p className="font-medium">{selectedOrder.items}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <p className="font-medium text-purple-600">${selectedOrder.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Estado:</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedOrder.status as any} />
                    </div>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="text-sm mt-2">
                    <span className="text-gray-500">Notas:</span>
                    <p className="font-medium bg-yellow-50 p-2 rounded mt-1">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Update Status */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Cambiar Estado</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={selectedOrder.status === 'pending' ? 'default' : 'outline'}
                    className={selectedOrder.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    onClick={() => updateOrderStatus('pending')}
                  >
                    Pendiente
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.status === 'preparing' ? 'default' : 'outline'}
                    className={selectedOrder.status === 'preparing' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    onClick={() => updateOrderStatus('preparing')}
                  >
                    Preparando
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.status === 'ready' ? 'default' : 'outline'}
                    className={selectedOrder.status === 'ready' ? 'bg-green-500 hover:bg-green-600' : ''}
                    onClick={() => updateOrderStatus('ready')}
                  >
                    Listo
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.status === 'delivered' ? 'default' : 'outline'}
                    className={selectedOrder.status === 'delivered' ? 'bg-gray-500 hover:bg-gray-600' : ''}
                    onClick={() => updateOrderStatus('delivered')}
                  >
                    Entregado
                  </Button>
                </div>
              </div>

              {/* Payment Status Update */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Actualizar Estado del Pago</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={selectedOrder.paymentStatus === 'pending' || !selectedOrder.paymentStatus ? 'default' : 'outline'}
                    className={selectedOrder.paymentStatus === 'pending' || !selectedOrder.paymentStatus ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    onClick={() => updateOrderPaymentStatus('pending')}
                  >
                    Pendiente
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'outline'}
                    className={selectedOrder.paymentStatus === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                    onClick={() => updateOrderPaymentStatus('paid')}
                  >
                    Pagado
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.paymentStatus === 'refunded' ? 'default' : 'outline'}
                    className={selectedOrder.paymentStatus === 'refunded' ? 'bg-gray-500 hover:bg-gray-600' : ''}
                    onClick={() => updateOrderPaymentStatus('refunded')}
                  >
                    Reembolsado
                  </Button>
                </div>
              </div>

              {/* Actions - WhatsApp and Map */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (selectedOrder.phone) {
                      const whatsappUrl = `https://wa.me/${selectedOrder.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${selectedOrder.customer}, tu pedido ${selectedOrder.id} está en proceso.`)}`;
                      window.open(whatsappUrl, '_blank');
                    }
                  }}
                  disabled={!selectedOrder.phone}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (selectedOrder.address) {
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.address)}`;
                      window.open(mapsUrl, '_blank');
                    }
                  }}
                  disabled={!selectedOrder.address}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Ver Mapa
                </Button>
              </div>

              {/* Print Buttons */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Imprimir</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={() => selectedOrder && printUnifiedOrderTicket(selectedOrder)}
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Imprimir Directo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500 text-purple-600 hover:bg-purple-50"
                    onClick={() => selectedOrder && downloadOrderPDF(selectedOrder)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Imprimir PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeOrderDetail}>
              Cerrar
            </Button>
            <Button
              onClick={handleSaveOrderChanges}
              disabled={isSavingOrderChanges}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSavingOrderChanges ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Order Detail Modal */}
      <Dialog open={showDeliveryDetail} onOpenChange={(open) => {
        setShowDeliveryDetail(open);
        if (!open) setSelectedDelivery(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-600" />
              Factura de Domicilio {selectedDelivery?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Invoice Header */}
              <div className="bg-purple-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-purple-600">ID del Pedido</p>
                  <p className="font-bold text-purple-800">{selectedDelivery.id}</p>
                </div>
                <Badge className={getDeliveryStatusColor(selectedDelivery.status)}>
                  {getDeliveryStatusText(selectedDelivery.status)}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Nombre:</span>
                    <p className="font-medium">{selectedDelivery.customer}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedDelivery.phone}
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Dirección:</span>
                  <p className="font-medium flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                    <span>{selectedDelivery.address}</span>
                  </p>
                  <p className="text-xs text-gray-400 ml-4">Barrio: {selectedDelivery.neighborhood}</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Detalles del Pedido
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Hora de Creación:</span>
                    <p className="font-medium">{selectedDelivery.createdAt}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Entrega Estimada:</span>
                    <p className="font-medium">{selectedDelivery.estimatedDelivery}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cantidad Items:</span>
                    <p className="font-medium">{selectedDelivery.items}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Domicilio:</span>
                    <p className="font-medium">${selectedDelivery.deliveryFee.toLocaleString()}</p>
                  </div>
                </div>
                {selectedDelivery.driver && (
                  <div className="text-sm mt-2">
                    <span className="text-gray-500">Mensajero Asignado:</span>
                    <p className="font-medium text-purple-600">{selectedDelivery.driver}</p>
                  </div>
                )}
                {selectedDelivery.notes && (
                  <div className="text-sm mt-2">
                    <span className="text-gray-500">Notas:</span>
                    <p className="font-medium bg-yellow-50 p-2 rounded mt-1">{selectedDelivery.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Información de Pago
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Subtotal:</span>
                    <p className="font-medium">${selectedDelivery.subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Domicilio:</span>
                    <p className="font-medium">${selectedDelivery.deliveryFee.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <p className="font-bold text-lg text-purple-600">${selectedDelivery.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Método:</span>
                    <p className="font-medium">{getPaymentMethodText(selectedDelivery.paymentMethod)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">Estado del Pago:</span>
                  <Badge className={getPaymentStatusColor(selectedDelivery.paymentStatus)}>
                    {selectedDelivery.paymentStatus === 'pending' ? 'Pendiente' : selectedDelivery.paymentStatus === 'paid' ? 'Pagado' : 'Reembolsado'}
                  </Badge>
                </div>
              </div>

              {/* Update Status */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Actualizar Estado del Pedido</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={selectedDelivery.status === 'pending' ? 'default' : 'outline'}
                    className={selectedDelivery.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    onClick={() => updateDeliveryStatus('pending')}
                  >
                    Pendiente
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDelivery.status === 'confirmed' ? 'default' : 'outline'}
                    className={selectedDelivery.status === 'confirmed' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    onClick={() => updateDeliveryStatus('confirmed')}
                  >
                    Confirmado
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDelivery.status === 'preparing' ? 'default' : 'outline'}
                    className={selectedDelivery.status === 'preparing' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    onClick={() => updateDeliveryStatus('preparing')}
                  >
                    Preparando
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDelivery.status === 'on_the_way' ? 'default' : 'outline'}
                    className={selectedDelivery.status === 'on_the_way' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                    onClick={() => updateDeliveryStatus('on_the_way')}
                  >
                    En Camino
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDelivery.status === 'delivered' ? 'default' : 'outline'}
                    className={selectedDelivery.status === 'delivered' ? 'bg-green-500 hover:bg-green-600' : ''}
                    onClick={() => updateDeliveryStatus('delivered')}
                  >
                    Entregado
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDelivery.status === 'cancelled' ? 'default' : 'outline'}
                    className={selectedDelivery.status === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : 'text-red-600 hover:bg-red-50'}
                    onClick={() => updateDeliveryStatus('cancelled')}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              {/* Payment Status Update */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Actualizar Estado del Pago</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={selectedDelivery.paymentStatus === 'pending' ? 'default' : 'outline'}
                    className={selectedDelivery.paymentStatus === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    onClick={() => updatePaymentStatus('pending')}
                  >
                    Pendiente
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDelivery.paymentStatus === 'paid' ? 'default' : 'outline'}
                    className={selectedDelivery.paymentStatus === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                    onClick={() => updatePaymentStatus('paid')}
                  >
                    Pagado
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDelivery.paymentStatus === 'refunded' ? 'default' : 'outline'}
                    className={selectedDelivery.paymentStatus === 'refunded' ? 'bg-gray-500 hover:bg-gray-600' : ''}
                    onClick={() => updatePaymentStatus('refunded')}
                  >
                    Reembolsado
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/${selectedDelivery.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${selectedDelivery.customer}, tu pedido ${selectedDelivery.invoiceNumber} está en proceso.`)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDelivery.address)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Ver Mapa
                </Button>
              </div>

              {/* Print Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Opciones de Impresión</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-blue-600 hover:bg-blue-50 border-blue-200"
                    onClick={() => {
                      if (selectedDelivery) {
                        printDeliveryOrderTicket(selectedDelivery);
                      }
                    }}
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-green-600 hover:bg-green-50 border-green-200"
                    onClick={() => printDeliveryOrderTicket(selectedDelivery)}
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Imprimir Directo
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-purple-600 hover:bg-purple-50 border-purple-200"
                    onClick={() => downloadDeliveryPDF(selectedDelivery)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Imprimir PDF
                  </Button>
                </div>
              </div>

              {/* Print and PDF Buttons - Only for delivered orders */}
              {selectedDelivery.status === 'delivered' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-blue-600 hover:bg-blue-50 border-blue-200"
                    onClick={() => printDeliveryOrderTicket(selectedDelivery)}
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Imprimir Ticket
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-purple-600 hover:bg-purple-50 border-purple-200"
                    onClick={() => downloadDeliveryPDF(selectedDelivery)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDeliveryDetail} className="flex-1">
              Cerrar
            </Button>
            <Button
              onClick={handleSaveDeliveryChanges}
              disabled={isSavingDeliveryChanges}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSavingDeliveryChanges ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: Delete Orders Confirmation Modal */}
      <Dialog open={showOrderDeleteConfirm} onOpenChange={setShowOrderDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              ¿Eliminar <strong>{selectedOrderIds.size} pedido{selectedOrderIds.size !== 1 ? 's' : ''}</strong> seleccionado{selectedOrderIds.size !== 1 ? 's' : ''}?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta acción no se puede deshacer.
            </p>
            {selectedOrderIds.size > 500 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ Se procesarán en lotes de 500 registros.
                </p>
              </div>
            )}
            {isDeletingOrders && (
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-500">
                  Eliminando {deleteProgress.current} de {deleteProgress.total}...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOrderDeleteConfirm(false)}
              disabled={isDeletingOrders}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSelectedOrders}
              disabled={isDeletingOrders}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingOrders ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Confirmar eliminación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: Delete Deliveries Confirmation Modal */}
      <Dialog open={showDeliveryDeleteConfirm} onOpenChange={setShowDeliveryDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              ¿Eliminar <strong>{selectedDeliveryIds.size} domicilio{selectedDeliveryIds.size !== 1 ? 's' : ''}</strong> seleccionado{selectedDeliveryIds.size !== 1 ? 's' : ''}?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta acción no se puede deshacer.
            </p>
            {selectedDeliveryIds.size > 500 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ Se procesarán en lotes de 500 registros.
                </p>
              </div>
            )}
            {isDeletingDeliveries && (
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(deliveryDeleteProgress.current / deliveryDeleteProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-500">
                  Eliminando {deliveryDeleteProgress.current} de {deliveryDeleteProgress.total}...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeliveryDeleteConfirm(false)}
              disabled={isDeletingDeliveries}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSelectedDeliveryInvoices}
              disabled={isDeletingDeliveries}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingDeliveries ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Confirmar eliminación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printer Modal - Add/Edit */}
      <Dialog open={showPrinterModal} onOpenChange={(open) => {
        setShowPrinterModal(open);
        if (!open) setEditingPrinter(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PrinterIcon className="w-5 h-5 text-purple-600" />
              {editingPrinter ? 'Editar Impresora' : 'Agregar Impresora'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="printerName">Nombre *</Label>
              <Input
                id="printerName"
                value={printerForm.name}
                onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })}
                placeholder="Ej: Impresora Cocina"
                className="mt-1.5"
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="printerType">Tipo</Label>
              <div className="flex gap-2 mt-1.5">
                <select
                  id="printerType"
                  value={printerForm.type}
                  onChange={(e) => setPrinterForm({ ...printerForm, type: e.target.value })}
                  className="flex-1 h-10 rounded-md border border-gray-300 px-3 text-sm"
                >
                  {getAllPrinterTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {isAddingNewType ? (
                  <div className="flex gap-1">
                    <Input
                      value={newPrinterType}
                      onChange={(e) => setNewPrinterType(e.target.value)}
                      placeholder="Nuevo tipo"
                      className="w-28"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newPrinterType.trim()) {
                          setCustomPrinterTypes([...customPrinterTypes, newPrinterType.trim()]);
                          setPrinterForm({ ...printerForm, type: newPrinterType.trim() });
                          setNewPrinterType('');
                          setIsAddingNewType(false);
                        }
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingNewType(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Area */}
            <div>
              <Label htmlFor="printerArea">Área</Label>
              <div className="flex gap-2 mt-1.5">
                <select
                  id="printerArea"
                  value={printerForm.area}
                  onChange={(e) => setPrinterForm({ ...printerForm, area: e.target.value })}
                  className="flex-1 h-10 rounded-md border border-gray-300 px-3 text-sm"
                >
                  {getAllPrinterAreas().map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                {isAddingNewArea ? (
                  <div className="flex gap-1">
                    <Input
                      value={newPrinterArea}
                      onChange={(e) => setNewPrinterArea(e.target.value)}
                      placeholder="Nueva área"
                      className="w-28"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newPrinterArea.trim()) {
                          setCustomPrinterAreas([...customPrinterAreas, newPrinterArea.trim()]);
                          setPrinterForm({ ...printerForm, area: newPrinterArea.trim() });
                          setNewPrinterArea('');
                          setIsAddingNewArea(false);
                        }
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingNewArea(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* IP Address */}
            <div>
              <Label htmlFor="printerIp">Dirección IP *</Label>
              <Input
                id="printerIp"
                value={printerForm.ip}
                onChange={(e) => setPrinterForm({ ...printerForm, ip: e.target.value })}
                placeholder="Ej: 192.168.1.100"
                className="mt-1.5"
              />
            </div>

            {/* Port */}
            <div>
              <Label htmlFor="printerPort">Puerto</Label>
              <Input
                id="printerPort"
                type="number"
                value={printerForm.port}
                onChange={(e) => setPrinterForm({ ...printerForm, port: parseInt(e.target.value) || 9100 })}
                placeholder="9100"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">Puerto predeterminado: 9100</p>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Switch
                  checked={printerForm.isDefault}
                  onCheckedChange={(checked) => setPrinterForm({ ...printerForm, isDefault: checked })}
                  className="data-[state=checked]:bg-yellow-500"
                />
                <div>
                  <p className="font-medium text-sm">Impresora predeterminada</p>
                  <p className="text-xs text-gray-500">Se usará para impresiones automáticas</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Switch
                  checked={printerForm.isActive}
                  onCheckedChange={(checked) => setPrinterForm({ ...printerForm, isActive: checked })}
                  className="data-[state=checked]:bg-green-500"
                />
                <div>
                  <p className="font-medium text-sm">Activa</p>
                  <p className="text-xs text-gray-500">La impresora está disponible para uso</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrinterModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePrinter}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!printerForm.name.trim() || !printerForm.ip.trim()}
            >
              {editingPrinter ? 'Guardar Cambios' : 'Agregar Impresora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Printer Confirmation Modal */}
      <Dialog open={showPrinterDeleteConfirm} onOpenChange={(open) => {
        setShowPrinterDeleteConfirm(open);
        if (!open) setPrinterToDelete(null);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar la impresora <strong>"{printerToDelete?.name}"</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPrinterDeleteConfirm(false);
              setPrinterToDelete(null);
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeletePrinter}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hotmart Modal - Mejorado con Dialog de Shadcn */}
      <Dialog open={showHotmartModal} onOpenChange={setShowHotmartModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <DialogTitle className="text-xl">{hotmartModalMessage.title}</DialogTitle>
            </div>
            <DialogDescription className="text-base text-gray-600">
              {hotmartModalMessage.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end mt-4">
            <Button
              type="button"
              onClick={() => setShowHotmartModal(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// BACKUP SECTION COMPONENT
// ============================================================================

interface BackupMetadata {
  version: string;
  app: string;
  businessName: string;
  businessId: string;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  collections: string[];
}

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
}

interface BackupSectionProps {
  businessName: string;
  onToast: (message: { type: 'success' | 'error'; message: string }) => void;
}

function BackupSection({ businessName, onToast }: BackupSectionProps) {
  // State for backup creation
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // State for restore
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupMetadata | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // State for schedule
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    frequency: 'disabled',
    hour: '08:00',
    email: ''
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // State for history
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  // Collections to include in backup
  const [collectionsToInclude, setCollectionsToInclude] = useState({
    products: true,
    categories: true,
    profile: true
  });

  // Load history and schedule on mount
  useEffect(() => {
    loadHistoryAndSchedule();
  }, []);

  const loadHistoryAndSchedule = async (): Promise<void> => {
    try {
      const response = await fetch('/api/backup/history');
      const data = await response.json();

      if (data.success) {
        setBackupHistory(data.data.history || []);
        setLastBackup(data.data.lastBackup);
        if (data.data.schedule) {
          setScheduleConfig(data.data.schedule);
        }
      }
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  };

  // Create and download backup
  const handleCreateBackup = async (): Promise<void> => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/backup');
      const data = await response.json();

      clearInterval(progressInterval);
      setBackupProgress(100);

      if (!data.success) {
        throw new Error(data.error || 'Error al crear backup');
      }

      // Create and download file
      const jsonString = JSON.stringify(data.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const businessSlug = businessName
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');

      const dateStr = new Date()
        .toISOString()
        .slice(0, 16)
        .replace('T', '_')
        .replace(':', '-');

      const fileName = `backup_${businessSlug}_${dateStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      // Add to history locally
      const newHistoryItem: BackupHistoryItem = {
        fileName,
        type: 'manual',
        totalRecords: data.data.metadata.totalRecords,
        createdAt: new Date().toISOString(),
        businessName
      };

      setBackupHistory(prev => [newHistoryItem, ...prev]);
      setLastBackup(new Date().toISOString());

      onToast({
        type: 'success',
        message: `✅ Backup creado: ${data.data.metadata.totalRecords} registros descargados`
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear backup';
      onToast({ type: 'error', message: `❌ ${errorMsg}` });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  // Handle file selection for restore
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.metadata || !backupData.data) {
        onToast({ type: 'error', message: '❌ Archivo no compatible con MINIMENU.' });
        setRestoreFile(null);
        return;
      }

      if (backupData.metadata.app !== 'MINIMENU') {
        onToast({ type: 'error', message: '❌ Este backup no es de MINIMENU.' });
        setRestoreFile(null);
        return;
      }

      setRestorePreview(backupData.metadata);
    } catch {
      onToast({ type: 'error', message: '❌ Archivo inválido. No es un JSON válido.' });
      setRestoreFile(null);
    }
  };

  // Execute restore
  const handleRestore = async (): Promise<void> => {
    if (!restoreFile || confirmationCode !== 'RESTAURAR') {
      onToast({ type: 'error', message: '❌ Debes escribir RESTAURAR para confirmar.' });
      return;
    }

    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);

      const progressInterval = setInterval(() => {
        setRestoreProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupData,
          confirmationCode
        })
      });

      clearInterval(progressInterval);
      setRestoreProgress(100);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al restaurar');
      }

      onToast({
        type: 'success',
        message: `✅ ${data.message}`
      });

      // Reset state
      setRestoreFile(null);
      setRestorePreview(null);
      setConfirmationCode('');
      setShowRestoreConfirm(false);

      // Reload page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al restaurar';
      onToast({ type: 'error', message: `❌ ${errorMsg}` });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  // Save schedule config
  const handleSaveSchedule = async (): Promise<void> => {
    setIsSavingSchedule(true);

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleConfig)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar');
      }

      onToast({ type: 'success', message: '✅ Programación guardada correctamente' });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar';
      onToast({ type: 'error', message: `❌ ${errorMsg}` });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return 'hace unos minutos';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Backup & Restauración</h2>
          <p className="text-gray-600 text-sm">Protege y restaura todos los datos de tu negocio</p>
        </div>
      </div>

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Último backup</p>
                <p className="font-semibold text-gray-900">
                  {lastBackup ? formatRelativeTime(lastBackup) : 'Nunca'}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Registros</p>
                <p className="font-semibold text-gray-900">
                  {backupHistory[0]?.totalRecords || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600 font-medium">Salud óptima</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Backup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="w-5 h-5 text-purple-600" />
              Crear Backup
            </CardTitle>
            <CardDescription>
              Genera y descarga un backup completo ahora mismo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Collections to include */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Incluir:</p>
              <div className="space-y-2">
                {Object.entries(collectionsToInclude).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setCollectionsToInclude(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-600 capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {isCreatingBackup && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${backupProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">{backupProgress}% completado</p>
              </div>
            )}

            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup || !Object.values(collectionsToInclude).some(v => v)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isCreatingBackup ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Backup Ahora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled Backup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              Backup Programado
            </CardTitle>
            <CardDescription>
              Configura backups automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Frequency */}
            <div>
              <Label className="text-sm font-medium">Frecuencia</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { value: 'daily', label: 'Diario' },
                  { value: 'weekly', label: 'Semanal' },
                  { value: 'monthly', label: 'Mensual' },
                  { value: 'disabled', label: 'Desactivado' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setScheduleConfig(prev => ({ ...prev, frequency: option.value as ScheduleConfig['frequency'] }))}
                    className={cn(
                      'px-3 py-2 text-sm rounded-lg border transition-colors',
                      scheduleConfig.frequency === option.value
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hour */}
            {scheduleConfig.frequency !== 'disabled' && (
              <>
                <div>
                  <Label className="text-sm font-medium">Hora</Label>
                  <input
                    type="time"
                    value={scheduleConfig.hour}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, hour: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Email de notificación</Label>
                  <input
                    type="email"
                    value={scheduleConfig.email}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@negocio.com"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleSaveSchedule}
              disabled={isSavingSchedule}
              variant="outline"
              className="w-full"
            >
              {isSavingSchedule ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Programación
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Restore Backup Card */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
            <RefreshCw className="w-5 h-5" />
            Restaurar Backup
          </CardTitle>
          <CardDescription className="text-orange-600">
            ⚠️ Restaurar reemplazará los datos actuales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File input */}
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="backup-file-input"
            />
            <label
              htmlFor="backup-file-input"
              className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <Upload className="w-6 h-6 text-orange-500" />
              <span className="text-orange-700 font-medium">
                {restoreFile ? restoreFile.name : 'Seleccionar archivo .json de backup'}
              </span>
            </label>
          </div>

          {/* Preview */}
          {restorePreview && (
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{restorePreview.businessName}</p>
                  <div className="mt-1 text-sm text-gray-500 space-y-1">
                    <p>📅 Fecha: {formatDate(restorePreview.createdAt)}</p>
                    <p>📦 Registros: {restorePreview.totalRecords}</p>
                    <p>🏪 Negocio: {restorePreview.businessName}</p>
                  </div>
                  <p className="text-green-600 text-sm mt-2 font-medium">
                    ✅ Archivo válido y compatible
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {restorePreview && !showRestoreConfirm && (
            <Button
              onClick={() => setShowRestoreConfirm(true)}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Continuar con Restauración
            </Button>
          )}

          {/* Confirmation input */}
          {showRestoreConfirm && restorePreview && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">
                  <strong>⚠️ ADVERTENCIA:</strong> Esta acción reemplazará TODOS los datos actuales.
                  Escribe <strong>RESTAURAR</strong> para confirmar.
                </p>
              </div>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                placeholder="Escribe RESTAURAR"
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              {/* Progress bar */}
              {isRestoring && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${restoreProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">{restoreProgress}% restaurando...</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowRestoreConfirm(false);
                    setConfirmationCode('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isRestoring}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRestore}
                  disabled={confirmationCode !== 'RESTAURAR' || isRestoring}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Restaurar Datos
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-purple-600" />
            Historial de Backups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HardDrive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay backups en el historial</p>
              <p className="text-sm">Crea tu primer backup para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Fecha</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Nombre</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Tipo</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Registros</th>
                  </tr>
                </thead>
                <tbody>
                  {backupHistory.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-600">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-2 px-3 text-gray-600 font-mono text-xs truncate max-w-[200px]">
                        {item.fileName}
                      </td>
                      <td className="py-2 px-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          item.type === 'manual'
                            ? 'bg-blue-100 text-blue-700'
                            : item.type === 'auto'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                        )}>
                          {item.type === 'manual' ? 'Manual' : item.type === 'auto' ? 'Auto' : 'Restore'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {item.totalRecords || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
