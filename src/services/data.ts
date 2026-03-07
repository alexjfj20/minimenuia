// =============================================
// MINIMENU - Mock Data
// =============================================

import type { 
  Business, 
  SystemService, 
  Module, 
  LandingPlan, 
  Integration,
  User,
  GlobalPaymentConfig,
  Category,
  Product,
  Order,
  AIConfig,
  LibraryItem,
  AIMetrics
} from '@/types';

// --- Mock Users ---

export const mockUsers: User[] = [
  {
    id: 'user-super-1',
    email: 'auditsemseo@gmail.com',
    name: 'Super Admin',
    username: 'superadmin',
    role: 'super_admin',
    status: 'active',
    businessId: null,
    businessName: null,
    phone: '+57 300 111 1111',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-06-20T10:30:00Z'
  },
  {
    id: 'user-admin-1',
    email: 'juan@restaurante.com',
    name: 'Juan Pérez',
    username: 'juanperez',
    role: 'admin',
    status: 'active',
    businessId: 'biz-1',
    businessName: 'Restaurante El Sabor',
    phone: '+57 300 123 4567',
    avatar: null,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
    lastLoginAt: '2024-06-19T14:20:00Z'
  },
  {
    id: 'user-emp-1',
    email: 'maria@restaurante.com',
    name: 'María García',
    username: 'mariagarcia',
    role: 'employee',
    status: 'active',
    businessId: 'biz-1',
    businessName: 'Restaurante El Sabor',
    phone: '+57 301 234 5678',
    avatar: null,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    lastLoginAt: '2024-06-18T09:15:00Z'
  },
  {
    id: 'user-admin-2',
    email: 'carlos@cafearoma.com',
    name: 'Carlos Mendoza',
    username: 'carlosmendoza',
    role: 'admin',
    status: 'active',
    businessId: 'biz-2',
    businessName: 'Café Aroma',
    phone: '+57 302 345 6789',
    avatar: null,
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2024-03-20T00:00:00Z',
    lastLoginAt: '2024-06-17T16:45:00Z'
  },
  {
    id: 'user-mess-1',
    email: 'pedro@pizzeriaitalia.com',
    name: 'Pedro Rodríguez',
    username: 'pedrorodriguez',
    role: 'messenger',
    status: 'active',
    businessId: 'biz-3',
    businessName: 'Pizzería Italia',
    phone: '+57 303 456 7890',
    avatar: null,
    createdAt: '2024-04-05T00:00:00Z',
    updatedAt: '2024-04-05T00:00:00Z',
    lastLoginAt: '2024-06-20T08:00:00Z'
  },
  {
    id: 'user-admin-3',
    email: 'ana@sushipalace.com',
    name: 'Ana Tanaka',
    username: 'anatanaka',
    role: 'admin',
    status: 'inactive',
    businessId: 'biz-4',
    businessName: 'Sushi Palace',
    phone: '+57 304 567 8901',
    avatar: null,
    createdAt: '2024-04-10T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
    lastLoginAt: '2024-05-01T11:30:00Z'
  },
  {
    id: 'user-emp-2',
    email: 'laura@cafearoma.com',
    name: 'Laura Sánchez',
    username: 'laurasanchez',
    role: 'employee',
    status: 'pending',
    businessId: 'biz-2',
    businessName: 'Café Aroma',
    phone: '+57 305 678 9012',
    avatar: null,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    lastLoginAt: null
  },
  {
    id: 'user-admin-4',
    email: 'roberto@burgerking.com',
    name: 'Roberto Hernández',
    username: 'robertohernandez',
    role: 'admin',
    status: 'active',
    businessId: 'biz-5',
    businessName: 'Burger House',
    phone: '+57 306 789 0123',
    avatar: null,
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z',
    lastLoginAt: '2024-06-19T18:00:00Z'
  }
];

// --- Mock Businesses ---

export const mockBusinesses: Business[] = [
  {
    id: 'biz-1',
    createdAt: '2024-02-15T10:30:00Z',
    updatedAt: '2024-06-01T14:20:00Z',
    name: 'Restaurante El Sabor',
    ownerId: 'user-biz-1',
    ownerName: 'Juan Pérez',
    ownerEmail: 'juan@restaurante.com',
    phone: '+57 300 123 4567',
    address: 'Calle 123 #45-67, Bogotá',
    planId: 'plan-2',
    planName: 'Profesional',
    status: 'active',
    logo: null,
    primaryColor: '#f97316',
    secondaryColor: '#ffffff',
    slug: 'restaurante-el-sabor'
  },
  {
    id: 'biz-2',
    createdAt: '2024-03-20T09:15:00Z',
    updatedAt: '2024-05-15T11:45:00Z',
    name: 'Café Aroma',
    ownerId: 'user-biz-2',
    ownerName: 'María García',
    ownerEmail: 'maria@cafearoma.com',
    phone: '+57 301 234 5678',
    address: 'Carrera 10 #20-30, Medellín',
    planId: 'plan-1',
    planName: 'Básico',
    status: 'active',
    logo: null,
    primaryColor: '#8b5cf6',
    secondaryColor: '#ffffff',
    slug: 'cafe-aroma'
  },
  {
    id: 'biz-3',
    createdAt: '2024-04-10T16:00:00Z',
    updatedAt: '2024-04-10T16:00:00Z',
    name: 'Pizzería Italia',
    ownerId: 'user-biz-3',
    ownerName: 'Carlos Rossi',
    ownerEmail: 'carlos@pizzeriaitalia.com',
    phone: '+57 302 345 6789',
    address: 'Avenida 5 #6-78, Cali',
    planId: 'plan-3',
    planName: 'Empresarial',
    status: 'pending_payment',
    logo: null,
    primaryColor: '#ef4444',
    secondaryColor: '#ffffff',
    slug: 'pizzeria-italia'
  },
  {
    id: 'biz-4',
    createdAt: '2024-05-01T08:30:00Z',
    updatedAt: '2024-05-20T10:15:00Z',
    name: 'Sushi Palace',
    ownerId: 'user-biz-4',
    ownerName: 'Ana Tanaka',
    ownerEmail: 'ana@sushipalace.com',
    phone: '+57 303 456 7890',
    address: 'Centro Comercial Granada, Local 45',
    planId: 'plan-2',
    planName: 'Profesional',
    status: 'suspended',
    logo: null,
    primaryColor: '#10b981',
    secondaryColor: '#ffffff',
    slug: 'sushi-palace'
  }
];

// --- Mock Services ---

export const mockServices: SystemService[] = [
  {
    id: 'srv-1',
    name: 'Soporte Premium',
    description: 'Soporte técnico prioritario 24/7 con respuesta en menos de 2 horas.',
    price: 49900,
    currency: 'COP',
    billingType: 'monthly',
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'srv-2',
    name: 'Capacitación Personalizada',
    description: 'Sesión de capacitación one-on-one para el equipo del negocio.',
    price: 150000,
    currency: 'COP',
    billingType: 'one_time',
    status: 'active',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'srv-3',
    name: 'Migración de Datos',
    description: 'Servicio de migración de datos desde otros sistemas de gestión.',
    price: 200000,
    currency: 'COP',
    billingType: 'one_time',
    status: 'active',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 'srv-4',
    name: 'Dominio Personalizado',
    description: 'Configuración de dominio personalizado para tu menú digital.',
    price: 29900,
    currency: 'COP',
    billingType: 'monthly',
    status: 'inactive',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  }
];

// --- Mock Modules ---

export const mockModules: Module[] = [
  {
    id: 'mod-1',
    name: 'Menú Digital',
    description: 'Menú digital interactivo con código QR y gestión de productos.',
    type: 'core',
    icon: 'utensils',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mod-2',
    name: 'Pedidos Online',
    description: 'Sistema de pedidos online con seguimiento en tiempo real.',
    type: 'core',
    icon: 'shopping-bag',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mod-3',
    name: 'Reservas',
    description: 'Sistema de reservaciones con calendario y confirmación automática.',
    type: 'addon',
    icon: 'calendar',
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'mod-4',
    name: 'Programa de Lealtad',
    description: 'Sistema de puntos y recompensas para clientes frecuentes.',
    type: 'addon',
    icon: 'star',
    status: 'active',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'mod-5',
    name: 'Código QR',
    description: 'Generación y personalización de códigos QR para tu negocio.',
    type: 'core',
    icon: 'qr-code',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mod-6',
    name: 'Análisis y Reportes',
    description: 'Dashboard con métricas de ventas y comportamiento de clientes.',
    type: 'addon',
    icon: 'bar-chart-3',
    status: 'active',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 'mod-7',
    name: 'Integración WhatsApp',
    description: 'Envío automático de confirmaciones y actualizaciones por WhatsApp.',
    type: 'addon',
    icon: 'message-circle',
    status: 'inactive',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  }
];

// --- Mock Plans ---

export const mockPlans: LandingPlan[] = [
  {
    id: 'plan-1',
    name: 'Básico',
    slug: 'basico',
    description: 'Perfecto para pequeños negocios que están comenzando.',
    price: 49900,
    currency: 'COP',
    period: 'monthly',
    features: [
      'Menú digital ilimitado',
      'Hasta 50 productos',
      'Código QR incluido',
      'Soporte por email',
      'Actualizaciones gratuitas'
    ],
    isActive: true,
    isPublic: true,
    isPopular: false,
    order: 1,
    icon: 'zap',
    color: '#64748b',
    maxUsers: 1,
    maxProducts: 50,
    maxCategories: 5,
    hotmartUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'plan-2',
    name: 'Profesional',
    slug: 'profesional',
    description: 'Ideal para negocios en crecimiento con más necesidades.',
    price: 99000,
    currency: 'COP',
    period: 'monthly',
    features: [
      'Todo del plan Básico',
      'Hasta 200 productos',
      'Pedidos online',
      'Sistema de reservas',
      'Soporte prioritario',
      'Análisis básico'
    ],
    isActive: true,
    isPublic: true,
    isPopular: true,
    order: 2,
    icon: 'briefcase',
    color: '#f97316',
    maxUsers: 3,
    maxProducts: 200,
    maxCategories: 15,
    hotmartUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'plan-3',
    name: 'Empresarial',
    slug: 'empresarial',
    description: 'Para negocios grandes con necesidades avanzadas.',
    price: 199000,
    currency: 'COP',
    period: 'monthly',
    features: [
      'Todo del plan Profesional',
      'Productos ilimitados',
      'Programa de lealtad',
      'Integraciones premium',
      'API personalizada',
      'Soporte 24/7',
      'Múltiples sucursales'
    ],
    isActive: true,
    isPublic: true,
    isPopular: false,
    order: 3,
    icon: 'building-2',
    color: '#8b5cf6',
    maxUsers: 10,
    maxProducts: 1000,
    maxCategories: 50,
    hotmartUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// --- Mock Integrations ---

export const mockIntegrations: Integration[] = [
  {
    id: 'int-1',
    name: 'Stripe',
    description: 'Procesamiento de pagos con tarjeta de crédito/débito.',
    iconSvg: 'credit-card',
    status: 'active',
    requiresManualSetup: false,
    setupInstructions: 'Conecta tu cuenta de Stripe ingresando tus claves API.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'int-2',
    name: 'Mercado Pago',
    description: 'Pasarela de pagos popular en Latinoamérica.',
    iconSvg: 'wallet',
    status: 'active',
    requiresManualSetup: false,
    setupInstructions: 'Vincula tu cuenta de Mercado Pago para recibir pagos.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'int-3',
    name: 'WhatsApp Business',
    description: 'Envío automático de mensajes a tus clientes.',
    iconSvg: 'message-circle',
    status: 'active',
    requiresManualSetup: true,
    setupInstructions: 'Configura tu número de WhatsApp Business API.',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

// --- Mock Payment Config ---

export const mockPaymentConfig: GlobalPaymentConfig = {
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
    enabled: true,
    accountHolder: 'MINIMENU SAS',
    accountNumber: '3001234567',
    instructions: 'Realiza la transferencia al número indicado y envía el comprobante por WhatsApp.',
    qrCodeUrl: null
  },
  bancolombia: {
    enabled: true,
    accountHolder: 'MINIMENU SAS',
    accountNumber: '123-456789-01',
    instructions: 'Realiza la transferencia desde tu app Bancolombia y envía el comprobante.',
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
    enabled: true,
    instructions: 'Serás redirigido a Hotmart para completar tu suscripción de forma segura.'
  }
};

// --- Mock Categories ---

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    businessId: 'biz-1',
    name: 'Entradas',
    description: 'Deliciosas entradas para compartir',
    icon: '🥗',
    order: 1,
    isActive: true,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'cat-2',
    businessId: 'biz-1',
    name: 'Platos Principales',
    description: 'Nuestros platos estrella',
    icon: '🍽️',
    order: 2,
    isActive: true,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'cat-3',
    businessId: 'biz-1',
    name: 'Bebidas',
    description: 'Refrescantes bebidas',
    icon: '🥤',
    order: 3,
    isActive: true,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  }
];

// --- Mock Products ---

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    businessId: 'biz-1',
    categoryId: 'cat-1',
    name: 'Empanadas (4 uds)',
    description: 'Crujientes empanadas rellenas de carne o pollo.',
    price: 12000,
    currency: 'COP',
    image: null,
    isAvailable: true,
    isFeatured: true,
    order: 1,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'prod-2',
    businessId: 'biz-1',
    categoryId: 'cat-1',
    name: 'Guacamole con Totopos',
    description: 'Guacamole fresco con totopos crujientes.',
    price: 15000,
    currency: 'COP',
    image: null,
    isAvailable: true,
    isFeatured: false,
    order: 2,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'prod-3',
    businessId: 'biz-1',
    categoryId: 'cat-2',
    name: 'Bandeja Paisa',
    description: 'Tradicional bandeja paisa con todos sus ingredientes.',
    price: 35000,
    currency: 'COP',
    image: null,
    isAvailable: true,
    isFeatured: true,
    order: 1,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'prod-4',
    businessId: 'biz-1',
    categoryId: 'cat-2',
    name: 'Carne Asada',
    description: 'Jugosa carne asada con papas y ensalada.',
    price: 28000,
    currency: 'COP',
    image: null,
    isAvailable: true,
    isFeatured: false,
    order: 2,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'prod-5',
    businessId: 'biz-1',
    categoryId: 'cat-3',
    name: 'Limonada Natural',
    description: 'Refrescante limonada natural con hielo.',
    price: 5000,
    currency: 'COP',
    image: null,
    isAvailable: true,
    isFeatured: false,
    order: 1,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  }
];

// --- Mock Orders ---

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    businessId: 'biz-1',
    customerId: null,
    customerName: 'Pedro Martínez',
    customerPhone: '+57 304 567 8901',
    customerEmail: 'pedro@email.com',
    items: [
      {
        productId: 'prod-3',
        productName: 'Bandeja Paisa',
        quantity: 2,
        unitPrice: 35000,
        totalPrice: 70000,
        notes: null
      },
      {
        productId: 'prod-5',
        productName: 'Limonada Natural',
        quantity: 2,
        unitPrice: 5000,
        totalPrice: 10000,
        notes: 'Sin hielo'
      }
    ],
    total: 80000,
    currency: 'COP',
    status: 'pending',
    notes: 'Mesa 5',
    createdAt: '2024-06-15T12:30:00Z',
    updatedAt: '2024-06-15T12:30:00Z'
  },
  {
    id: 'ord-2',
    businessId: 'biz-1',
    customerId: null,
    customerName: 'Laura Sánchez',
    customerPhone: '+57 305 678 9012',
    customerEmail: 'laura@email.com',
    items: [
      {
        productId: 'prod-1',
        productName: 'Empanadas (4 uds)',
        quantity: 1,
        unitPrice: 12000,
        totalPrice: 12000,
        notes: null
      }
    ],
    total: 12000,
    currency: 'COP',
    status: 'preparing',
    notes: 'Para llevar',
    createdAt: '2024-06-15T12:15:00Z',
    updatedAt: '2024-06-15T12:20:00Z'
  }
];

// --- Mock AI Config ---

export const mockAIConfig: AIConfig = {
  systemPrompt: `Eres un asistente virtual amable y profesional para MINIMENU, una plataforma de menús digitales para restaurantes.

Tu objetivo es ayudar a los clientes con:
- Información sobre menús y productos
- Horarios de atención
- Proceso de pedidos
- Reservas
- Cualquier duda sobre los servicios

Siempre responde de manera cordial y útil. Si no conoces la respuesta, indícale al cliente que puede contactar directamente al restaurante.

IMPORTANTE: Mantén un tono profesional pero cercano, y adapta tus respuestas según el contexto del negocio.`,
  models: [],
  temperature: 0.7,
  maxTokens: 2048,
  knowledgeSources: [
    'https://minimenu.com/ayuda',
    'https://minimenu.com/faq'
  ],
  activeModelId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// --- Mock Library Items ---

export const mockLibraryItems: LibraryItem[] = [
  {
    id: 'lib-1',
    name: 'Manual de Usuario',
    type: 'pdf',
    url: '/library/manual-usuario.pdf',
    description: 'Guía completa para usar la plataforma MINIMENU',
    keywords: ['manual', 'guía', 'usuario', 'instrucciones'],
    size: 2048000,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'lib-2',
    name: 'Video Tutorial - Configuración Inicial',
    type: 'video',
    url: '/library/tutorial-config.mp4',
    description: 'Video paso a paso para configurar tu menú digital',
    keywords: ['tutorial', 'video', 'configuración', 'inicio'],
    size: 15728640,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

// --- Mock AI Metrics ---

export const mockAIMetrics: AIMetrics = {
  totalConversations: 1250,
  ventas: 450,
  soporte: 320,
  nuevos: 280,
  otros: 200
};
