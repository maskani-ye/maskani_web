import Cookies from "js-cookie";
import { api } from "./api";
import type { User } from "@/types";

// ─── إدارة توكن knox الوحيد ──────────────────────────────────────────────
// knox يُصدر توكناً واحداً طويل الأمد (TTL ‏30 يوماً) — لا يوجد access/refresh.
const TOKEN_KEY = "token";
const TOKEN_EXPIRY_DAYS = 30;

export function setToken(token: string) {
  Cookies.set(TOKEN_KEY, token, {
    expires: TOKEN_EXPIRY_DAYS,
    secure: process.env.NODE_ENV === "production",
    // المصادقة عبر ترويسة Authorization لا عبر الكوكي، فـ strict لا يكسر شيئاً
    // ويقلّص تعرّض التوكن للطلبات عبر-الموقع (دفاع في العمق).
    sameSite: "strict",
  });
}

export function clearToken() {
  Cookies.remove(TOKEN_KEY);
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<User>("/auth/me/");
    return data;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    // knox يحذف التوكن الحالي — يُرسَل بترويسة المصادقة، بلا جسم.
    if (getToken()) await api.post("/auth/logout/");
  } finally {
    clearToken();
  }
}
