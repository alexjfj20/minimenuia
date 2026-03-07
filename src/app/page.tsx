'use client';

import { useState, useSyncExternalStore, useMemo } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import {
  LandingPage,
  LoginView,
  RegisterView,
  SuperAdminPanel,
  BusinessAdminPanel,
  ForgotPasswordView,
  FeaturesPage
} from '@/components/minimenu';
import type { RegisterData, Business, User } from '@/types';

type View = 'landing' | 'login' | 'register' | 'forgot-password' | 'features';

// Helper to get URL search params safely
function getUrlViewParam(): string | null {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('view');
}

// Subscribe function for URL changes
function subscribeToUrl(callback: () => void): () => void {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

// Snapshot functions for useSyncExternalStore
function getUrlSnapshot(): string | null {
  return getUrlViewParam();
}

function getServerSnapshot(): string | null {
  return null;
}

function AppContent() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  const [navigatedView, setNavigatedView] = useState<View | null>(null);
  const [impersonatedBusiness, setImpersonatedBusiness] = useState<Business | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);

  // Use useSyncExternalStore to safely read URL params (handles SSR hydration)
  const urlViewParam = useSyncExternalStore(subscribeToUrl, getUrlSnapshot, getServerSnapshot);

  // Calculate current view: URL param takes priority, then navigated view, then landing
  const view = useMemo<View>(() => {
    if (urlViewParam === 'features') return 'features';
    if (navigatedView !== null) return navigatedView;
    return 'landing';
  }, [urlViewParam, navigatedView]);

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
          onBack={() => setNavigatedView('landing')}
          onRegister={() => setNavigatedView('register')}
          onForgotPassword={() => setNavigatedView('forgot-password')}
        />
      );
    case 'register':
      return (
        <RegisterView
          onRegister={async (data: RegisterData) => {
            const result = await register(data);
            return result;
          }}
          onBack={() => setNavigatedView('landing')}
          onLogin={() => setNavigatedView('login')}
        />
      );
    case 'forgot-password':
      return (
        <ForgotPasswordView
          onBack={() => setNavigatedView('landing')}
          onLogin={() => setNavigatedView('login')}
        />
      );
    case 'features':
      return (
        <FeaturesPage
          onLogin={() => setNavigatedView('login')}
          onRegister={() => setNavigatedView('register')}
        />
      );
    default:
      return (
        <LandingPage
          onLogin={() => setNavigatedView('login')}
          onRegister={() => setNavigatedView('register')}
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
