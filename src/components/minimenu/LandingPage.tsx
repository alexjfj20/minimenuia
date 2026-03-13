'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Utensils,
  QrCode,
  ShoppingCart,
  BarChart3,
  Check,
  Star,
  ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

interface Plan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string;
  isPopular: boolean;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans from API on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/public/plans');
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          setPlans(data.data);
        } else {
          // Fallback to default plans if API fails or returns empty
          setPlans(getDefaultPlans());
          console.warn('[LandingPage] Using fallback plans');
        }
      } catch (err) {
        console.error('[LandingPage] Error fetching plans:', err);
        setError('No se pudieron cargar los planes');
        setPlans(getDefaultPlans());
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Default plans as fallback
  const getDefaultPlans = (): Plan[] => [
    {
      name: 'Gratis',
      price: 0,
      period: 'mes',
      description: 'Para comenzar',
      features: '1 Usuario,50 Productos,5 Categorías,Menú digital con QR,Pedidos por WhatsApp',
      isPopular: false
    },
    {
      name: 'Básico',
      price: 29000,
      period: 'mes',
      description: 'Para pequeños negocios',
      features: '3 Usuarios,200 Productos,15 Categorías,Branding personalizado,Soporte prioritario',
      isPopular: false
    },
    {
      name: 'Profesional',
      price: 59000,
      period: 'mes',
      description: 'Para negocios en crecimiento',
      features: '10 Usuarios,Productos ilimitados,Múltiples sedes,Analíticas avanzadas,Soporte 24/7',
      isPopular: true
    }
  ];

  // Format price for display
  const formatPrice = (price: number, period: string): string => {
    if (price === 0) return 'Gratis';
    return `$${price.toLocaleString('es-CO')}/${period === 'MONTHLY' ? 'mes' : 'año'}`;
  };

  // Parse features string to array
  const parseFeatures = (features: string): string[] => {
    if (!features) return [];
    return features.split(',').map(f => f.trim()).filter(f => f.length > 0);
  };
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
              onClick={() => {
                const element = document.getElementById('hero-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Inicio
            </button>
            <button
              onClick={() => window.open('/?view=features', '_blank')}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Características
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('pricing-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Precios
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('footer-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
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
      <section id="hero-section" className="py-20 px-4 bg-gradient-to-br from-purple-50 to-white">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
            ✨ Plataforma #1 en Colombia
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Digitaliza tu negocio con{' '}
            <span className="text-purple-600">MINIMENU</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Crea tu menú digital en minutos. Genera códigos QR, recibe pedidos online 
            y lleva el control de tu negocio desde cualquier lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={onRegister}
              className="bg-purple-600 hover:bg-purple-700 text-lg px-8"
            >
              Regístrate ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Ver demo
            </Button>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="mt-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 p-8">
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-12 h-12 text-purple-600" />
                </div>
                <p className="text-gray-500">Vista previa del panel de administración</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para dominar el mercado digital
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas poderosas y fáciles de usar para hacer crecer tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planes de suscripción para tu negocio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando planes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, idx) => (
                <Card
                  key={plan.id || idx}
                  className={`relative hover:shadow-lg transition-shadow ${
                    plan.isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-purple-600">
                        <Star className="w-3 h-3 mr-1" />
                        Más Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{formatPrice(plan.price, plan.period)}</span>
                    </div>
                    <ul className="space-y-3 mb-6 text-left">
                      {parseFeatures(plan.features).map((feature, fidx) => (
                        <li key={fidx} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        plan.isPopular
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      onClick={onRegister}
                    >
                      Regístrate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-purple-600">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para digitalizar tu negocio?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Únete a más de 1,000 negocios que ya están usando MINIMENU
          </p>
          <Button 
            size="lg"
            onClick={onRegister}
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8"
          >
            Comienza gratis ahora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer-section" className="bg-gray-900 text-gray-400 py-12 px-4 mt-auto">
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
                <li><button onClick={() => window.open('/?view=features', '_blank')} className="hover:text-white transition-colors">Características</button></li>
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
