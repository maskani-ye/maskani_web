"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/types";
import Cookies from "js-cookie";
import { fetchCurrentUser, setTokens, clearTokens, isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  phone: string;
  full_name: string;
  password: string;
  password_confirm: string;
  role: string;
  city?: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // If access token is missing but refresh token exists → restore session silently
    if (!isAuthenticated()) {
      const refresh = Cookies.get("refresh_token");
      if (!refresh) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.post("/auth/token/refresh/", { refresh });
        setTokens(data.access, data.refresh ?? refresh);
      } catch {
        // Refresh token expired → clear and send to login
        clearTokens();
        setUser(null);
        setLoading(false);
        return;
      }
    }
    const u = await fetchCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (phone: string, password: string) => {
    const { data } = await api.post("/auth/login/", { phone, password });
    setTokens(data.access, data.refresh);
    const u = await fetchCurrentUser();
    setUser(u);
  };

  const register = async (formData: RegisterData) => {
    const { data } = await api.post("/auth/register/", formData);
    setTokens(data.access, data.refresh);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const { Cookies } = await import("js-cookie").then((m) => ({ Cookies: m.default }));
      const refresh = Cookies.get("refresh_token");
      if (refresh) await api.post("/auth/logout/", { refresh });
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
