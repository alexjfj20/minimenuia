'use client';

import { FC, useState, useEffect } from 'react';
import type { AdminProfile, UpdateProfilePayload } from '@/types/perfil';
import { Loader2, Lock } from 'lucide-react';

interface InformacionTabProps {
  profile: AdminProfile;
  onUpdate: (payload: UpdateProfilePayload) => Promise<void>;
  isSaving: boolean;
}

export const InformacionTab: FC<InformacionTabProps> = ({ profile, onUpdate, isSaving }) => {
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    fullName: profile.fullName || '',
    displayName: profile.displayName || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    companyName: profile.companyName || '',
    companyWebsite: profile.companyWebsite || '',
    timezone: profile.timezone || 'America/Bogota',
    language: profile.language || 'es',
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const isChanged = 
      formData.fullName !== profile.fullName ||
      formData.displayName !== profile.displayName ||
      formData.phone !== profile.phone ||
      formData.bio !== profile.bio ||
      formData.companyName !== profile.companyName ||
      formData.companyWebsite !== profile.companyWebsite ||
      formData.timezone !== profile.timezone ||
      formData.language !== profile.language;
    setHasChanges(isChanged);
  }, [formData, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    await onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información Personal */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Información Personal</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nombre Completo <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nombre a Mostrar <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Email (solo lectura)</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">El email principal está vinculado directamente a tu cuenta de autenticación.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Zona Horaria</label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="America/Bogota">America/Bogota (UTC-5)</option>
              <option value="America/Mexico_City">America/Mexico_City</option>
              <option value="America/Lima">America/Lima</option>
              <option value="America/Santiago">America/Santiago</option>
              <option value="America/Buenos_Aires">America/Buenos_Aires</option>
              <option value="Europe/Madrid">Europe/Madrid</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Biografía / Descripción</label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Breve descripción sobre ti..."
            />
          </div>
        </div>
      </div>

      {/* Información de la Empresa */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Información de la Empresa</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nombre de Empresa</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sitio Web</label>
            <input
              type="url"
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleChange}
              placeholder="https://"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!hasChanges || isSaving}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
            !hasChanges || isSaving
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};
