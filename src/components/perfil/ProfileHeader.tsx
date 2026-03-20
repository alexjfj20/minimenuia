'use client';

import { FC, useRef, useState } from 'react';
import type { AdminProfile } from '@/types/perfil';
import { Camera, Loader2, Shield } from 'lucide-react';

interface ProfileHeaderProps {
  profile: AdminProfile;
  onAvatarChange: (file: File) => Promise<void>;
  isUploadingAvatar: boolean;
}

export const ProfileHeader: FC<ProfileHeaderProps> = ({
  profile,
  onAvatarChange,
  isUploadingAvatar
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'AD';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorToast('Formato inválido. Usa JPG, PNG o WEBP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorToast('El archivo supera los 2MB permitidos.');
      return;
    }

    await onAvatarChange(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'hoy';
    if (days === 1) return 'hace 1 día';
    return `hace ${days} días`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative">
      {/* Avatar Section */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#7c3aed] flex items-center justify-center text-white text-3xl font-bold">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '';
                target.onerror = null;
                // Sub fallback handled by standard CSS background if img fails
              }}
            />
          ) : (
            getInitials(profile.displayName || profile.fullName)
          )}
        </div>
        
        {/* Upload Overlay */}
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
          {isUploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            disabled={isUploadingAvatar}
          />
        </label>
      </div>

      {/* Info Section */}
      <div className="flex-1 text-center md:text-left space-y-2">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{profile.displayName || 'Super Admin'}</h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full border border-purple-200">
            <Shield className="w-4 h-4" />
            Super Admin
          </div>
        </div>
        
        <p className="text-gray-600">{profile.email}</p>
        <p className="text-sm text-gray-500 font-medium">Panel de Administración</p>
        
        <div className="pt-2 text-xs text-gray-400">
          Última actualización: {timeAgo(profile.updatedAt)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 md:mt-0 flex flex-col gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg transition-colors border border-purple-200"
        >
          {isUploadingAvatar ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Cambiar foto
            </>
          )}
        </button>
      </div>

      {errorToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded shadow text-sm flex items-center gap-2">
          <span>{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="font-bold ml-2">×</button>
        </div>
      )}
    </div>
  );
};
