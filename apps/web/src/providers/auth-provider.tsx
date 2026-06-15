'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

interface User {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, refreshToken } = response.data;

    // Decode JWT to get user info
    const payload = JSON.parse(atob(accessToken.split('.')[1]));

    setState({
      user: {
        sub: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
        permissions: payload.permissions || [],
      },
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });

    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
