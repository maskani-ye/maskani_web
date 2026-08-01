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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// الباك يُصدر توكناً دائماً عند الدخول بجوجل (ينشئ الحساب فوراً بلا هاتف) —
// لا حالة needs_completion ولا شاشة إكمال؛ الإكمال اختياري لاحقاً من الملف.
export type GoogleAuthResult = { status: "success"; user: User };

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

  // انتهاء الجلسة (401 من معترض api.ts) — نمسح المستخدم في المكان بلا تحويل صفحة.
  // لا توجد صفحة دخول؛ الأفعال المحمية تفتح نافذة المصادقة عبر requireAuth.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("maskani:auth-expired", onExpired);
    return () => window.removeEventListener("maskani:auth-expired", onExpired);
  }, []);

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
      value={{ user, loading, loginWithGoogle, logout, refreshUser }}
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
