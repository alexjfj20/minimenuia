'use client';

import { FC } from 'react';
import type { ProfileTab } from '@/types/perfil';
import { User, Shield, Bell, Monitor } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export const ProfileTabs: FC<ProfileTabsProps> = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'informacion' as ProfileTab, label: 'Información Personal', icon: User },
    { id: 'seguridad' as ProfileTab, label: 'Seguridad', icon: Shield },
    { id: 'notificaciones' as ProfileTab, label: 'Notificaciones', icon: Bell },
    { id: 'sesiones' as ProfileTab, label: 'Sesiones Activas', icon: Monitor },
  ];

  return (
    <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${
              isActive
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
