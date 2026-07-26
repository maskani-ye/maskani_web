"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { User } from "@/types";
import { fetchCurrentUser, setToken, clearToken, isAuthenticated, logout as doLogout } from "@/lib/auth";
import { api } from "@/lib/api";
import { registerDeviceForPush } from "@/lib/push";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<GoogleAuthResult>;
  completeGoogle: (data: GoogleCompleteData) => Promise<GoogleAuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface GoogleCompleteData {
  idToken: string;
  phone: string;
  city?: number;
  full_name?: string;
}

// نتيجة تدفق جوجل — إما دخول ناجح، أو حساب جديد يحتاج استكمال بياناته
export type GoogleAuthResult =
  | { status: "success"; user: User }
  | { status: "needs_completion"; email: string; full_name: string };

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // توكن knox طويل الأمد — إن غاب فلا جلسة (لا يوجد refresh لاستعادتها).
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    const u = await fetchCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // تسجيل جهاز الويب للإشعارات عند توفّر مستخدم مُصادَق — يغطّي نجاح الدخول
  // وإقلاع جلسة محفوظة (نمط فلاتر: بعد المصادقة + عند الإقلاع). مرّة لكل مستخدم.
  const pushRegisteredFor = useRef<number | null>(null);
  useEffect(() => {
    if (user && pushRegisteredFor.current !== user.id) {
      pushRegisteredFor.current = user.id;
      registerDeviceForPush();
    }
  }, [user]);

  // نُثبّت الجلسة لكل المستخدمين — لا توجد بوابة أدوار هنا
  const finalizeAuth = (data: {
    user: User;
    token: string;
  }): GoogleAuthResult => {
    setToken(data.token);
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
      await doLogout();
    } finally {
      clearToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, completeGoogle, logout, refreshUser }}
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
