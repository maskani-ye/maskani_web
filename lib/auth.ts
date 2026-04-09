import Cookies from "js-cookie";
import { api } from "./api";
import type { User } from "@/types";

export function setTokens(access: string, refresh: string) {
  Cookies.set("access_token", access, { expires: 1, secure: process.env.NODE_ENV === "production" });
  Cookies.set("refresh_token", refresh, { expires: 30, secure: process.env.NODE_ENV === "production" });
}

export function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export function getAccessToken(): string | undefined {
  return Cookies.get("access_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
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
    const refresh = Cookies.get("refresh_token");
    if (refresh) await api.post("/auth/logout/", { refresh });
  } finally {
    clearTokens();
  }
}
