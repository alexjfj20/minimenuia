'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from './StatusBadge';
import type { User } from '@/types';
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
  Printer,
  FileText,
  Save,
  HardDrive,
  Upload,
  AlertTriangle,
  Calendar,
  RefreshCw
} from 'lucide-react';

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

// --- Product Interface ---
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  featured: boolean;
  image: string | null;
  stock: number;
  requiereEmpaque?: boolean;
}

// --- Order Interface ---
interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  time: string;
  date: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// --- Delivery Order Interface ---
interface DeliveryOrder {
  id: string;
  invoiceNumber: string;
  customer: string;
  phone: string;
  address: string;
  neighborhood: string;
  items: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
  createdAt: string;
  date: string;
  estimatedDelivery: string;
  driver?: string;
}

// Category interface
interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

// Default categories for fallback
const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Entradas', icon: '🥗', order: 1 },
  { id: 'cat-2', name: 'Platos Principales', icon: '🍽️', order: 2 },
  { id: 'cat-3', name: 'Bebidas', icon: '🥤', order: 3 },
  { id: 'cat-4', name: 'Postres', icon: '🍰', order: 4 }
];

const mockOrders: Order[] = [
  { id: 'ORD-001', customer: 'Pedro Martínez', items: 3, total: 80000, status: 'pending', time: '12:30 PM', date: '2025-02-28', phone: '+57 300 111 2222', address: 'Calle 10 #20-30', notes: 'Sin cebolla' },
  { id: 'ORD-002', customer: 'Laura Sánchez', items: 1, total: 12000, status: 'preparing', time: '12:15 PM', date: '2025-02-28', phone: '+57 300 333 4444', address: 'Carrera 5 #15-25' },
  { id: 'ORD-003', customer: 'Carlos López', items: 5, total: 95000, status: 'ready', time: '11:45 AM', date: '2025-02-27', phone: '+57 300 555 6666', address: 'Av. Principal #45-67' },
  { id: 'ORD-004', customer: 'Ana García', items: 2, total: 43000, status: 'delivered', time: '11:00 AM', date: '2025-02-27', phone: '+57 300 777 8888', address: 'Diagonal 8 #12-34', notes: 'Enviar factura' }
];

// Mock delivery orders data
const mockDeliveryOrders: DeliveryOrder[] = [
  {
    id: 'DOM-001',
    invoiceNumber: 'FAC-2024-001',
    customer: 'María Rodríguez',
    phone: '+57 301 234 5678',
    address: 'Calle 45 #67-89, Apto 302',
    neighborhood: 'Chapinero',
    items: 4,
    subtotal: 65000,
    deliveryFee: 5000,
    total: 70000,
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    notes: 'Portero azul, timbre 3',
    createdAt: '14:30',
    date: '2025-02-28',
    estimatedDelivery: '15:15'
  },
  {
    id: 'DOM-002',
    invoiceNumber: 'FAC-2024-002',
    customer: 'Juan Pérez',
    phone: '+57 302 345 6789',
    address: 'Carrera 10 #20-30',
    neighborhood: 'La Candelaria',
    items: 2,
    subtotal: 42000,
    deliveryFee: 4000,
    total: 46000,
    status: 'on_the_way',
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    createdAt: '13:45',
    date: '2025-02-28',
    estimatedDelivery: '14:30',
    driver: 'Carlos Mensajero'
  },
  {
    id: 'DOM-003',
    invoiceNumber: 'FAC-2024-003',
    customer: 'Ana Martínez',
    phone: '+57 303 456 7890',
    address: 'Av. Caracas #50-60, Local 5',
    neighborhood: 'Centro',
    items: 6,
    subtotal: 120000,
    deliveryFee: 6000,
    total: 126000,
    status: 'preparing',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    notes: 'Edificio de oficinas, piso 3',
    createdAt: '13:00',
    date: '2025-02-27',
    estimatedDelivery: '14:00'
  },
  {
    id: 'DOM-004',
    invoiceNumber: 'FAC-2024-004',
    customer: 'Luis Gómez',
    phone: '+57 304 567 8901',
    address: 'Diagonal 30 #15-25',
    neighborhood: 'Teusaquillo',
    items: 3,
    subtotal: 55000,
    deliveryFee: 5000,
    total: 60000,
    status: 'delivered',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdAt: '11:30',
    date: '2025-02-27',
    estimatedDelivery: '12:15',
    driver: 'Pedro Mensajero'
  },
  {
    id: 'DOM-005',
    invoiceNumber: 'FAC-2024-005',
    customer: 'Carolina Silva',
    phone: '+57 305 678 9012',
    address: 'Calle 80 #15-40',
    neighborhood: 'Chapinero',
    items: 1,
    subtotal: 25000,
    deliveryFee: 4000,
    total: 29000,
    status: 'cancelled',
    paymentMethod: 'transfer',
    paymentStatus: 'refunded',
    notes: 'Cliente canceló por demora',
    createdAt: '10:00',
    date: '2025-02-26',
    estimatedDelivery: '10:45'
  }
];

export function BusinessAdminPanel({ user, onLogout }: BusinessAdminPanelProps) {
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
        const response = await fetch('/api/products');
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
    available: true,
    featured: false,
    image: null as string | null,
    stock: 0,
    requiereEmpaque: true
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
    image: string | null;
  } | null>(null);
  
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
    phone: '',
    address: '',
    primaryColor: '#8b5cf6',
    secondaryColor: '#ffffff',
    impoconsumo: 8,
    // Imágenes del negocio
    avatar: null as string | null,
    logo: null as string | null,
    banner: null as string | null,
    // Propina Voluntaria
    tipEnabled: true,
    tipPercentageDefault: 10,
    tipOnlyOnPremise: true
  });
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  // --- Order Detail States ---
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- Delivery Order States ---
  const [showDeliveryDetail, setShowDeliveryDetail] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'pending' | 'on_the_way' | 'delivered'>('all');
  const [deliverySearch, setDeliverySearch] = useState('');

  // --- Bulk Selection States (Pedidos) ---
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [orderDateFrom, setOrderDateFrom] = useState<string>('');
  const [orderDateTo, setOrderDateTo] = useState<string>('');
  const [showOrderDeleteConfirm, setShowOrderDeleteConfirm] = useState(false);
  const [isDeletingOrders, setIsDeletingOrders] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });

  // --- Bulk Selection States (Domicilios) ---
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<Set<string>>(new Set());
  const [deliveryDateFrom, setDeliveryDateFrom] = useState<string>('');
  const [deliveryDateTo, setDeliveryDateTo] = useState<string>('');
  const [showDeliveryDeleteConfirm, setShowDeliveryDeleteConfirm] = useState(false);
  const [isDeletingDeliveries, setIsDeletingDeliveries] = useState(false);
  const [deliveryDeleteProgress, setDeliveryDeleteProgress] = useState({ current: 0, total: 0 });

  // --- Empaque States ---
  const [valorEmpaqueUnitario, setValorUnitarioEmpaque] = useState<number>(500);
  const [isSavingEmpaque, setIsSavingEmpaque] = useState<boolean>(false);

  // Load profile from API on mount
  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      setIsLoadingProfile(true);
      try {
        // First try to load from localStorage for instant display
        const savedProfile = localStorage.getItem('businessProfile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfileId(parsed.id);
          setProfileForm({
            businessName: parsed.name || '',
            phone: parsed.phone || '',
            address: parsed.address || '',
            primaryColor: parsed.primaryColor || '#8b5cf6',
            secondaryColor: parsed.secondaryColor || '#ffffff',
            impoconsumo: parsed.impoconsumo ?? 8,
            // Imágenes del negocio
            avatar: parsed.avatar || null,
            logo: parsed.logo || null,
            banner: parsed.banner || null,
            // Propina Voluntaria
            tipEnabled: parsed.tipEnabled ?? true,
            tipPercentageDefault: parsed.tipPercentageDefault ?? 10,
            tipOnlyOnPremise: parsed.tipOnlyOnPremise ?? true
          });
          // Load empaque value
          if (parsed.valorEmpaqueUnitario !== undefined) {
            setValorUnitarioEmpaque(parsed.valorEmpaqueUnitario);
          }
        }

        // Then sync with server
        const response = await fetch('/api/settings/profile');
        const data = await response.json();
        
        if (data.success && data.data) {
          setProfileId(data.data.id);
          setProfileForm({
            businessName: data.data.name || '',
            phone: data.data.phone || '',
            address: data.data.address || '',
            primaryColor: data.data.primaryColor || '#8b5cf6',
            secondaryColor: data.data.secondaryColor || '#ffffff',
            impoconsumo: data.data.impoconsumo ?? 8,
            // Imágenes del negocio
            avatar: data.data.avatar || null,
            logo: data.data.logo || null,
            banner: data.data.banner || null,
            // Propina Voluntaria
            tipEnabled: data.data.tipEnabled ?? true,
            tipPercentageDefault: data.data.tipPercentageDefault ?? 10,
            tipOnlyOnPremise: data.data.tipOnlyOnPremise ?? true
          });
          // Load empaque value from server
          if (data.data.valorEmpaqueUnitario !== undefined) {
            setValorUnitarioEmpaque(data.data.valorEmpaqueUnitario);
          }
          // Update localStorage
          localStorage.setItem('businessProfile', JSON.stringify(data.data));
        }
      } catch (error) {
        console.error('[Profile] Error loading profile:', error);
        // Try to use localStorage as fallback
        const savedProfile = localStorage.getItem('businessProfile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfileId(parsed.id);
          setProfileForm({
            businessName: parsed.name || 'Mi Restaurante',
            phone: parsed.phone || '+57 300 000 0000',
            address: parsed.address || 'Dirección del negocio',
            primaryColor: parsed.primaryColor || '#8b5cf6',
            secondaryColor: parsed.secondaryColor || '#ffffff',
            impoconsumo: parsed.impoconsumo ?? 8,
            // Imágenes del negocio
            avatar: parsed.avatar || null,
            logo: parsed.logo || null,
            banner: parsed.banner || null,
            // Propina Voluntaria
            tipEnabled: parsed.tipEnabled ?? true,
            tipPercentageDefault: parsed.tipPercentageDefault ?? 10,
            tipOnlyOnPremise: parsed.tipOnlyOnPremise ?? true
          });
        } else {
          // Set default values if loading fails
          setProfileForm({
            businessName: 'Mi Restaurante',
            phone: '+57 300 000 0000',
            address: 'Dirección del negocio',
            primaryColor: '#8b5cf6',
            secondaryColor: '#ffffff',
            impoconsumo: 8,
            // Imágenes del negocio
            avatar: null,
            logo: null,
            banner: null,
            // Propina Voluntaria
            tipEnabled: true,
            tipPercentageDefault: 10,
            tipOnlyOnPremise: true
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const stats = {
    todayOrders: 24,
    todayRevenue: 485000,
    pendingOrders: 3,
    totalProducts: products.length
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'catalogo', label: 'Catálogo', icon: <Package className="w-5 h-5" /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'domicilios', label: 'Domicilios', icon: <Truck className="w-5 h-5" /> },
    { id: 'empaque', label: 'Empaque', icon: <Package className="w-5 h-5" /> },
    { id: 'backup', label: 'Backup', icon: <HardDrive className="w-5 h-5" /> },
    { id: 'compartir', label: 'Compartir Menú', icon: <Share2 className="w-5 h-5" /> },
    { id: 'perfil', label: 'Mi Perfil', icon: <Settings className="w-5 h-5" /> }
  ];

  // --- AI Product Creation Handlers ---
  const handleAITextCreate = async (): Promise<void> => {
    if (!aiTextPrompt.trim()) return;
    
    setIsAIProcessing(true);
    try {
      // Simular llamada a API de IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generar imagen con IA
      const generatedImage = await generateAIImage('Producto generado por IA', aiTextPrompt);
      
      // Producto generado simulado
      setAiGeneratedProduct({
        name: 'Producto generado por IA',
        description: aiTextPrompt,
        price: 25000,
        category: 'Platos Principales',
        image: generatedImage
      });
    } catch (error) {
      console.error('Error creating product with AI:', error);
    } finally {
      setIsAIProcessing(false);
    }
  };

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
  }, [isRecording]);

  const processTranscript = async (transcript: string): Promise<void> => {
    if (!transcript.trim()) {
      setSpeechError('No se detectó ninguna descripción. Por favor intenta de nuevo.');
      return;
    }

    setIsAIProcessing(true);
    try {
      // Aquí iría la llamada real a la API de IA
      // Por ahora simulamos el procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Extraer precio si se menciona
      const priceMatch = transcript.match(/(\d+)\s*(mil|pesos|cop)?/i);
      const extractedPrice = priceMatch ? parseInt(priceMatch[1]) * 1000 : 15000;
      
      // Determinar categoría basada en palabras clave
      let category = 'Platos Principales';
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.includes('bebida') || lowerTranscript.includes('jugo') || lowerTranscript.includes('gaseosa') || lowerTranscript.includes('limonada')) {
        category = 'Bebidas';
      } else if (lowerTranscript.includes('postre') || lowerTranscript.includes('dulce') || lowerTranscript.includes('torta') || lowerTranscript.includes('pastel')) {
        category = 'Postres';
      } else if (lowerTranscript.includes('entrada') || lowerTranscript.includes('aperitivo') || lowerTranscript.includes('empanada') || lowerTranscript.includes('arepa')) {
        category = 'Entradas';
      }

      // Generar nombre del producto (primeras palabras significativas)
      const words = transcript.split(' ').filter(w => w.length > 3).slice(0, 4);
      const generatedName = words.length > 0 
        ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : 'Nuevo Producto';

      // Generar imagen con IA
      const generatedImage = await generateAIImage(generatedName, transcript);

      setAiGeneratedProduct({
        name: generatedName,
        description: transcript,
        price: extractedPrice,
        category: category,
        image: generatedImage
      });
    } catch (error) {
      console.error('Error processing transcript:', error);
      setSpeechError('Error al procesar la descripción');
    } finally {
      setIsAIProcessing(false);
    }
  };

  // --- Product Save Functions ---
  const addProductToList = async (product: Omit<Product, 'id'>): Promise<void> => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      
      const data = await response.json();
      
      if (data.success && data.product) {
        setProducts(prev => [...prev, data.product as Product]);
        console.log('[Products] Added product:', data.product.name);
        
        // Update categories if a new one was added
        if (data.product.category && !categories.find(c => c.name === data.product.category)) {
          setCategories(prev => [...prev, {
            id: `cat-${Date.now()}`,
            name: data.product.category,
            icon: '🍴',
            order: prev.length + 1
          }]);
        }
      } else {
        console.error('[Products] Failed to add product:', data.error);
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

  // --- AI Image Generation Function ---
  const generateAIImage = async (productName: string, description: string): Promise<string | null> => {
    setIsGeneratingImage(true);
    
    try {
      // Build effective prompt for food product image
      const promptComponents: string[] = [
        `Professional food photography of ${productName}`,
        description || '',
        'appetizing presentation',
        'restaurant quality',
        'clean white plate',
        'soft natural lighting',
        'shallow depth of field',
        'high quality',
        'detailed'
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
  };

  const handleSaveAIProduct = (): void => {
    if (!aiGeneratedProduct) return;
    
    addProductToList({
      name: aiGeneratedProduct.name,
      description: aiGeneratedProduct.description,
      price: aiGeneratedProduct.price,
      category: aiGeneratedProduct.category,
      available: true,
      featured: false,
      image: aiGeneratedProduct.image
    });
    
    setShowAITextModal(false);
    setShowAIVoiceModal(false);
    setAiGeneratedProduct(null);
    setAiTextPrompt('');
  };

  const handleSaveProduct = async (): Promise<void> => {
    if (!productForm.name.trim() || productForm.price <= 0) return;
    
    if (editingProduct) {
      // Update existing product via API
      try {
        const response = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            ...productForm
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.product) {
          setProducts(prev => prev.map(p => 
            p.id === editingProduct.id 
              ? (data.product as Product)
              : p
          ));
          console.log('[Products] Updated product:', data.product.name);
        }
      } catch (error) {
        console.error('[Products] Error updating product:', error);
      }
      setEditingProduct(null);
    } else {
      // Create new product via API
      await addProductToList({
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        category: productForm.category,
        available: productForm.available,
        featured: productForm.featured,
        image: productForm.image,
        stock: productForm.stock,
        requiereEmpaque: productForm.requiereEmpaque
      });
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
      category: product.category,
      available: product.available,
      featured: product.featured,
      image: product.image,
      stock: product.stock ?? 0,
      requiereEmpaque: product.requiereEmpaque ?? true
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
      const response = await fetch(`/api/products?id=${productToDelete.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
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
      available: true,
      featured: false,
      image: null,
      stock: 0,
      requiereEmpaque: true
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
      name: trimmedName,
      icon: newCategoryIcon,
      order: categories.length + 1
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
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const closeOrderDetail = (): void => {
    setSelectedOrder(null);
    setShowOrderDetail(false);
  };

  const updateOrderStatus = (newStatus: Order['status']): void => {
    if (!selectedOrder) return;
    setSelectedOrder({ ...selectedOrder, status: newStatus });
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

  const getFilteredDeliveries = (): DeliveryOrder[] => {
    return mockDeliveryOrders.filter(delivery => {
      const matchesFilter = deliveryFilter === 'all' || delivery.status === deliveryFilter;
      const matchesSearch = !deliverySearch || 
        delivery.customer.toLowerCase().includes(deliverySearch.toLowerCase()) ||
        delivery.invoiceNumber.toLowerCase().includes(deliverySearch.toLowerCase()) ||
        delivery.address.toLowerCase().includes(deliverySearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
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
      const [time, period] = order.time.split(' ');
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
    return getFilteredOrdersByDate(mockOrders);
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
    setDeleteProgress({ current: 0, total: idsArray.length });

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
        (current, total) => setDeleteProgress({ current, total })
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
      setDeleteProgress({ current: 0, total: 0 });
    }
  };

  // Delete selected deliveries with batch processing
  const deleteSelectedDeliveries = async (): Promise<void> => {
    setIsDeletingDeliveries(true);
    const idsArray = Array.from(selectedDeliveryIds);
    setDeliveryDeleteProgress({ current: 0, total: idsArray.length });

    try {
      // In a real app, this would call an API
      await processBatch(
        idsArray,
        async (batch) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('Deleting deliveries batch:', batch);
        },
        500,
        (current, total) => setDeliveryDeleteProgress({ current, total })
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
      setDeliveryDeleteProgress({ current: 0, total: 0 });
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

  // --- Ticket and PDF Functions ---
  const printThermalTicket = (delivery: DeliveryOrder): void => {
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
          .barcode {
            text-align: center;
            margin: 10px 0;
            font-family: 'Libre Barcode 39', cursive;
            font-size: 40px;
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
            <h1>🍜 MINIMENU</h1>
            <p>Sistema de Gestión de Menús</p>
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
    // Create PDF content as printable HTML
    const pdfContent = `
      <html>
      <head>
        <title>Factura de Domicilio - ${delivery.invoiceNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
          }
          .invoice {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #8b5cf6;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #8b5cf6;
          }
          .logo span {
            color: #333;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-info h2 {
            font-size: 24px;
            color: #8b5cf6;
            margin-bottom: 10px;
          }
          .invoice-info p {
            font-size: 12px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e5e5;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-item {
            margin-bottom: 8px;
          }
          .info-item label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            display: block;
          }
          .info-item span {
            font-size: 13px;
            font-weight: 500;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
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
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
          }
          .address-box p {
            font-size: 13px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .table th {
            background: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            color: #666;
          }
          .table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e5e5;
          }
          .table .text-right {
            text-align: right;
          }
          .totals {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .totals .total-row {
            font-size: 18px;
            font-weight: bold;
            color: #8b5cf6;
            border-bottom: none;
            padding-top: 15px;
          }
          .notes-box {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-top: 20px;
          }
          .notes-box h4 {
            color: #92400e;
            margin-bottom: 5px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            color: #888;
            font-size: 11px;
          }
          .footer p {
            margin-bottom: 5px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <div class="logo">MINI<span>MENU</span></div>
              <p style="color: #888; margin-top: 5px;">Sistema de Gestión de Menús Digitales</p>
            </div>
            <div class="invoice-info">
              <h2>FACTURA DE DOMICILIO</h2>
              <p><strong>${delivery.invoiceNumber}</strong></p>
              <p>${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="section">
              <div class="section-title">Información del Pedido</div>
              <div class="info-item">
                <label>ID del Pedido</label>
                <span>${delivery.id}</span>
              </div>
              <div class="info-item">
                <label>Hora de Creación</label>
                <span>${delivery.createdAt}</span>
              </div>
              <div class="info-item">
                <label>Entrega Estimada</label>
                <span>${delivery.estimatedDelivery}</span>
              </div>
              <div class="info-item">
                <label>Estado</label>
                <span class="status-badge status-${delivery.status}">${getDeliveryStatusText(delivery.status)}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Información del Cliente</div>
              <div class="info-item">
                <label>Nombre</label>
                <span>${delivery.customer}</span>
              </div>
              <div class="info-item">
                <label>Teléfono</label>
                <span>${delivery.phone}</span>
              </div>
              <div class="address-box">
                <p><strong>📍 Dirección de Entrega:</strong></p>
                <p>${delivery.address}</p>
                <p style="color: #888; margin-top: 5px;">Barrio: ${delivery.neighborhood}</p>
              </div>
              ${delivery.driver ? `<div class="info-item" style="margin-top: 10px;"><label>Mensajero Asignado</label><span>${delivery.driver}</span></div>` : ''}
            </div>
          </div>

          <div class="section" style="margin-top: 30px;">
            <div class="section-title">Detalle del Pedido</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Productos del pedido</td>
                  <td class="text-right">${delivery.items}</td>
                  <td class="text-right">$${delivery.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Servicio de Domicilio</td>
                  <td class="text-right">1</td>
                  <td class="text-right">$${delivery.deliveryFee.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="row">
                <span>Subtotal:</span>
                <span>$${delivery.subtotal.toLocaleString()}</span>
              </div>
              <div class="row">
                <span>Domicilio:</span>
                <span>$${delivery.deliveryFee.toLocaleString()}</span>
              </div>
              <div class="row total-row">
                <span>TOTAL:</span>
                <span>$${delivery.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="info-grid" style="margin-top: 30px;">
            <div class="section">
              <div class="section-title">Información de Pago</div>
              <div class="info-item">
                <label>Método de Pago</label>
                <span>${getPaymentMethodText(delivery.paymentMethod)}</span>
              </div>
              <div class="info-item">
                <label>Estado del Pago</label>
                <span class="status-badge payment-${delivery.paymentStatus}">${delivery.paymentStatus === 'paid' ? 'Pagado' : delivery.paymentStatus === 'pending' ? 'Pendiente' : 'Reembolsado'}</span>
              </div>
            </div>
          </div>

          ${delivery.notes ? `
          <div class="notes-box">
            <h4>📝 Notas del Cliente</h4>
            <p>${delivery.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>¡Gracias por su pedido!</strong></p>
            <p>Este documento fue generado automáticamente por MINIMENU</p>
            <p>Para soporte técnico: soporte@minimenu.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print dialog
      printWindow.onload = function(): void {
        printWindow.print();
      };
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
    // Usar el ID del negocio del usuario (simulado)
    return `${baseUrl}/menu/restaurant-${user.id || 'demo'}`;
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
      
      // Simular guardado - en producción sería una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setToastMessage({ type: 'success', message: 'Configuración guardada correctamente' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage({ type: 'error', message: 'Error al guardar la configuración' });
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
          name: profileForm.businessName,
          phone: profileForm.phone,
          address: profileForm.address,
          primaryColor: profileForm.primaryColor,
          secondaryColor: profileForm.secondaryColor,
          impoconsumo: profileForm.impoconsumo,
          // Imágenes del negocio
          avatar: profileForm.avatar,
          logo: profileForm.logo,
          banner: profileForm.banner,
          // Propina Voluntaria
          tipEnabled: profileForm.tipEnabled,
          tipPercentageDefault: profileForm.tipPercentageDefault,
          tipOnlyOnPremise: profileForm.tipOnlyOnPremise
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
          phone: data.data.phone || '',
          address: data.data.address || '',
          primaryColor: data.data.primaryColor || '#8b5cf6',
          secondaryColor: data.data.secondaryColor || '#ffffff',
          impoconsumo: data.data.impoconsumo ?? 8,
          // Imágenes del negocio
          avatar: data.data.avatar || null,
          logo: data.data.logo || null,
          banner: data.data.banner || null,
          // Propina Voluntaria
          tipEnabled: data.data.tipEnabled ?? true,
          tipPercentageDefault: data.data.tipPercentageDefault ?? 10,
          tipOnlyOnPremise: data.data.tipOnlyOnPremise ?? true
        });
        // Save to localStorage for persistence
        localStorage.setItem('businessProfile', JSON.stringify(data.data));
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
          valorEmpaqueUnitario: valorEmpaqueUnitario
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar el valor de empaque');
      }

      // Update localStorage
      const savedProfile = localStorage.getItem('businessProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        parsed.valorEmpaqueUnitario = valorEmpaqueUnitario;
        localStorage.setItem('businessProfile', JSON.stringify(parsed));
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
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Mi Código QR
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
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
                  {mockOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-sm text-gray-500">{order.id} • {order.items} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toLocaleString()}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
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
                        (filterAvailability === 'available' && p.available) ||
                        (filterAvailability === 'unavailable' && !p.available);
                      // Filter by featured
                      const matchesFeatured = filterFeatured === 'all' ||
                        (filterFeatured === 'featured' && p.featured) ||
                        (filterFeatured === 'normal' && !p.featured);
                      
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
                          {product.featured && (
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xl font-bold">${product.price.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Stock: {product.stock ?? 0}</p>
                          </div>
                          <Badge variant={product.available ? 'default' : 'secondary'}>
                            {product.available ? 'Disponible' : 'Agotado'}
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

        {/* Pedidos Tab */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4">
            {/* Existing buttons */}
            <div className="flex items-center gap-4">
              <Button variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Pendientes (3)
              </Button>
              <Button variant="outline">Todos</Button>
            </div>

            {/* NEW: Date Filter Row */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Filtrar por fecha:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={orderDateFrom}
                  onChange={(e) => setOrderDateFrom(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm"
                  placeholder="Desde"
                />
                <span className="text-gray-500">a</span>
                <input
                  type="date"
                  value={orderDateTo}
                  onChange={(e) => setOrderDateTo(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm"
                  placeholder="Hasta"
                />
              </div>
              {(orderDateFrom || orderDateTo) && (
                <Button size="sm" variant="outline" onClick={clearOrderDateFilter}>
                  Limpiar
                </Button>
              )}
            </div>

            {/* NEW: Bulk Actions Bar */}
            {selectedOrderIds.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-sm font-medium text-purple-700">
                  {selectedOrderIds.size} pedido{selectedOrderIds.size !== 1 ? 's' : ''} seleccionado{selectedOrderIds.size !== 1 ? 's' : ''}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowOrderDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar seleccionados
                </Button>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {/* NEW: Checkbox column */}
                        <th className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.size === getFilteredOrders().length && getFilteredOrders().length > 0}
                            onChange={(e) => toggleAllOrders(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="text-left px-6 py-4 font-medium text-gray-600">Pedido</th>
                        <th className="text-left px-6 py-4 font-medium text-gray-600">Cliente</th>
                        <th className="text-left px-6 py-4 font-medium text-gray-600">Items</th>
                        <th className="text-left px-6 py-4 font-medium text-gray-600">Total</th>
                        <th className="text-left px-6 py-4 font-medium text-gray-600">Estado</th>
                        <th className="text-left px-6 py-4 font-medium text-gray-600">Fecha</th>
                        <th className="text-left px-6 py-4 font-medium text-gray-600">Hora</th>
                        <th className="text-right px-6 py-4 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getFilteredOrders().map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          {/* NEW: Checkbox */}
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.has(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-6 py-4 font-medium">{order.id}</td>
                          <td className="px-6 py-4">{order.customer}</td>
                          <td className="px-6 py-4">{order.items}</td>
                          <td className="px-6 py-4 font-medium">${order.total.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-4 text-gray-500">{order.date}</td>
                          <td className="px-6 py-4 text-gray-500">{order.time}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openOrderDetail(order)}>Ver</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Domicilios Tab */}
        {activeTab === 'domicilios' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {mockDeliveryOrders.filter(d => d.status === 'pending').length}
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
                        {mockDeliveryOrders.filter(d => d.status === 'preparing').length}
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
                        {mockDeliveryOrders.filter(d => d.status === 'on_the_way').length}
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
                      <p className="text-sm text-green-600">Entregados Hoy</p>
                      <p className="text-2xl font-bold text-green-700">
                        {mockDeliveryOrders.filter(d => d.status === 'delivered').length}
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

            {/* Delivery Orders Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {/* NEW: Checkbox column */}
                        <th className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedDeliveryIds.size === getFilteredDeliveriesWithDate().length && getFilteredDeliveriesWithDate().length > 0}
                            onChange={(e) => toggleAllDeliveries(e.target.checked)}
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
                        <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Hora</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Entrega Est.</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600 text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getFilteredDeliveriesWithDate().map(delivery => (
                        <tr key={delivery.id} className="hover:bg-gray-50">
                          {/* NEW: Checkbox */}
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedDeliveryIds.has(delivery.id)}
                              onChange={() => toggleDeliverySelection(delivery.id)}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-purple-600">{delivery.invoiceNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{delivery.customer}</p>
                              <p className="text-xs text-gray-500">{delivery.phone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-[200px]">
                              <p className="text-sm text-gray-900 truncate">{delivery.address}</p>
                              <p className="text-xs text-gray-500">{delivery.neighborhood}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{delivery.items}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-bold text-gray-900">${delivery.total.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">Domicilio: ${delivery.deliveryFee.toLocaleString()}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getDeliveryStatusColor(delivery.status)}>
                              {getDeliveryStatusText(delivery.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <Badge className={getPaymentStatusColor(delivery.paymentStatus)}>
                                {delivery.paymentStatus === 'pending' ? 'Pendiente' : delivery.paymentStatus === 'paid' ? 'Pagado' : 'Reembolsado'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{getPaymentMethodText(delivery.paymentMethod)}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{delivery.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{delivery.createdAt}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{delivery.estimatedDelivery}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeliveryDetail(delivery)}
                              >
                                Ver
                              </Button>
                              {delivery.status === 'delivered' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 hover:bg-blue-50"
                                    onClick={() => printThermalTicket(delivery)}
                                    title="Imprimir ticket térmico 80mm"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-purple-600 hover:bg-purple-50"
                                    onClick={() => downloadDeliveryPDF(delivery)}
                                    title="Descargar PDF"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {getFilteredDeliveriesWithDate().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No se encontraron domicilios</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
              <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
              <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
                        <Label>Teléfono</Label>
                        <Input 
                          placeholder="Teléfono" 
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Dirección</Label>
                      <Input 
                        placeholder="Dirección" 
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      />
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

                      {/* Banner */}
                      <div>
                        <Label className="text-sm font-medium">Banner de Cabecera</Label>
                        <p className="text-xs text-gray-500 mb-2">Imagen para la cabecera del menú (recomendado: 1200x400px)</p>
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
                                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                                    profileForm.tipPercentageDefault === pct
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
      </main>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={(open) => {
        setShowProductModal(open);
        if (!open) resetProductForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Estado del Plato - Switch Prominente */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${productForm.available ? 'bg-green-100' : 'bg-red-100'}`}>
                  {productForm.available ? (
                    <span className="text-green-600 text-lg">✓</span>
                  ) : (
                    <span className="text-red-600 text-lg">✕</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {productForm.available ? 'Plato Activo' : 'Plato Inactivo'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {productForm.available 
                      ? 'Este plato será visible en el menú' 
                      : 'Este plato no será visible en el menú'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={productForm.available}
                onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, available: checked }))}
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
                  checked={productForm.featured}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, featured: checked }))}
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
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                  isRecording
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
            <div className="py-4 space-y-4">
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
                      <StatusBadge status={selectedOrder.status} />
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeOrderDetail}>
              Cerrar
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

              {/* Print and PDF Buttons - Only for delivered orders */}
              {selectedDelivery.status === 'delivered' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-blue-600 hover:bg-blue-50 border-blue-200"
                    onClick={() => printThermalTicket(selectedDelivery)}
                  >
                    <Printer className="w-4 h-4 mr-2" />
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
          <DialogFooter>
            <Button variant="outline" onClick={closeDeliveryDetail}>
              Cerrar
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
              onClick={deleteSelectedDeliveries}
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

function BackupSection({ businessName, onToast }: BackupSectionProps): JSX.Element {
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
