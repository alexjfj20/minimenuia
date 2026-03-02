'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import {
  LandingPage,
  LoginView,
  RegisterView,
  SuperAdminPanel,
  BusinessAdminPanel
} from '@/components/minimenu';
import type { RegisterData, Business, User } from '@/types';

type View = 'landing' | 'login' | 'register';

function AppContent() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [impersonatedBusiness, setImpersonatedBusiness] = useState<Business | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);

  // Handle impersonation - Super Admin can "become" a business owner
  const handleImpersonate = (business: Business) => {
    if (user?.role === 'super_admin') {
      setOriginalUser(user);
      setImpersonatedBusiness(business);
    }
  };

  // Exit impersonation mode
  const handleExitImpersonation = () => {
    setImpersonatedBusiness(null);
    setOriginalUser(null);
  };

  // If loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // If impersonating a business
  if (impersonatedBusiness && originalUser) {
    const impersonatedUser: User = {
      id: impersonatedBusiness.ownerId,
      email: impersonatedBusiness.ownerEmail,
      name: impersonatedBusiness.ownerName,
      role: 'business_admin',
      businessId: impersonatedBusiness.id,
      createdAt: impersonatedBusiness.createdAt,
      updatedAt: impersonatedBusiness.updatedAt
    };

    return (
      <div className="min-h-screen">
        {/* Impersonation Banner */}
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          ⚠️ Modo simulación: Estás viendo el panel de <strong>{impersonatedBusiness.name}</strong> 
          <button 
            onClick={handleExitImpersonation}
            className="ml-4 underline hover:no-underline"
          >
            Salir de simulación
          </button>
        </div>
        <BusinessAdminPanel 
          user={impersonatedUser} 
          onLogout={handleExitImpersonation} 
        />
      </div>
    );
  }

  // If authenticated, show the appropriate panel
  if (isAuthenticated && user) {
    if (user.role === 'super_admin') {
      return <SuperAdminPanel onLogout={logout} onImpersonate={handleImpersonate} />;
    }
    return <BusinessAdminPanel user={user} onLogout={logout} />;
  }

  // Not authenticated - show landing, login, or register
  switch (view) {
    case 'login':
      return (
        <LoginView
          onLogin={async (email, password) => {
            const result = await login({ email, password });
            return result;
          }}
          onBack={() => setView('landing')}
          onRegister={() => setView('register')}
        />
      );
    case 'register':
      return (
        <RegisterView
          onRegister={async (data: RegisterData) => {
            const result = await register(data);
            return result;
          }}
          onBack={() => setView('landing')}
          onLogin={() => setView('login')}
        />
      );
    default:
      return (
        <LandingPage
          onLogin={() => setView('login')}
          onRegister={() => setView('register')}
        />
      );
  }
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
