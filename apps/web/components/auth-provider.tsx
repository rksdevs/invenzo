'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from '../lib/api';
import { AuthSession, loadSession, saveSession } from '../lib/session';

interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    isEmailVerified: boolean;
  } | null;
  tenant: {
    id: string;
    businessName: string;
    gstin?: string | null;
    address?: string | null;
  } | null;
}

interface AuthContextValue {
  session: AuthSession | null;
  me: MeResponse | null;
  loading: boolean;
  setSession: (session: AuthSession | null) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = (value: AuthSession | null) => {
    setSessionState(value);
    saveSession(value);
  };

  const refreshMe = async () => {
    if (!session?.accessToken) {
      setMe(null);
      return;
    }
    const profile = await apiFetch<MeResponse>('/auth/me', { method: 'GET' }, session.accessToken);
    setMe(profile);
  };

  const logout = () => {
    setSession(null);
    setMe(null);
  };

  useEffect(() => {
    const existing = loadSession();
    setSessionState(existing);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }
    refreshMe().catch((error: unknown) => {
      const status = (error as ApiError)?.status;
      if (status === 401) {
        logout();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const value = useMemo(
    () => ({ session, me, loading, setSession, refreshMe, logout }),
    [session, me, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
