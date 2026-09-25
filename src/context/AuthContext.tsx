'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { getToken, setToken, setUser, clearAuth, getUser } from '@/lib/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const extractAuthData = (resData: any): { user: User; token: string } => {
    const raw = resData?.data || resData;
    const token = raw?.token || raw?.access_token || raw?.plainTextToken || '';
    const user = raw?.user || raw;
    return { user, token };
  };

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      clearAuth();
      setUserState(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getProfile();
      const userData = response.data?.data?.user || response.data?.data || response.data;
      if (userData && (userData.id || userData.email)) {
        setUserState(userData);
        setUser(userData);
      }
    } catch (error: any) {
      // ⚠️ ONLY clear session if server explicitly returns 401 Unauthorized
      if (error?.response?.status === 401) {
        clearAuth();
        setUserState(null);
      } else {
        // For 404 or other network glitches, keep existing user from localStorage
        const cachedUser = getUser();
        if (cachedUser) {
          setUserState(cachedUser);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    const cachedUser = getUser();

    if (token && cachedUser) {
      setUserState(cachedUser);
      setIsLoading(false);
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user: userData, token } = extractAuthData(response.data);

      if (!token) {
        throw new Error('No authentication token received from server');
      }

      setToken(token);
      setUser(userData);
      setUserState(userData);
      toast.success(`Welcome back, ${userData.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      const { user: userData, token } = extractAuthData(response.data);

      if (token) {
        setToken(token);
        setUser(userData);
        setUserState(userData);
      }
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API errors during logout
    } finally {
      clearAuth();
      setUserState(null);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData: User) => {
    setUserState(userData);
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}