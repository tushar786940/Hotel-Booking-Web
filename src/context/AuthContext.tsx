"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "@/types";
import { authApi } from "@/lib/api";
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  clearAuth,
} from "@/lib/auth";
import toast from "react-hot-toast";

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

  const isAuthenticated = !!user;

  const refreshUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setUserState(null);
        setIsLoading(false);
        return;
      }

      const response = await authApi.getProfile();
      const userData = response.data.data || response.data;
      setUserState(userData);
      setUser(userData);
    } catch (error) {
      clearAuth();
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try to load user from localStorage first for quick UI
    const cachedUser = getUser();
    if (cachedUser) {
      setUserState(cachedUser);
    }
    // Then verify with server
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user: userData, token } = response.data.data || response.data;

      setToken(token);
      setUser(userData);
      setUserState(userData);
      toast.success(`Welcome back, ${userData.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
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
      const { user: userData, token } = response.data.data || response.data;

      setToken(token);
      setUser(userData);
      setUserState(userData);
      toast.success("Account created successfully!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
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
      // Ignore logout errors
    } finally {
      clearAuth();
      setUserState(null);
      toast.success("Logged out successfully");
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
        isAuthenticated,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
