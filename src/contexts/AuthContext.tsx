'use client';

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react';
import type { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import { authService } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Custom store for auth state
function createAuthStore() {
  let user: User | null = null;
  const listeners = new Set<() => void>();

  return {
    getUser: () => user,
    setUser: (newUser: User | null) => {
      user = newUser;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const authStore = createAuthStore();

// ============================================================================
// LIMPIAR STORAGE - Para cuentas nuevas
// ============================================================================

function clearBusinessStorage(): void {
  if (typeof window === 'undefined') return;
  
  // Limpiar localStorage de datos de negocio anteriores
  const keysToRemove = [
    'minimenu_businesses',
    'minimenu_services',
    'minimenu_modules',
    'minimenu_plans',
    'minimenu_payment_config',
    'minimenu_ai_config',
    'minimenu_library_items',
    'business_profile',
    'business_products',
    'business_categories',
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('[Auth] Storage limpiado para nueva cuenta');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(
    authStore.subscribe,
    authStore.getUser,
    () => null
  );
  
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    const response = await authService.login(credentials);
    
    if (response.success && response.data) {
      // Limpiar storage antes de establecer el nuevo usuario
      clearBusinessStorage();
      authStore.setUser(response.data);
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: response.error ?? 'Error desconocido' };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    
    // Limpiar storage ANTES del registro para cuenta limpia
    clearBusinessStorage();
    
    const response = await authService.register(data);
    
    if (response.success && response.data) {
      authStore.setUser(response.data);
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: response.error ?? 'Error desconocido' };
  }, []);

  const logout = useCallback(async () => {
    // Limpiar storage al cerrar sesión
    clearBusinessStorage();
    await authService.logout();
    authStore.setUser(null);
  }, []);

  // Initialize from session cookie on mount
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = await authService.getCurrentUser();
        if (storedUser) {
          authStore.setUser(storedUser);
        }
      } catch (error) {
        console.error('[Auth] Error initializing:', error);
      }
    };
    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
