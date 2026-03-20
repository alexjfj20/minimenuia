'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  CreditCard,
  MapPin,
  Truck,
  Calculator,
  Megaphone,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ExternalLink,
  Mail,
  CheckCircle2,
  Zap,
  Users,
  Rocket
} from 'lucide-react';
import { Utensils } from 'lucide-react';

interface IntegracionItem {
  id: number;
  nombre: string;
  descripcion: string;
  icono: 'whatsapp' | 'mercadopago' | 'googlemaps' | 'payu' | 'instagram' | 'rappi' | 'pedidosya' | 'siigo' | 'alegra';
  categoria: 'Pagos' | 'Comunicación' | 'Delivery' | 'Contabilidad' | 'Marketing' | 'Mapas';
  estado: 'disponible' | 'proximamente';
  botonTexto: string;
  botonLink: string;
}

interface FaqItem {
  id: number;
  pregunta: string;
  respuesta: string;
}

const integracionesData: IntegracionItem[] = [
  {
    id: 1,
    nombre: 'WhatsApp Business',
    descripcion: 'Recibe pedidos directamente en WhatsApp. Notificaciones automáticas y atención al cliente integrada para tu negocio.',
    icono: 'whatsapp',
    categoria: 'Comunicación',
    estado: 'disponible',
    botonTexto: 'Conectar ahora',
    botonLink: 'mailto:soporte@minimenu.com?subject=Configurar WhatsApp Business'
  },
  {
    id: 2,
    nombre: 'Mercado Pago',
    descripcion: 'Acepta pagos con tarjeta, efectivo y billetera digital. Integración completa con la pasarela líder en Latinoamérica.',
    icono: 'mercadopago',
    categoria: 'Pagos',
    estado: 'disponible',
    botonTexto: 'Conectar ahora',
    botonLink: 'mailto:soporte@minimenu.com?subject=Configurar Mercado Pago'
  },
  {
    id: 3,
    nombre: 'Google Maps',
    descripcion: 'Haz visible tu negocio en Google Maps. Los clientes te encuentran fácilmente y llegan con indicaciones paso a paso.',
    icono: 'googlemaps',
    categoria: 'Mapas',
    estado: 'disponible',
    botonTexto: 'Conectar ahora',
    botonLink: 'mailto:soporte@minimenu.com?subject=Configurar Google Maps'
  },
  {
    id: 4,
    nombre: 'PayU',
    descripcion: 'Procesa pagos online de forma segura. Acepta todas las tarjetas colombianas y pagos en efectivo vía PSE.',
    icono: 'payu',
    categoria: 'Pagos',
    estado: 'disponible',
    botonTexto: 'Conectar ahora',
    botonLink: 'mailto:soporte@minimenu.com?subject=Configurar PayU'
  },
  {
    id: 5,
    nombre: 'Instagram Shopping',
    descripcion: 'Etiqueta tus productos en Instagram. Convierte tus publicaciones en puntos de venta directos desde tu perfil.',
    icono: 'instagram',
    categoria: 'Marketing',
    estado: 'proximamente',
    botonTexto: 'Notificarme',
    botonLink: 'mailto:soporte@minimenu.com?subject=Notificar Instagram Shopping'
  },
  {
    id: 6,
    nombre: 'Rappi',
    descripcion: 'Sincroniza tu menú con Rappi. Gestiona pedidos de múltiples canales desde una sola plataforma integrada.',
    icono: 'rappi',
    categoria: 'Delivery',
    estado: 'proximamente',
    botonTexto: 'Notificarme',
    botonLink: 'mailto:soporte@minimenu.com?subject=Notificar Rappi'
  },
  {
    id: 7,
    nombre: 'PedidosYa',
    descripcion: 'Conecta tu menú con PedidosYa. Amplía tu alcance y gestiona todos los pedidos desde MINIMENU.',
    icono: 'pedidosya',
    categoria: 'Delivery',
    estado: 'proximamente',
    botonTexto: 'Notificarme',
    botonLink: 'mailto:soporte@minimenu.com?subject=Notificar PedidosYa'
  },
  {
    id: 8,
    nombre: 'Siigo',
    descripcion: 'Facturación electrónica automática. Sincroniza ventas y genera facturas legales colombianas sin esfuerzo.',
    icono: 'siigo',
    categoria: 'Contabilidad',
    estado: 'proximamente',
    botonTexto: 'Notificarme',
    botonLink: 'mailto:soporte@minimenu.com?subject=Notificar Siigo'
  },
  {
    id: 9,
    nombre: 'Alegra',
    descripcion: 'Contabilidad en la nube integrada. Controla ingresos, gastos e impuestos desde tu panel MINIMENU.',
    icono: 'alegra',
    categoria: 'Contabilidad',
    estado: 'proximamente',
    botonTexto: 'Notificarme',
    botonLink: 'mailto:soporte@minimenu.com?subject=Notificar Alegra'
  }
];

const faqData: FaqItem[] = [
  {
    id: 1,
    pregunta: '¿Cómo activo una integración?',
    respuesta: 'Haz clic en "Conectar ahora" en la integración que deseas activar. Nuestro equipo de soporte te guiará paso a paso para configurar la integración en menos de 24 horas. Algunas integraciones pueden requerir que tengas una cuenta activa en el servicio externo.'
  },
  {
    id: 2,
    pregunta: '¿Tiene costo adicional?',
    respuesta: 'Las integraciones disponibles en tu plan se incluyen sin costo adicional. Algunas integraciones de terceros pueden tener sus propias tarifas según el proveedor. Te informaremos claramente antes de activar cualquier servicio con costo.'
  },
  {
    id: 3,
    pregunta: '¿Puedo usar varias integraciones al mismo tiempo?',
    respuesta: '¡Sí! Puedes activar todas las integraciones disponibles en tu plan simultáneamente. De hecho, recomendamos combinar integraciones de Pagos, Comunicación y Mapas para maximizar el potencial de tu negocio.'
  },
  {
    id: 4,
    pregunta: '¿Qué pasa si tengo un problema con una integración?',
    respuesta: 'Nuestro equipo de soporte técnico está disponible 24/7 para ayudarte. Si experimentas algún problema, contáctanos a soporte@minimenu.com o através del chat en tu panel. Gestionaremos directamente con el proveedor si es necesario.'
  }
];

function getIconoComponent(icono: IntegracionItem['icono']) {
  switch (icono) {
    case 'whatsapp':
      return <MessageCircle className="w-12 h-12 text-green-500" />;
    case 'mercadopago':
      return <CreditCard className="w-12 h-12 text-blue-500" />;
    case 'googlemaps':
      return <MapPin className="w-12 h-12 text-red-500" />;
    case 'payu':
      return <CreditCard className="w-12 h-12 text-orange-500" />;
    case 'instagram':
      return <Megaphone className="w-12 h-12 text-pink-500" />;
    case 'rappi':
      return <Truck className="w-12 h-12 text-orange-400" />;
    case 'pedidosya':
      return <Truck className="w-12 h-12 text-red-400" />;
    case 'siigo':
      return <Calculator className="w-12 h-12 text-blue-600" />;
    case 'alegra':
      return <Calculator className="w-12 h-12 text-green-600" />;
    default:
      return <Zap className="w-12 h-12 text-gray-500" />;
  }
}

function getCategoriaColor(categoria: IntegracionItem['categoria']): string {
  switch (categoria) {
    case 'Pagos':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Comunicación':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Delivery':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Contabilidad':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Marketing':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'Mapas':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

const categorias: (IntegracionItem['categoria'] | 'Todas')[] = [
  'Todas',
  'Pagos',
  'Comunicación',
  'Delivery',
  'Contabilidad',
  'Marketing',
  'Mapas'
];

export default function IntegracionesPage() {
  const [filtroActivo, setFiltroActivo] = useState<IntegracionItem['categoria'] | 'Todas'>('Todas');
  const [faqAbierto, setFaqAbierto] = useState<number | null>(null);

  const integracionesFiltradas = filtroActivo === 'Todas'
    ? integracionesData
    : integracionesData.filter((i) => i.categoria === filtroActivo);

  const handleVolverInicio = () => {
    window.location.href = '/';
  };

  const handleContactoSoporte = () => {
    window.location.href = 'mailto:soporte@minimenu.com?subject=Consulta sobre integraciones';
  };

  const handleComenzarGratis = () => {
    window.location.href = '/?view=register';
  };

  const handleSolicitarIntegracion = () => {
    window.location.href = 'mailto:soporte@minimenu.com?subject=Solicitud de nueva integración';
  };

  const toggleFaq = (id: number) => {
    setFaqAbierto(faqAbierto === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar Simple */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MINIMENU</span>
          </div>
          <Button variant="outline" onClick={handleVolverInicio}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            🔗 Conecta tu negocio con las mejores herramientas
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Integraciones que potencian tu MINIMENU
          </h1>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Conecta MINIMENU con las plataformas más populares de pagos, delivery,
            contabilidad y marketing. Todo sincronizado en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => {
                const element = document.getElementById('integraciones-grid');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-8"
            >
              Ver todas las integraciones
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleContactoSoporte}
              className="border-white text-white hover:bg-white/10 text-lg px-8"
            >
              <Mail className="w-5 h-5 mr-2" />
              Hablar con soporte
            </Button>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-12 px-4 bg-white border-b">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">+1.000</p>
              <p className="text-gray-600 text-sm">negocios conectados</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">3</p>
              <p className="text-gray-600 text-sm">pasarelas disponibles</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">+10</p>
              <p className="text-gray-600 text-sm">integraciones en ruta</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-7 h-7 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-gray-600 text-sm">soporte para configuración</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros de Categoría */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {categorias.map((categoria) => (
              <Button
                key={categoria}
                variant={filtroActivo === categoria ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroActivo(categoria)}
                className={
                  filtroActivo === categoria
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'hover:bg-purple-50'
                }
              >
                {categoria}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid de Tarjetas de Integración */}
      <section id="integraciones-grid" className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integracionesFiltradas.map((integracion) => (
              <Card
                key={integracion.id}
                className="hover:shadow-lg transition-shadow border-gray-200 bg-white"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center">
                      {getIconoComponent(integracion.icono)}
                    </div>
                    <Badge className={getCategoriaColor(integracion.categoria)}>
                      {integracion.categoria}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{integracion.nombre}</CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      integracion.estado === 'disponible'
                        ? 'w-fit bg-green-50 text-green-700 border-green-200'
                        : 'w-fit bg-gray-100 text-gray-600 border-gray-200'
                    }
                  >
                    {integracion.estado === 'disponible' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Disponible
                      </>
                    ) : (
                      <>
                        <Rocket className="w-3 h-3 mr-1" />
                        Próximamente
                      </>
                    )}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-sm mb-4">
                    {integracion.descripcion}
                  </CardDescription>
                  <Button
                    className={`w-full ${
                      integracion.estado === 'disponible'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    onClick={() => {
                      window.open(integracion.botonLink, '_blank');
                    }}
                  >
                    {integracion.botonTexto}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Informativo */}
      <section className="py-16 px-4 bg-white border-y">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 md:p-12 border border-purple-100">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
              ¿Cómo funcionan las integraciones en MINIMENU?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Elige tu integración</h3>
                <p className="text-gray-600 text-sm">
                  Selecciona la herramienta que quieres conectar de nuestro catálogo de integraciones.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Configuración guiada</h3>
                <p className="text-gray-600 text-sm">
                  Nuestro equipo te acompaña paso a paso para activar la integración en menos de 24h.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">¡Listo para usar!</h3>
                <p className="text-gray-600 text-sm">
                  Tu integración queda activa y sincronizada. Comienza a disfrutar de todas las funcionalidades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ de Integraciones */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
            Preguntas frecuentes sobre integraciones
          </h2>
          <div className="space-y-4">
            {faqData.map((faq) => (
              <Card key={faq.id} className="border-gray-200 bg-white">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.pregunta}</span>
                  {faqAbierto === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {faqAbierto === faq.id && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.respuesta}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-purple-700">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Conecta tu negocio con el mundo
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Activa integraciones poderosas y lleva tu MINIMENU al siguiente nivel.
            Todo lo que necesitas, en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleComenzarGratis}
              className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-8"
            >
              Comenzar gratis
              <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleSolicitarIntegracion}
              className="border-white text-white hover:bg-white/10 text-lg px-8"
            >
              Solicitar integración
              <Mail className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-auto">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MINIMENU</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={handleVolverInicio}
                className="hover:text-white transition-colors"
              >
                Inicio
              </button>
              <a
                href="/?view=features"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Características
              </a>
              <a
                href="#pricing-section"
                className="hover:text-white transition-colors"
              >
                Precios
              </a>
              <a
                href="mailto:soporte@minimenu.com"
                className="hover:text-white transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-500">
            <p>© 2024 MINIMENU. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
