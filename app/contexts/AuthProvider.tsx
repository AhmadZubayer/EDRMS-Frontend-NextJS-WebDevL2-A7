'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { publicApi } from '@/app/lib/public-api';
import { invalidateApiCache } from '@/lib/client-cache';

export type UserType = {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
} | null;

interface AuthContextType {
  user: UserType;
  loading: boolean;
  signInUser: (email: string, pass: string) => Promise<unknown>;
  registerUser: (name: string, email: string, pass: string) => Promise<unknown>;
  logOut: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInUser: async () => {},
  registerUser: async () => {},
  logOut: async () => {},
  fetchCurrentUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const authRequest = useRef(0);

  const fetchCurrentUser = useCallback(() => {
    const requestId = ++authRequest.current;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const request = token ? publicApi.get('/auth/me') : Promise.resolve(null);
    return request.then((response) => {
      if (requestId !== authRequest.current) return;
      setUser(response ? response.data?.data ?? response.data : null);
    }).catch(() => {
      if (requestId === authRequest.current) setUser(null);
    }).finally(() => {
      if (requestId === authRequest.current) setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const signInUser = useCallback(async (email: string, pass: string) => {
    authRequest.current += 1;
    setLoading(true);
    try {
      const res = await publicApi.post(
        '/auth/login',
        { email, password: pass },
        { withCredentials: true }
      );
      const token = res.data?.data?.accessToken || res.data?.data?.access_token || res.data?.access_token;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('access_token', token);
      }
      await fetchCurrentUser();
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  const registerUser = useCallback(async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await publicApi.post(
        '/auth/register',
        { name, email, password: pass },
        { withCredentials: true }
      );
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logOut = useCallback(async () => {
    authRequest.current += 1;
    setLoading(true);
    try {
      await publicApi.post('/auth/logout');
    } catch {
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
      setUser(null);
      void invalidateApiCache(false).catch(() => {});
      setLoading(false);
    }
  }, []);

  const authInfo = useMemo(() => ({
    user,
    loading,
    signInUser,
    registerUser,
    logOut,
    fetchCurrentUser,
  }), [user, loading, signInUser, registerUser, logOut, fetchCurrentUser]);

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
