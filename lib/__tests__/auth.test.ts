// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Cookies from "js-cookie";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/api", () => ({ api }));

import {
  clearToken,
  fetchCurrentUser,
  getToken,
  isAuthenticated,
  logout,
  setToken,
} from "@/lib/auth";

beforeEach(() => {
  clearToken();
  api.get.mockReset();
  api.post.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("توكن knox في الكوكي", () => {
  it("يُحفظ ويُقرأ ويُمسح", () => {
    expect(isAuthenticated()).toBe(false);
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    expect(isAuthenticated()).toBe(true);
    clearToken();
    expect(getToken()).toBeUndefined();
    expect(isAuthenticated()).toBe(false);
  });

  it("ثلاثون يوماً وsameSite صارم، وsecure في الإنتاج وحده", () => {
    const set = vi.spyOn(Cookies, "set");
    setToken("t");
    expect(set).toHaveBeenLastCalledWith("token", "t", { expires: 30, secure: false, sameSite: "strict" });
    vi.stubEnv("NODE_ENV", "production");
    setToken("t");
    expect(set).toHaveBeenLastCalledWith("token", "t", { expires: 30, secure: true, sameSite: "strict" });
  });
});

describe("fetchCurrentUser", () => {
  it("يُرجع المستخدم من /auth/me/ وnull عند الفشل", async () => {
    api.get.mockResolvedValueOnce({ data: { id: 1, role: "user" } });
    expect(await fetchCurrentUser()).toEqual({ id: 1, role: "user" });
    expect(api.get).toHaveBeenCalledWith("/auth/me/");
    api.get.mockRejectedValueOnce(new Error("401"));
    expect(await fetchCurrentUser()).toBeNull();
  });
});

describe("logout", () => {
  it("يحذف التوكن في الخادم ثم يمسح الكوكي", async () => {
    setToken("t");
    api.post.mockResolvedValueOnce({});
    await logout();
    expect(api.post).toHaveBeenCalledWith("/auth/logout/");
    expect(getToken()).toBeUndefined();
  });

  it("الزائر بلا توكن لا يُرسل طلب خروج", async () => {
    await logout();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("فشل الخادم لا يوقف الخروج: يُمسح الكوكي ولا يُرفع الخطأ إلى المعالِج", async () => {
    // كان يُرفع فتتوقّف معالِجات الخروج (الرسالة والانتقال) — الزائر عالقٌ في الصفحة.
    setToken("t");
    api.post.mockRejectedValueOnce(new Error("network"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(logout()).resolves.toBeUndefined();
    expect(getToken()).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
