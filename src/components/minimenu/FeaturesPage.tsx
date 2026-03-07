'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Utensils,
  QrCode,
  ShoppingCart,
  BarChart3,
  Smartphone,
  Zap,
  Shield,
  Clock,
  Globe,
  MessageSquare,
  CreditCard,
  Users,
  ChevronRight,
  ArrowRight,
  Check,
  Star,
  TrendingUp,
  Package,
  Bell,
  Settings
} from 'lucide-react';

interface FeaturesPageProps {
  onRegister: () => void;
  onLogin: () => void;
}

const mainFeatures = [
  {
    icon: <Utensils className="w-8 h-8 text-white" />,
    title: 'Menú Digital Profesional',
    subtitle: 'Tu menú, siempre actualizado',
    description: 'Crea un menú digital atractivo y profesional que tus clientes pueden explorar desde cualquier dispositivo. Actualiza precios, productos y descripciones en tiempo real sin necesidad de reimprimir.',
    benefits: [
      'Actualizaciones instantáneas sin costos de impresión',
      'Diseño responsive para móviles y tablets',
      'Categorías ilimitadas organizadas a tu gusto',
      'Imágenes de alta calidad para cada producto'
    ],
    color: 'bg-purple-600'
  },
  {
    icon: <QrCode className="w-8 h-8 text-white" />,
    title: 'Código QR Personalizado',
    subtitle: 'Un escaneo, infinitas posibilidades',
    description: 'Genera códigos QR únicos para tu negocio. Colócalos en mesas, mostradores o material promocional. Tus clientes escanean y acceden instantáneamente a tu menú completo.',
    benefits: [
      'QR personalizado con tu logo y colores',
      'Sin necesidad de descargar apps',
      'Acceso instantáneo al menú completo',
      'Múltiples QR para diferentes ubicaciones'
    ],
    color: 'bg-blue-600'
  },
  {
    icon: <ShoppingCart className="w-8 h-8 text-white" />,
    title: 'Sistema de Pedidos Online',
    subtitle: 'Vende 24/7 sin interrupciones',
    description: 'Recibe pedidos directamente desde tu menú digital. Tus clientes ordenan cuando quieran, tú recibes la notificación instantáneamente y gestionas todo desde un panel intuitivo.',
    benefits: [
      'Pedidos las 24 horas del día',
      'Notificaciones en tiempo real',
      'Gestión de pedidos simplificada',
      'Historial completo de transacciones'
    ],
    color: 'bg-green-600'
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-white" />,
    title: 'Análisis y Reportes',
    subtitle: 'Datos que impulsan decisiones',
    description: 'Conoce tu negocio al detalle. Descubre tus productos más vendidos, los horarios pico, el comportamiento de tus clientes y toma decisiones basadas en datos reales.',
    benefits: [
      'Productos más y menos vendidos',
      'Análisis de horarios de mayor demanda',
      'Métricas de clientes recurrentes',
      'Exportación de reportes en PDF y Excel'
    ],
    color: 'bg-orange-600'
  }
];

const additionalFeatures = [
  {
    icon: <Smartphone className="w-6 h-6 text-purple-600" />,
    title: '100% Responsive',
    description: 'Funciona perfectamente en cualquier dispositivo: móviles, tablets y computadores.'
  },
  {
    icon: <Zap className="w-6 h-6 text-purple-600" />,
    title: 'Ultra Rápido',
    description: 'Carga en menos de 2 segundos. Tus clientes no esperan, ordenan.'
  },
  {
    icon: <Shield className="w-6 h-6 text-purple-600" />,
    title: 'Seguridad Garantizada',
    description: 'Encriptación SSL y respaldos automáticos. Tus datos siempre protegidos.'
  },
  {
    icon: <Clock className="w-6 h-6 text-purple-600" />,
    title: 'Actualizaciones Automáticas',
    description: 'Mejoras y nuevas funciones sin costo adicional ni interrupciones.'
  },
  {
    icon: <Globe className="w-6 h-6 text-purple-600" />,
    title: 'Sin Descargas',
    description: 'Tus clientes acceden directamente desde el navegador. Sin fricción.'
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-purple-600" />,
    title: 'Chat Integrado',
    description: 'Comunícate con tus clientes en tiempo real para resolver dudas.'
  },
  {
    icon: <CreditCard className="w-6 h-6 text-purple-600" />,
    title: 'Pagos Online',
    description: 'Integra Nequi, Daviplata, Bancolombia y más métodos de pago.'
  },
  {
    icon: <Users className="w-6 h-6 text-purple-600" />,
    title: 'Múltiples Usuarios',
    description: 'Crea cuentas para tu equipo con diferentes niveles de acceso.'
  },
  {
    icon: <Package className="w-6 h-6 text-purple-600" />,
    title: 'Control de Inventario',
    description: 'Gestiona tu stock y recibe alertas cuando los productos se agoten.'
  },
  {
    icon: <Bell className="w-6 h-6 text-purple-600" />,
    title: 'Notificaciones Push',
    description: 'Alertas instantáneas en tu celular por cada nuevo pedido.'
  },
  {
    icon: <Settings className="w-6 h-6 text-purple-600" />,
    title: 'Personalización Total',
    description: 'Colores, logos, fuentes y estilos que reflejan tu marca.'
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
    title: 'Promociones y Descuentos',
    description: 'Crea ofertas especiales, combos y códigos promocionales.'
  }
];

const testimonials = [
  {
    quote: 'Aumentamos las ventas un 40% en el primer mes. Los clientes aman escanear el QR y ver el menú con fotos.',
    author: 'María García',
    business: 'Restaurante La Esquina',
    rating: 5
  },
  {
    quote: 'Ya no imprimo menús cada 3 meses. Actualizo precios en segundos desde mi celular. Un ahorro increíble.',
    author: 'Carlos Rodríguez',
    business: 'Pizzería Don Carlos',
    rating: 5
  },
  {
    quote: 'El sistema de pedidos online cambió todo. Ahora recibimos órdenes incluso cuando el local está cerrado.',
    author: 'Ana Martínez',
    business: 'Café Delicias',
    rating: 5
  }
];

const stats = [
  { value: '1,000+', label: 'Negocios activos' },
  { value: '50,000+', label: 'Pedidos procesados' },
  { value: '99.9%', label: 'Uptime garantizado' },
  { value: '24/7', label: 'Soporte técnico' }
];

export function FeaturesPage({ onRegister, onLogin }: FeaturesPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MINIMENU</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => window.open('/', '_self')}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Inicio
            </button>
            <button
              className="text-purple-600 font-medium"
            >
              Características
            </button>
            <button
              onClick={() => window.open('/#pricing-section', '_self')}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Precios
            </button>
            <button
              onClick={() => window.open('/#footer-section', '_self')}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Contacto
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>
              Iniciar Sesión
            </Button>
            <Button
              onClick={onRegister}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Regístrate
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            🚀 Potencia tu negocio
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Características que transforman tu negocio
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Descubre cómo MINIMENU puede ayudarte a aumentar ventas, reducir costos y ofrecer una experiencia excepcional a tus clientes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onRegister}
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8"
            >
              Comienza gratis ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white/10 text-lg px-8"
              onClick={onLogin}
            >
              Ver demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-gray-50 border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl md:text-4xl font-bold text-purple-600">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              ✨ Funcionalidades principales
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas diseñadas para hacer tu vida más fácil y tu negocio más rentable
            </p>
          </div>

          <div className="space-y-16">
            {mainFeatures.map((feature, idx) => (
              <div
                key={idx}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${
                  idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                      <p className="text-purple-600 font-medium">{feature.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <div className={`aspect-video ${feature.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <div className="text-white/80 text-center p-8">
                      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {feature.icon}
                      </div>
                      <p className="text-lg font-medium">Vista previa de {feature.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              🎯 Y mucho más
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades adicionales incluidas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cada detalle está pensado para maximizar tu productividad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow border-0 bg-white">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              💬 Testimonios
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Miles de negocios ya transformaron su manera de vender
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="bg-gray-50 border-0">
                <CardContent className="pt-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Únete a más de 1,000 negocios que ya están usando MINIMENU para crecer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onRegister}
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8"
            >
              Comienza tu prueba gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white/10 text-lg px-8"
              onClick={onLogin}
            >
              Habla con un asesor
            </Button>
          </div>
          <p className="text-purple-200 mt-6 text-sm">
            ✓ Sin tarjeta de crédito &nbsp; ✓ Configuración en 5 minutos &nbsp; ✓ Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 mt-auto">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">MINIMENU</span>
              </div>
              <p className="text-sm">
                La plataforma líder en menús digitales para negocios en Colombia.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-purple-400 cursor-pointer">Características</span></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integraciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos de uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 MINIMENU. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
