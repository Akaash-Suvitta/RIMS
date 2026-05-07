'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@rim/types';
import { clearStoredToken, get, getStoredToken, setStoredToken } from './api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // On mount: attempt to rehydrate from localStorage
  useEffect(() => {
    async function rehydrate() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      try {
        const user = await get<User>('/api/v1/users/me');
        setState({ token: storedToken, user, isLoading: false, isAuthenticated: true });
      } catch {
        // Token is invalid or expired
        clearStoredToken();
        setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
      }
    }

    rehydrate();
  }, []);

  const login = useCallback((token: string, user: User) => {
    setStoredToken(token);
    setState({ token, user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0B1929' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: '#00C2A8' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
