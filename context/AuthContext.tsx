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
  loginWithGoogle: (idToken: string) => Promise<GoogleAuthResult>;
  completeGoogle: (data: GoogleCompleteData) => Promise<GoogleAuthResult>;
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

interface GoogleCompleteData {
  idToken: string;
  phone: string;
  city?: number;
  full_name?: string;
}

// نتيجة تدفق جوجل — إما دخول ناجح، أو حساب جديد يحتاج استكمال، أو مستخدم ليس مشرفاً
export type GoogleAuthResult =
  | { status: "success"; user: User }
  | { status: "needs_completion"; email: string; full_name: string }
  | { status: "forbidden" };

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

  // بوابة المشرفين: نُثبّت الجلسة فقط إن كان المستخدم مشرفاً
  const finalizeAuth = (data: {
    user: User;
    access: string;
    refresh: string;
  }): GoogleAuthResult => {
    if (data.user?.role !== "admin") {
      // لا نحفظ التوكنات لغير المشرفين
      clearTokens();
      setUser(null);
      return { status: "forbidden" };
    }
    setTokens(data.access, data.refresh);
    setUser(data.user);
    return { status: "success", user: data.user };
  };

  const loginWithGoogle = async (idToken: string): Promise<GoogleAuthResult> => {
    const { data } = await api.post("/auth/google/", { id_token: idToken });
    if (data?.needs_completion) {
      return {
        status: "needs_completion",
        email: data.email ?? "",
        full_name: data.full_name ?? "",
      };
    }
    return finalizeAuth(data);
  };

  const completeGoogle = async (form: GoogleCompleteData): Promise<GoogleAuthResult> => {
    const { data } = await api.post("/auth/google/complete/", {
      id_token: form.idToken,
      phone: form.phone,
      ...(form.city != null ? { city: form.city } : {}),
      ...(form.full_name ? { full_name: form.full_name } : {}),
    });
    return finalizeAuth(data);
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
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, completeGoogle, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
