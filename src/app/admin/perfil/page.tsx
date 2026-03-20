'use client';

import { useState, useEffect } from 'react';
import type {
  AdminProfile,
  NotificationSettings,
  ProfileTab,
  UpdateProfilePayload,
  UpdateNotificationsPayload,
  UpdatePasswordPayload
} from '@/types/perfil';

import { ProfileHeader } from '@/components/perfil/ProfileHeader';
import { ProfileTabs } from '@/components/perfil/ProfileTabs';
import { InformacionTab } from '@/components/perfil/tabs/InformacionTab';
import { SeguridadTab } from '@/components/perfil/tabs/SeguridadTab';
import { NotificacionesTab } from '@/components/perfil/tabs/NotificacionesTab';
import { SesionesTab } from '@/components/perfil/tabs/SesionesTab';
import { ProfileSkeleton } from '@/components/perfil/ProfileSkeleton';
import { ToastNotification } from '@/components/perfil/ToastNotification';
import { supabase } from '@/lib/supabaseClient';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('informacion');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Intentar obtener sesión de Supabase Auth (para usuarios regulares)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Perfil] Session error:', sessionError.message);
        }

        let headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        // Si hay sesión de Supabase, usar su token
        if (session && session.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        // Si no hay sesión de Supabase, la API leerá la cookie de sesión automáticamente

        // Hacer fetch al API de perfil
        const res = await fetch('/api/perfil', { headers });

        if (!res.ok) {
          let errData = {};
          try {
            errData = await res.json();
          } catch {
            // No se pudo parsear la respuesta de error
          }
          
          if (res.status === 401) {
            throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
          } else if (res.status === 403) {
            const errDataTyped = errData as { error?: string };
            throw new Error(errDataTyped.error || 'Acceso denegado. Se requiere rol de super_admin.');
          } else if (res.status === 500) {
            const errDataTyped = errData as { error?: string };
            throw new Error(errDataTyped.error || 'Error del servidor.');
          }
          throw new Error('No se pudo cargar el perfil');
        }

        const data = await res.json();
        
        if (!data.profile) {
          throw new Error('No se encontró perfil');
        }

        setProfile(data.profile);
        setNotifications(data.notifications);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (session && session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return headers;
  };

  const getFormDataHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    
    if (session && session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return headers;
  };

  const showToast = (message: string) => {
    setSuccessMessage(message);
  };

  const handleUpdateProfile = async (payload: UpdateProfilePayload): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil');

      setProfile((prev) => prev ? { ...prev, ...payload, updatedAt: new Date().toISOString() } : null);
      showToast('Perfil actualizado correctamente');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNotifications = async (payload: UpdateNotificationsPayload): Promise<void> => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/perfil/notificaciones', {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar notificaciones');

      setNotifications(payload);
      showToast('Preferencia guardada');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (payload: UpdatePasswordPayload): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/perfil/password', {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña');

      showToast('Contraseña actualizada de forma segura');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (file: File): Promise<void> => {
    setIsUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/perfil/avatar', {
        method: 'POST',
        headers: await getFormDataHeaders(),
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');

      setProfile((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl, updatedAt: new Date().toISOString() } : null);
      showToast('Foto de perfil actualizada');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSignOutAll = async (): Promise<void> => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/login';
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Error') || 'Error al cerrar sesiones');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header de página */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1>
          <p className="text-gray-500 mt-2">Administra tu información personal y configuración empresarial.</p>
        </div>

        {/* Error state general */}
        {error !== null && (
          <div className="text-red-700 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm flex items-center justify-between">
            <p className="font-medium text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">×</button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && <ProfileSkeleton />}

        {/* Contenido principal */}
        {!isLoading && profile !== null && (
          <div className="space-y-6">

            <ProfileHeader
              profile={profile}
              onAvatarChange={handleAvatarChange}
              isUploadingAvatar={isUploadingAvatar}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <ProfileTabs
                activeTab={activeTab}
                onChange={setActiveTab}
              />

              <div className="p-6">
                {activeTab === 'informacion' && (
                  <InformacionTab
                    profile={profile}
                    onUpdate={handleUpdateProfile}
                    isSaving={isSaving}
                  />
                )}
                {activeTab === 'seguridad' && (
                  <SeguridadTab
                    onUpdatePassword={handleUpdatePassword}
                    isSaving={isSaving}
                  />
                )}
                {activeTab === 'notificaciones' && notifications !== null && (
                  <NotificacionesTab
                    settings={notifications}
                    onUpdate={handleUpdateNotifications}
                    isSaving={isSaving}
                  />
                )}
                {activeTab === 'sesiones' && (
                  <SesionesTab
                    onSignOutAll={handleSignOutAll}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {successMessage !== null && (
          <ToastNotification
            message={successMessage}
            type="success"
            onClose={() => setSuccessMessage(null)}
          />
        )}
      </div>
    </div>
  );
}
