// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types";

const h = vi.hoisted(() => ({
  fetchCurrentUser: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  isAuthenticated: vi.fn(),
  logout: vi.fn(),
  post: vi.fn(),
  registerDeviceForPush: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  fetchCurrentUser: h.fetchCurrentUser,
  setToken: h.setToken,
  clearToken: h.clearToken,
  isAuthenticated: h.isAuthenticated,
  logout: h.logout,
}));
vi.mock("@/lib/api", () => ({ api: { post: h.post } }));
vi.mock("@/lib/push", () => ({ registerDeviceForPush: h.registerDeviceForPush }));

import { AuthProvider, useAuth } from "@/context/AuthContext";

const ALI = { id: 7, name: "علي" } as unknown as User;
const SARA = { id: 9, name: "سارة" } as unknown as User;

let ctx: ReturnType<typeof useAuth> | null = null;
function Probe() {
  const c = useAuth();
  ctx = c;
  return (
    <div>
      <span data-testid="user">{c.user ? String(c.user.id) : "none"}</span>
      <span data-testid="loading">{String(c.loading)}</span>
    </div>
  );
}
const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
const text = (id: string) => screen.getByTestId(id).textContent;

beforeEach(() => {
  ctx = null;
  for (const fn of Object.values(h)) fn.mockReset();
  h.isAuthenticated.mockReturnValue(true);
  h.fetchCurrentUser.mockResolvedValue(ALI);
  h.logout.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe("AuthProvider — الإقلاع", () => {
  it("بتوكن محفوظ: يجلب المستخدم ويكشفه وينهي التحميل ويسجّل الجهاز للإشعارات مرّة", async () => {
    mount();
    expect(text("loading")).toBe("true");
    await waitFor(() => expect(text("user")).toBe("7"));
    expect(text("loading")).toBe("false");
    expect(h.fetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(h.registerDeviceForPush).toHaveBeenCalledTimes(1);
  });

  it("بلا توكن: لا جلب ولا تسجيل جهاز، والتحميل ينتهي بلا مستخدم", async () => {
    h.isAuthenticated.mockReturnValue(false);
    mount();
    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("user")).toBe("none");
    expect(h.fetchCurrentUser).not.toHaveBeenCalled();
    expect(h.registerDeviceForPush).not.toHaveBeenCalled();
  });

  it("توكن لم يعد صالحاً (الجلب يعيد null): بلا مستخدم والتحميل ينتهي", async () => {
    h.fetchCurrentUser.mockResolvedValue(null);
    mount();
    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("user")).toBe("none");
  });

  it("refreshUser يعيد الجلب ويستبدل المستخدم", async () => {
    mount();
    await waitFor(() => expect(text("user")).toBe("7"));
    h.fetchCurrentUser.mockResolvedValue(SARA);
    await act(() => ctx!.refreshUser());
    expect(text("user")).toBe("9");
    expect(h.fetchCurrentUser).toHaveBeenCalledTimes(2);
  });
});

describe("AuthProvider — انتهاء الجلسة", () => {
  it("حدث maskani:auth-expired يمسح المستخدم في مكانه", async () => {
    mount();
    await waitFor(() => expect(text("user")).toBe("7"));
    act(() => {
      window.dispatchEvent(new Event("maskani:auth-expired"));
    });
    expect(text("user")).toBe("none");
  });

  it("المستمع يُزال عند التفكيك", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const r = mount();
    await waitFor(() => expect(text("user")).toBe("7"));
    const handler = add.mock.calls.find(([t]) => t === "maskani:auth-expired")?.[1];
    expect(handler).toBeTypeOf("function");
    r.unmount();
    expect(remove).toHaveBeenCalledWith("maskani:auth-expired", handler);
  });
});

describe("AuthProvider — loginWithGoogle", () => {
  it("النجاح يحفظ التوكن ويضبط المستخدم ويعيد success", async () => {
    h.isAuthenticated.mockReturnValue(false);
    h.post.mockResolvedValue({ data: { token: "tok-1", user: SARA } });
    mount();
    await waitFor(() => expect(text("loading")).toBe("false"));

    let result: unknown;
    await act(async () => {
      result = await ctx!.loginWithGoogle("google-id-token");
    });
    expect(h.post).toHaveBeenCalledWith("/auth/google/", { id_token: "google-id-token" });
    expect(h.setToken).toHaveBeenCalledWith("tok-1");
    expect(result).toEqual({ status: "success", user: SARA });
    expect(text("user")).toBe("9");
    expect(h.registerDeviceForPush).toHaveBeenCalledTimes(1);
  });

  it("رفض الخادم يرمي ولا يحفظ توكناً ولا يضبط مستخدماً", async () => {
    h.isAuthenticated.mockReturnValue(false);
    h.post.mockRejectedValue(new Error("401"));
    mount();
    await waitFor(() => expect(text("loading")).toBe("false"));

    await act(async () => {
      await expect(ctx!.loginWithGoogle("bad")).rejects.toThrow("401");
    });
    expect(h.setToken).not.toHaveBeenCalled();
    expect(text("user")).toBe("none");
  });
});

describe("AuthProvider — logout", () => {
  it("يمسح التوكن والمستخدم بعد نداء الخادم", async () => {
    mount();
    await waitFor(() => expect(text("user")).toBe("7"));
    await act(() => ctx!.logout());
    expect(h.logout).toHaveBeenCalledTimes(1);
    expect(h.clearToken).toHaveBeenCalledTimes(1);
    expect(text("user")).toBe("none");
  });

  it("فشل نداء الخادم لا يُبقي المستخدم مسجّلاً", async () => {
    h.logout.mockRejectedValue(new Error("offline"));
    mount();
    await waitFor(() => expect(text("user")).toBe("7"));
    // لا `.catch` هنا عمداً: الخروج يجب أن ينجح فيُكمل المعالِج رسالته وانتقاله.
    await act(async () => {
      await ctx!.logout();
    });
    expect(h.clearToken).toHaveBeenCalledTimes(1);
    expect(text("user")).toBe("none");
  });
});

describe("useAuth", () => {
  it("يرمي خارج AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useAuth must be used within AuthProvider");
    spy.mockRestore();
  });
});
