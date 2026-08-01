import axios, { AxiosInstance, AxiosError } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor: إضافة توكن knox ────────────────────────────────
// المصادقة عبر ترويسة `Authorization: Token <token>` (ليست Bearer).
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// ─── Response Interceptor: عند 401 — مسح التوكن وإعلام التطبيق (بلا تحويل) ──
// لا توجد صفحة دخول (حُذفت) — المصادقة عبر نافذة منبثقة في المكان. لذلك لا نُحوّل
// إطلاقاً (كان يُحوّل لـ/auth/login المحذوفة = 404). نُطلق الحدث فقط إن كان هناك
// توكن فعلاً (جلسة منتهية)، لا لطلبات الزائر (بلا توكن) حتى لا نُزعجه بلا داعٍ.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      Cookies.get("token")
    ) {
      Cookies.remove("token");
      window.dispatchEvent(new CustomEvent("maskani:auth-expired"));
    }
    return Promise.reject(error);
  }
);

// ─── Helper: كود حالة HTTP من الخطأ (أو null إن كان خطأ شبكة/غير HTTP) ─────
export function getErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) return error.response?.status ?? null;
  return null;
}

// ─── Helper: استخراج رسالة الخطأ ─────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (data?.fields?.length) {
      return data.fields.map((f: { field: string; message: string }) => `${f.field}: ${f.message}`).join(" | ");
    }
  }
  return "حدث خطأ غير متوقع";
}
