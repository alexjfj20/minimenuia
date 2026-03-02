'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Clock,
  MapPin,
  Phone,
  Instagram,
  Facebook,
  MessageCircle,
  Search,
  X,
  Check,
  Leaf,
  Flame,
  Star,
  Truck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  stock: number;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  requiereEmpaque?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

// --- Payment Method Config Interface ---
interface PaymentMethodConfig {
  id: string;
  name: string;
  icon: string;
  phone: string;
  accountHolder: string;
  qrImage: string | null;
  enabled: boolean;
}

interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  address: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  iva: number;
  empaque: number;
  valorEmpaqueUnitario?: number;
  domicilio?: number;
  impoconsumo?: number;
  // Propina Voluntaria
  tipEnabled?: boolean;
  tipPercentageDefault?: number;
  tipOnlyOnPremise?: boolean;
  // Métodos de Pago
  paymentMethods?: PaymentMethodConfig[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// ============================================================================
// COMPONENTS
// ============================================================================

function MenuItemCard({
  item,
  onAddToCart
}: {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-200 hover:shadow-lg group',
      !item.isAvailable && 'opacity-60'
    )}>
      <div className="relative h-40 bg-gray-100">
        {item.image && !imageError ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Utensils className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isFeatured && (
            <Badge className="bg-yellow-500 text-white text-xs">
              <Star className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          )}
          {item.isVegetarian && (
            <Badge className="bg-green-500 text-white text-xs">
              <Leaf className="w-3 h-3 mr-1" />
              Vegetariano
            </Badge>
          )}
          {item.isSpicy && (
            <Badge className="bg-red-500 text-white text-xs">
              <Flame className="w-3 h-3 mr-1" />
              Picante
            </Badge>
          )}
        </div>

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">
              No disponible
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
          <span className="font-bold text-purple-600 whitespace-nowrap">
            {formatPrice(item.price)}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
          {item.description}
        </p>
        
        <p className="text-xs text-gray-400 mb-3">
          Stock disponible: {item.stock ?? 0}
        </p>

        <Button
          onClick={() => onAddToCart(item)}
          disabled={!item.isAvailable || (item.stock ?? 0) <= 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </CardContent>
    </Card>
  );
}

function CartSidebar({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  restaurant
}: {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  restaurant: RestaurantInfo;
}) {
  // Tab state: 'restaurant' or 'delivery'
  const [orderMode, setOrderMode] = useState<'restaurant' | 'delivery'>('restaurant');
  
  // Delivery form state
  const [deliveryForm, setDeliveryForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    department: '',
    notes: ''
  });
  
  // Collapsible sections
  const [showDeliveryForm, setShowDeliveryForm] = useState(true);
  const [showPaymentMethods, setShowPaymentMethods] = useState(true);
  
  // Selected payment method
  const [selectedPayment, setSelectedPayment] = useState<string>('cash');
  
  // Propina Voluntaria state
  const [tipApplied, setTipApplied] = useState(false);
  const [tipPercentage, setTipPercentage] = useState(restaurant.tipPercentageDefault ?? 10);
  const [tipCustomValue, setTipCustomValue] = useState<number | null>(null);
  
  // Constants from restaurant config
  const VALOR_EMPAQUE_UNITARIO = restaurant.valorEmpaqueUnitario ?? 500;
  const DOMICILIO_FEE = restaurant.domicilio ?? restaurant.empaque ?? 3000;
  const IMPOCONSUMO_RATE = (restaurant.impoconsumo ?? 8) / 100;
  
  // Tip configuration
  const TIP_ENABLED = restaurant.tipEnabled ?? false;
  const TIP_ONLY_ON_PREMISE = restaurant.tipOnlyOnPremise ?? true;
  const TIP_PERCENTAGE_DEFAULT = restaurant.tipPercentageDefault ?? 10;
  
  // Show tip selector only if:
  // 1. Tip is enabled
  // 2. Order is restaurant mode OR tip is not restricted to premise only
  const showTipSelector = TIP_ENABLED && (orderMode === 'restaurant' || !TIP_ONLY_ON_PREMISE);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const impoconsumo = useMemo(() => {
    return Math.round(subtotal * IMPOCONSUMO_RATE);
  }, [subtotal, IMPOCONSUMO_RATE]);

  // Dynamic empaque calculation: valor_unitario × cantidad de productos que requieren empaque
  const empaqueTotal = useMemo(() => {
    if (orderMode !== 'delivery') return 0;
    const cantidadProductosConEmpaque = items
      .filter(item => item.requiereEmpaque !== false) // Por defecto todos requieren empaque
      .reduce((sum, item) => sum + item.quantity, 0);
    return cantidadProductosConEmpaque * VALOR_EMPAQUE_UNITARIO;
  }, [items, orderMode, VALOR_EMPAQUE_UNITARIO]);

  const deliveryFee = useMemo(() => {
    return orderMode === 'delivery' ? DOMICILIO_FEE : 0;
  }, [orderMode, DOMICILIO_FEE]);

  // Tip calculation
  const tipAmount = useMemo(() => {
    if (!showTipSelector || !tipApplied) return 0;
    if (tipCustomValue !== null) return tipCustomValue;
    return Math.round(subtotal * (tipPercentage / 100));
  }, [showTipSelector, tipApplied, tipCustomValue, tipPercentage, subtotal]);

  const total = useMemo(() => {
    return subtotal + impoconsumo + deliveryFee + empaqueTotal + tipAmount;
  }, [subtotal, impoconsumo, deliveryFee, empaqueTotal, tipAmount]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Payment methods - usar los configurados en el perfil, filtrando solo los habilitados
  const paymentMethods = useMemo(() => {
    const configuredMethods = restaurant.paymentMethods?.filter(m => m.enabled) ?? [];
    // Si no hay métodos configurados, usar los por defecto
    if (configuredMethods.length === 0) {
      return [
        { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true }
      ] as PaymentMethodConfig[];
    }
    return configuredMethods;
  }, [restaurant.paymentMethods]);

  // Reset tip when order mode changes - use a callback instead of effect
  const handleOrderModeChange = (mode: 'restaurant' | 'delivery') => {
    setOrderMode(mode);
    // Reset tip when switching to delivery if tip is restricted to premise
    const newShowTipSelector = TIP_ENABLED && (mode === 'restaurant' || !TIP_ONLY_ON_PREMISE);
    if (!newShowTipSelector) {
      setTipApplied(false);
      setTipCustomValue(null);
      setTipPercentage(TIP_PERCENTAGE_DEFAULT);
    }
  };

  // WhatsApp order for restaurant
  const handleRestaurantOrder = () => {
    if (items.length === 0) return;

    const orderText = items
      .map(item => `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}`)
      .join('\n');

    const tipLine = tipAmount > 0 ? `Propina Voluntaria: ${formatPrice(tipAmount)}\n` : '';

    const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPayment);
    const paymentMethodName = selectedPaymentMethod?.name || 'No especificado';
    const paymentPhone = selectedPaymentMethod?.phone || '';
    const paymentHolder = selectedPaymentMethod?.accountHolder || '';

    const paymentInfo = paymentPhone || paymentHolder
      ? `💳 *Método de Pago:* ${paymentMethodName}\n${paymentPhone ? `📱 Número: ${paymentPhone}\n` : ''}${paymentHolder ? `👤 Titular: ${paymentHolder}\n` : ''}`
      : `💳 *Método de Pago:* ${paymentMethodName}\n`;

    const message = `🍽️ *PEDIDO EN RESTAURANTE*\n\n` +
      `${orderText}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Subtotal: ${formatPrice(subtotal)}\n` +
      `Impoconsumo (${restaurant.impoconsumo ?? 8}%): ${formatPrice(impoconsumo)}\n` +
      tipLine +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*TOTAL: ${formatPrice(total)}*\n\n` +
      paymentInfo +
      `¡Gracias por su pedido!`;

    const whatsappUrl = `https://wa.me/${restaurant.whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // WhatsApp order for delivery
  const handleDeliveryOrder = () => {
    if (items.length === 0) return;
    
    // Validate required fields
    if (!deliveryForm.name || !deliveryForm.phone || !deliveryForm.address || !deliveryForm.city || !deliveryForm.department) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const orderText = items
      .map(item => `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}`)
      .join('\n');

    const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPayment);
    const paymentMethodName = selectedPaymentMethod?.name || 'No especificado';
    const paymentPhone = selectedPaymentMethod?.phone || '';
    const paymentHolder = selectedPaymentMethod?.accountHolder || '';

    const empaqueLine = empaqueTotal > 0 ? `Empaque: ${formatPrice(empaqueTotal)}\n` : '';
    const tipLine = tipAmount > 0 ? `Propina Voluntaria: ${formatPrice(tipAmount)}\n` : '';
    
    const paymentInfo = paymentPhone || paymentHolder 
      ? `💳 *Método de Pago:* ${paymentMethodName}\n${paymentPhone ? `📱 Número: ${paymentPhone}\n` : ''}${paymentHolder ? `👤 Titular: ${paymentHolder}\n` : ''}`
      : `💳 *Método de Pago:* ${paymentMethodName}\n`;
    
    const message = `🛵 *PEDIDO A DOMICILIO*\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📍 *DATOS DE ENTREGA*\n` +
      `Nombre: ${deliveryForm.name}\n` +
      `Teléfono: ${deliveryForm.phone}\n` +
      `Dirección: ${deliveryForm.address}\n` +
      `Ciudad: ${deliveryForm.city}, ${deliveryForm.department}\n` +
      `${deliveryForm.notes ? `Notas: ${deliveryForm.notes}\n` : ''}` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `${orderText}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Subtotal: ${formatPrice(subtotal)}\n` +
      empaqueLine +
      `Impoconsumo (${restaurant.impoconsumo ?? 8}%): ${formatPrice(impoconsumo)}\n` +
      `Domicilio: ${formatPrice(deliveryFee)}\n` +
      tipLine +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*TOTAL: ${formatPrice(total)}*\n\n` +
      paymentInfo +
      `¡Gracias por su pedido!`;
    
    const whatsappUrl = `https://wa.me/${restaurant.whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Input change handler
  const handleInputChange = (field: string, value: string) => {
    setDeliveryForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b flex items-center justify-between bg-orange-500 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-semibold">Tu Pedido</h2>
            {totalItems > 0 && (
              <Badge className="bg-white/20 text-white ml-2">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - Restaurante / Domicilio */}
        <div className="flex-shrink-0 flex border-b">
          <button
            onClick={() => handleOrderModeChange('restaurant')}
            className={cn(
              'flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors',
              orderMode === 'restaurant'
                ? 'bg-gray-100 text-gray-900 border-b-2 border-orange-500'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            )}
          >
            <Utensils className="w-4 h-4" />
            Restaurante
          </button>
          <button
            onClick={() => handleOrderModeChange('delivery')}
            className={cn(
              'flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-l',
              orderMode === 'delivery'
                ? 'bg-gray-100 text-gray-900 border-b-2 border-orange-500'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            )}
          >
            <Truck className="w-4 h-4" />
            Domicilio
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Tu carrito está vacío</p>
              <p className="text-sm">Agrega productos del menú</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Items List */}
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-orange-600 font-medium">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  {orderMode === 'delivery' && empaqueTotal > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Empaque</span>
                      <span className="font-medium text-gray-900">{formatPrice(empaqueTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Impoconsumo ({restaurant.impoconsumo ?? 8}%)</span>
                    <span className="font-medium text-gray-900">{formatPrice(impoconsumo)}</span>
                  </div>
                  {orderMode === 'delivery' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Domicilio</span>
                      <span className="font-medium text-gray-900">{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">Propina Voluntaria</span>
                      <span className="font-medium text-green-600">{formatPrice(tipAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-lg text-orange-600">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Tip Selector - Propina Voluntaria */}
              {showTipSelector && (
                <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💚</span>
                      <span className="font-medium text-gray-900">Propina Voluntaria</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTipApplied(!tipApplied)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-full font-medium transition-colors',
                        tipApplied
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      )}
                    >
                      {tipApplied ? 'Activada' : 'Agregar'}
                    </button>
                  </div>

                  {tipApplied && (
                    <div className="space-y-3">
                      {/* Percentage buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {[5, 10, 15, 20].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setTipPercentage(pct);
                              setTipCustomValue(null);
                            }}
                            className={cn(
                              'px-4 py-2 text-sm rounded-lg border transition-colors',
                              tipPercentage === pct && tipCustomValue === null
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                            )}
                          >
                            {pct}%
                            <span className="text-xs ml-1 opacity-70">
                              ({formatPrice(Math.round(subtotal * pct / 100))})
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Custom amount */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Otro valor:</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="Personalizado"
                          value={tipCustomValue ?? ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTipCustomValue(val > 0 ? val : null);
                          }}
                          className="w-28 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {tipCustomValue !== null && (
                          <span className="text-sm text-green-600 font-medium">
                            = {formatPrice(tipCustomValue)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <p className="text-xs text-gray-500">
                        💡 La propina es voluntaria, no genera IVA y es un ingreso directo para el equipo.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Form (only for delivery mode) */}
              {orderMode === 'delivery' && (
                <div className="space-y-3 mb-4">
                  {/* Datos de Entrega */}
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <span className="font-medium text-gray-700">📍 Datos de Entrega</span>
                      {showDeliveryForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showDeliveryForm && (
                      <div className="p-4 space-y-3 bg-white">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Tu Nombre *</label>
                          <input
                            type="text"
                            value={deliveryForm.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Juan Pérez"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Tu Teléfono *</label>
                          <input
                            type="tel"
                            value={deliveryForm.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="+57 300 123 4567"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Dirección Completa *</label>
                          <input
                            type="text"
                            value={deliveryForm.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Calle 123 #45-67, Apto 201"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Ciudad *</label>
                            <input
                              type="text"
                              value={deliveryForm.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Bogotá"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Departamento *</label>
                            <input
                              type="text"
                              value={deliveryForm.department}
                              onChange={(e) => handleInputChange('department', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Cundinamarca"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Notas adicionales</label>
                          <textarea
                            value={deliveryForm.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            rows={2}
                            placeholder="Ej: Sin cebolla, extra salsa..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Método de Pago - Available for both Restaurant and Delivery modes */}
              <div className="mb-4">
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <span className="font-medium text-gray-700">💳 Método de Pago</span>
                    {showPaymentMethods ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showPaymentMethods && (
                    <div className="p-4 bg-white">
                      <div className="space-y-3">
                        {paymentMethods.map(method => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedPayment(method.id)}
                              className={cn(
                                'w-full px-4 py-3 rounded-lg flex flex-col transition-colors text-left',
                                selectedPayment === method.id
                                  ? 'bg-orange-100 border-2 border-orange-500'
                                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{method.icon}</span>
                                  <div>
                                    <span className="font-semibold text-gray-900">{method.name}</span>
                                    {method.phone && (
                                      <p className="text-xs text-gray-500">{method.phone}</p>
                                    )}
                                  </div>
                                </div>
                                {selectedPayment === method.id && (
                                  <Check className="w-5 h-5 text-orange-500" />
                                )}
                              </div>
                              {/* Mostrar info adicional cuando está seleccionado */}
                              {selectedPayment === method.id && method.accountHolder && (
                                <div className="mt-2 pt-2 border-t border-orange-200 text-xs text-gray-600">
                                  <p><strong>Titular:</strong> {method.accountHolder}</p>
                                </div>
                              )}
                              {/* Mostrar QR si está disponible */}
                              {selectedPayment === method.id && method.qrImage && (
                                <div className="mt-3 pt-3 border-t border-orange-200">
                                  <p className="text-xs text-gray-500 mb-2">Escanea para pagar:</p>
                                  <img 
                                    src={method.qrImage} 
                                    alt={`QR ${method.name}`}
                                    className="w-32 h-32 rounded-lg border mx-auto"
                                  />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}
        </div>

        {/* Fixed Action Buttons Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t bg-white p-4 space-y-3">
            {/* Primary Action Button */}
            <Button
              onClick={orderMode === 'restaurant' ? handleRestaurantOrder : handleDeliveryOrder}
              className="w-full bg-green-600 hover:bg-green-700 py-3 text-base"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {orderMode === 'restaurant' ? 'Pedir en Restaurante' : 'Pedir Domicilio'}
            </Button>
            
            {/* Secondary Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Seguir viendo
              </Button>
              <Button
                variant="outline"
                onClick={onClearCart}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Vaciar
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<string>('');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/menu/${slug}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // Map business data
          setRestaurant({
            id: data.data.business.id,
            name: data.data.business.name,
            slug: data.data.business.slug,
            description: data.data.business.description || '',
            logo: data.data.business.logo,
            primaryColor: data.data.business.primaryColor || '#8b5cf6',
            secondaryColor: data.data.business.secondaryColor || '#ffffff',
            phone: data.data.business.phone,
            address: data.data.business.address,
            whatsapp: data.data.business.phone?.replace(/[^0-9]/g, ''),
            openTime: '11:00',
            closeTime: '22:00',
            isOpen: true,
            iva: data.data.business.iva ?? 19,
            empaque: data.data.business.empaque ?? 3000,
            impoconsumo: data.data.business.impoconsumo ?? 8,
            valorEmpaqueUnitario: data.data.business.valorEmpaqueUnitario,
            domicilio: data.data.business.domicilio,
            // Propina Voluntaria
            tipEnabled: data.data.business.tipEnabled ?? false,
            tipPercentageDefault: data.data.business.tipPercentageDefault ?? 10,
            tipOnlyOnPremise: data.data.business.tipOnlyOnPremise ?? true,
            // Métodos de Pago
            paymentMethods: data.data.business.paymentMethods ?? [
              { id: 'nequi', name: 'Nequi', icon: '🟢', phone: '', accountHolder: '', qrImage: null, enabled: true },
              { id: 'brepb', name: 'BRE-B', icon: '🔵', phone: '', accountHolder: '', qrImage: null, enabled: false },
              { id: 'daviplata', name: 'Daviplata', icon: '🔴', phone: '', accountHolder: '', qrImage: null, enabled: false },
              { id: 'bancolombia', name: 'Bancolombia', icon: '🟡', phone: '', accountHolder: '', qrImage: null, enabled: false },
              { id: 'cash', name: 'Efectivo', icon: '💵', phone: '', accountHolder: '', qrImage: null, enabled: true }
            ]
          });
          
          // Map categories
          setCategories(data.data.categories || []);
          
          // Map products to menu items
          const items = (data.data.products || []).map((p: { id: string; name: string; description: string; price: number; category: string; available: boolean; featured: boolean; image: string | null; stock: number }) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            category: p.category,
            image: p.image,
            isAvailable: p.available,
            isFeatured: p.featured,
            stock: p.stock ?? 0
          }));
          setMenuItems(items);
          
          console.log('[Menu] Loaded', items.length, 'products from API');
        }
      } catch (error) {
        console.error('[Menu] Error loading menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Add to cart
  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    setLastAddedItem(item.name);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  }, []);

  // Update quantity
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando menú...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurante no encontrado</h1>
          <p className="text-gray-600">El menú que buscas no existe o ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span>{lastAddedItem} agregado al carrito</span>
        </div>
      )}

      {/* Header */}
      <header 
        className="sticky top-0 z-30 bg-white shadow-sm"
        style={{ borderTop: `4px solid ${restaurant.primaryColor}` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: restaurant.primaryColor }}
              >
                {restaurant.logo ? (
                  <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Utensils className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.openTime} - {restaurant.closeTime}</span>
                  {restaurant.isOpen ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">Abierto</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 text-xs">Cerrado</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Search & Cart */}
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en el menú..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 rounded-lg transition-colors"
                style={{ backgroundColor: restaurant.primaryColor }}
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {cartTotal > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {cartTotal}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-4 sm:hidden">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en el menú..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="sticky top-[88px] sm:top-[72px] z-20 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                !selectedCategory
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              style={{ backgroundColor: !selectedCategory ? restaurant.primaryColor : undefined }}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === category.name
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                style={{ backgroundColor: selectedCategory === category.name ? restaurant.primaryColor : undefined }}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron productos</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-purple-600 text-sm mt-2 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-2">{restaurant.name}</h3>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mt-1">
                <Phone className="w-4 h-4" />
                <span>{restaurant.phone}</span>
              </div>
            </div>

            <div className="flex gap-4">
              {restaurant.whatsapp && (
                <a
                  href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {restaurant.instagram && (
                <a
                  href={`https://instagram.com/${restaurant.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {restaurant.facebook && (
                <a
                  href={`https://facebook.com/${restaurant.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>Powered by MINIMENU • Menú Digital</p>
          </div>
        </div>
      </footer>

      {/* Mobile Cart Button */}
      {cartTotal > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 rounded-xl text-white font-semibold flex items-center justify-between shadow-lg"
            style={{ backgroundColor: restaurant.primaryColor }}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Ver pedido</span>
            </div>
            <span>{formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
          </button>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => {}}
        restaurant={restaurant}
      />
    </div>
  );
}
