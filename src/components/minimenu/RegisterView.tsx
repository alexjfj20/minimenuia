'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Utensils, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RegisterData } from '@/types';

interface RegisterViewProps {
  onRegister: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  onLogin: () => void;
}

type ModalState = 'hidden' | 'success' | 'error';

export function RegisterView({ onRegister, onBack, onLogin }: RegisterViewProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('hidden');
  const [modalMessage, setModalMessage] = useState<string>('');
  const { toast } = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await onRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        phone: formData.phone
      });
      
      setLoading(false);
      
      if (result.success) {
        setModalMessage('Tu cuenta y negocio han sido creados exitosamente. Serás redirigido a tu panel.');
        setModalState('success');
        toast({
          title: '¡Cuenta creada!',
          description: 'Tu cuenta ha sido creada exitosamente.',
        });
      } else {
        const errorMsg = result.error ?? 'Error al crear la cuenta. Por favor intenta nuevamente.';
        setError(errorMsg);
        setModalMessage(errorMsg);
        setModalState('error');
        toast({
          variant: 'destructive',
          title: 'Error al registrar',
          description: errorMsg,
        });
      }
    } catch (err) {
      setLoading(false);
      const errorMsg = 'Error de conexión. Por favor verifica tu conexión a internet e intenta nuevamente.';
      setError(errorMsg);
      setModalMessage(errorMsg);
      setModalState('error');
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: errorMsg,
      });
    }
  };

  const handleSuccessClose = () => {
    setModalState('hidden');
    window.location.href = '/?view=dashboard';
  };

  const handleErrorClose = () => {
    setModalState('hidden');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </button>
        </div>
      </header>

      {/* Register Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>
              Registra tu negocio y comienza a usar MINIMENU
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tu Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre del Negocio</Label>
                  <Input
                    id="businessName"
                    placeholder="Restaurante"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <button
                  onClick={onLogin}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Success Modal */}
      {modalState === 'success' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">¡Cuenta Creada!</h2>
              <p className="text-gray-600 mb-6">
                {modalMessage}
              </p>
              <Button
                onClick={handleSuccessClose}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Ir a mi Panel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Modal */}
      {modalState === 'error' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Error al Registrar</h2>
              <p className="text-gray-600 mb-6">
                {modalMessage}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleErrorClose}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={handleErrorClose}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Intentar de Nuevo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
