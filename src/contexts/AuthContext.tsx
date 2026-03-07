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
      authStore.setUser(response.data);
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: response.error ?? 'Error desconocido' };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
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
    await authService.logout();
    authStore.setUser(null);
  }, []);

  // Initialize from localStorage on mount
  React.useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      authStore.setUser(storedUser);
    }
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
