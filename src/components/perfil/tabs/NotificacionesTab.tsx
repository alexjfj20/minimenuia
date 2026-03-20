'use client';

import { FC, useState } from 'react';
import type { NotificationSettings, UpdateNotificationsPayload } from '@/types/perfil';
import { Loader2 } from 'lucide-react';

interface NotificacionesTabProps {
  settings: NotificationSettings;
  onUpdate: (payload: UpdateNotificationsPayload) => Promise<void>;
  isSaving: boolean;
}

export const NotificacionesTab: FC<NotificacionesTabProps> = ({ settings, onUpdate, isSaving }) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [activeToggle, setActiveToggle] = useState<keyof NotificationSettings | null>(null);

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !localSettings[key];
    setLocalSettings((prev) => ({ ...prev, [key]: newValue }));
    setActiveToggle(key);
    
    await onUpdate({ ...localSettings, [key]: newValue });
    setActiveToggle(null);
  };

  const notificationOptions = [
    {
      id: 'emailNotifications' as const,
      icon: '📧',
      title: 'Notificaciones generales por email',
      description: 'Recibir resúmenes y novedades de la plataforma'
    },
    {
      id: 'systemAlerts' as const,
      icon: '🔔',
      title: 'Alertas del sistema',
      description: 'Errores críticos, mantenimientos y actualizaciones'
    },
    {
      id: 'newBusinessAlerts' as const,
      icon: '🏢',
      title: 'Nuevos negocios registrados',
      description: 'Notificar inmediatamente cuando se registra un nuevo negocio'
    },
    {
      id: 'paymentAlerts' as const,
      icon: '💳',
      title: 'Alertas de pagos y suscripciones',
      description: 'Pagos fallidos, vencimientos de plan y renovaciones'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
      <div className="p-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Notificaciones y Alertas</h3>
        <p className="text-gray-500 mt-1">Configura qué información deseas recibir en tu correo o panel.</p>
      </div>

      <div className="divide-y divide-gray-100">
        {notificationOptions.map((option) => {
          const isEnabled = localSettings[option.id];
          const isUpdatingThis = activeToggle === option.id;

          return (
            <div key={option.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex gap-4">
                <div className="text-2xl pt-0.5">{option.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{option.title}</h4>
                  <p className="text-gray-500 mt-0.5">{option.description}</p>
                </div>
              </div>

              <div className="ml-4 flex items-center gap-3">
                {isUpdatingThis && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  disabled={isSaving || isUpdatingThis}
                  onClick={() => handleToggle(option.id)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2
                    ${isEnabled ? 'bg-purple-600' : 'bg-gray-200'}
                    ${(isSaving || isUpdatingThis) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span
                    aria-hidden="true"
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
