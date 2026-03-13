'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DeliveryConfig {
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
  deliveryEnabled: boolean;
  deliveryRadius: number | null;
}

export default function DeliveryConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [config, setConfig] = useState<DeliveryConfig>({
    deliveryFee: 3000,
    minimumOrder: 0,
    estimatedTime: '30-45 min',
    deliveryEnabled: true,
    deliveryRadius: null
  });

  // Load auth state and config on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get session from cookie
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success && data.data) {
          setIsAuthenticated(true);
          setBusinessId(data.data.businessId);
          
          // Load config
          if (data.data.businessId) {
            loadConfig(data.data.businessId);
          }
        } else {
          // Not authenticated, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('[Delivery Config] Auth error:', error);
        router.push('/');
      }
    };

    initAuth();
  }, []);

  const loadConfig = async (bid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/delivery-config?businessId=${bid}`);
      const data = await response.json();

      if (data.success && data.data) {
        setConfig(data.data);
      } else {
        setMessage({ type: 'error', text: 'Error al cargar la configuración' });
      }
    } catch (error) {
      console.error('[Delivery Config] Error loading:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessId) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/delivery-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessId,
          deliveryFee: config.deliveryFee,
          minimumOrder: config.minimumOrder,
          estimatedTime: config.estimatedTime,
          deliveryEnabled: config.deliveryEnabled,
          deliveryRadius: config.deliveryRadius
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (error) {
      console.error('[Delivery Config] Error saving:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Domicilio</h1>
          <p className="text-gray-600 mt-1">Configura los parámetros para los pedidos a domicilio</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Config Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Delivery Enabled Toggle */}
          <div className="flex items-center justify-between pb-6 border-b">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Habilitar servicio a domicilio
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Activa o desactiva la opción de pedidos a domicilio en el menú público
              </p>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, deliveryEnabled: !prev.deliveryEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.deliveryEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.deliveryEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Delivery Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Costo de envío ($)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={config.deliveryFee}
              onChange={(e) => setConfig(prev => ({ ...prev, deliveryFee: Number(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading || saving}
            />
            <p className="text-sm text-gray-500 mt-1">
              Valor que se cobrará por el servicio de domicilio
            </p>
          </div>

          {/* Minimum Order */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Pedido mínimo ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={config.minimumOrder}
              onChange={(e) => setConfig(prev => ({ ...prev, minimumOrder: Number(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading || saving}
            />
            <p className="text-sm text-gray-500 mt-1">
              Valor mínimo del pedido para aceptar domicilio (0 = sin mínimo)
            </p>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tiempo estimado de entrega
            </label>
            <input
              type="text"
              placeholder="30-45 min"
              value={config.estimatedTime}
              onChange={(e) => setConfig(prev => ({ ...prev, estimatedTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading || saving}
            />
            <p className="text-sm text-gray-500 mt-1">
              Tiempo que se muestra al cliente (ej: "30-45 min", "40-60 min")
            </p>
          </div>

          {/* Delivery Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Radio de cobertura (km) - Opcional
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={config.deliveryRadius || ''}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                deliveryRadius: e.target.value ? Number(e.target.value) : null 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: 5"
              disabled={loading || saving}
            />
            <p className="text-sm text-gray-500 mt-1">
              Distancia máxima de cobertura en kilómetros (dejar vacío = sin límite)
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar Configuración'
              )}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Información</h3>
              <p className="text-sm text-blue-700 mt-1">
                Esta configuración se aplicará a todos los pedidos a domicilio de tu restaurante. 
                Si deshabilitas el servicio, los clientes solo podrán hacer pedidos para recoger en el restaurante.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
