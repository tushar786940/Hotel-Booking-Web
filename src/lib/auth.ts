import { User } from "@/types";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
};

export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: User): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
};

export const removeUser = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const clearAuth = (): void => {
  removeToken();
  removeUser();
};
