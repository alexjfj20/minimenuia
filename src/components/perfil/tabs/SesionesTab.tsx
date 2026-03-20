'use client';

import { FC, useEffect, useState } from 'react';
import type { SessionInfo } from '@/types/perfil';
import { Monitor, Phone, Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SesionesTabProps {
  onSignOutAll: () => Promise<void>;
}

export const SesionesTab: FC<SesionesTabProps> = ({ onSignOutAll }) => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Client-side fetch of current session info
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
          const osName = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'MacOS' : 'OS') : 'OS';
          
          setSessions([{
            id: session.access_token.substring(0, 8),
            device: isMobile ? `Móvil — ${osName}` : `PC — ${osName}`,
            location: 'Tu ubicación actual',
            lastActive: new Date().toISOString(),
            isCurrent: true
          }]);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const timeAgo = (dateStr: string) => {
    const minDiff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (minDiff < 1) return 'Hace un momento';
    if (minDiff < 60) return `Hace ${minDiff} minutos`;
    return 'Recientemente';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
        <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
        <p>Supabase gestiona automáticamente las sesiones en tus dispositivos. Solo se muestra tu acceso activo directo en este navegador actual.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Dispositivos Conectados</h3>
        
        {isLoading ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500">
            No se detectaron sesiones activas localmente.
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-white p-5 rounded-xl border border-purple-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  {session.device.includes('Móvil') ? <Phone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-gray-900">{session.device}</h4>
                    {session.isCurrent && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        SESIÓN ACTUAL
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Último acceso: {timeAgo(session.lastActive)}</p>
                  <p className="text-gray-400 text-sm">{session.location}</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("¿Seguro que deseas cerrar la sesión en este dispositivo?")) {
                      await onSignOutAll();
                    }
                  }}
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors"
                >
                  Cerrar esta sesión
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
