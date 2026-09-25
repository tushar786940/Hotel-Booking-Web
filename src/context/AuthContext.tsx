'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { RegisterData, RoleName, User } from '@/types';
import { authApi } from '@/lib/api';
import { getToken, setToken, setUser, clearAuth, getUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

type ApiErrorBody = { message?: string; errors?: Record<string, string[]> };

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorBody> =>
  Boolean((error as AxiosError)?.isAxiosError);

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Role names returned by Spatie (`$user->getRoleNames()`). */
  roles: RoleName[];
  hasRole: (role: RoleName) => boolean;
  /** Can access `/manage/*` endpoints. */
  isHotelOwner: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The API answers with `{ message, data: { user, token } }` for
 * login/register and `{ data: {...user} }` for `GET /profile`.
 */
function extractAuthPayload(resData: unknown): { user: User; token: string } {
  const body = (resData ?? {}) as Record<string, unknown>;
  const raw = (body.data ?? body) as Record<string, unknown>;

  return {
    user: (raw.user ?? raw) as User,
    token: (raw.token as string) ?? '',
  };
}

/** `getRoleNames()` is a collection of plain strings, e.g. ["hotel-owner"]. */
function normalizeRoles(user: User | null): RoleName[] {
  const roles = user?.roles;
  if (!Array.isArray(roles)) return [];

  return roles
    .map((role) => (typeof role === 'string' ? role : (role as { name?: string })?.name))
    .filter((role): role is RoleName => Boolean(role));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const userData: User | undefined = response.data?.data ?? response.data;
      if (userData && (userData.id || userData.email)) {
        setUserState(userData);
        setUser(userData);
      }
    } catch (error) {
      // ⚠️ ONLY clear the session when the server says 401 Unauthorized.
      if (isAxiosError(error) && error.response?.status === 401) {
        clearAuth();
        setUserState(null);
      } else {
        const cachedUser = getUser();
        if (cachedUser) setUserState(cachedUser);
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
    } else if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user: userData, token } = extractAuthPayload(response.data);

      if (!token) {
        throw new Error('No authentication token received from server');
      }

      setToken(token);
      setUser(userData);
      setUserState(userData);
      toast.success(`Welcome back, ${userData.name}!`);
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;
      toast.error(
        data?.errors?.email?.[0] ||
          data?.message ||
          (error instanceof Error ? error.message : '') ||
          'Login failed',
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      const { user: userData, token } = extractAuthPayload(response.data);

      if (token) {
        setToken(token);
        setUser(userData);
        setUserState(userData);
        // /register does not return roles — pull the full profile.
        refreshUser();
      }
      toast.success('Account created successfully!');
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;
      toast.error(data?.message || 'Registration failed');
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

  const roles = useMemo(() => normalizeRoles(user), [user]);
  const hasRole = useCallback((role: RoleName) => roles.includes(role), [roles]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        roles,
        hasRole,
        isHotelOwner: roles.includes('hotel-owner') || roles.includes('admin'),
        isAdmin: roles.includes('admin'),
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
