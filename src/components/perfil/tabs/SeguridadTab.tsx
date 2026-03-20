'use client';

import { FC, useState, useEffect } from 'react';
import type { UpdatePasswordPayload } from '@/types/perfil';
import { Loader2, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';

interface SeguridadTabProps {
  onUpdatePassword: (payload: UpdatePasswordPayload) => Promise<void>;
  isSaving: boolean;
}

export const SeguridadTab: FC<SeguridadTabProps> = ({ onUpdatePassword, isSaving }) => {
  const [formData, setFormData] = useState<UpdatePasswordPayload>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation states
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const pwd = formData.newPassword;
    setValidations({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    });
  }, [formData.newPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getPasswordStrength = () => {
    const score = Object.values(validations).filter(Boolean).length;
    if (formData.newPassword.length === 0) return { label: '', color: 'bg-gray-200', text: '' };
    if (score <= 2) return { label: 'Débil', color: 'bg-red-500 w-1/3', text: 'text-red-600' };
    if (score === 3) return { label: 'Media', color: 'bg-yellow-500 w-2/3', text: 'text-yellow-600' };
    return { label: 'Fuerte', color: 'bg-green-500 w-full', text: 'text-green-600' };
  };

  const isFormValid = Object.values(validations).every(Boolean) && formData.newPassword === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    await onUpdatePassword(formData);
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const strength = getPasswordStrength();

  return (
    <div className="space-y-8">
      {/* Cambiar Contraseña */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Cambiar Contraseña</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Contraseña Actual</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none transition-all pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none transition-all pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Strength Indicator */}
            {formData.newPassword.length > 0 && (
              <div className="pt-1">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                  <div className={`h-full transition-all duration-300 ${strength.color}`}></div>
                </div>
                <p className={`text-xs mt-1 font-medium ${strength.text}`}>
                  Seguridad: {strength.label}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg outline-none pr-12 ${
                  formData.confirmPassword.length > 0 && formData.newPassword !== formData.confirmPassword
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all'
                }`}
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword.length > 0 && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Requisitos */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Requisitos de la contraseña:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className={`flex items-center gap-2 ${validations.length ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.length ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${validations.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.uppercase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Al menos una mayúscula</span>
              </div>
              <div className={`flex items-center gap-2 ${validations.number ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.number ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Al menos un número</span>
              </div>
              <div className={`flex items-center gap-2 ${validations.special ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.special ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Al menos un carácter especial</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isSaving}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold w-full sm:w-auto transition-all ${
                !isFormValid || isSaving
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
              }`}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Actualizar Contraseña
            </button>
          </div>
        </form>
      </div>

      {/* Zona de Peligro */}
      <div className="bg-red-50/50 p-6 rounded-xl shadow-sm border border-red-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900">Cerrar todas las sesiones</h3>
            <p className="text-sm text-red-700 mt-1 mb-4">
              Se cerrará la sesión en todos los demás dispositivos donde hayas iniciado sesión.
              Para aplicar este cambio deberás confirmar tu contraseña actual en la siguiente ventana de confirmación (próximamente).
            </p>
            <button
              type="button"
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm"
              onClick={() => alert('Para mantener la seguridad, esta acción solicitará confirmación avanzada previa.')}
            >
              Cerrar Todas las Sesiones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
