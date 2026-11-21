// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const h = vi.hoisted(() => ({
  auth: { user: null as null | { id: number }, loginWithGoogle: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: () => h.auth }));
vi.mock("sonner", () => ({ toast: h.toast }));
vi.mock("@solar-icons/react", () => ({ HomeSmile: () => null }));
vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) =>
    open ? (
      <div role="dialog">
        <button onClick={onClose}>dialog-x</button>
        {children}
      </div>
    ) : null,
}));
vi.mock("@/components/auth/GoogleSignInButton", () => ({
  GoogleSignInButton: ({ onCredential, disabled }: { onCredential: (t: string) => void; disabled?: boolean }) => (
    <button disabled={disabled} onClick={() => onCredential("id-token")}>google</button>
  ),
}));

import { AuthGateProvider, useAuthGate } from "@/context/AuthGate";

let gate: ReturnType<typeof useAuthGate> | null = null;
function Probe() {
  gate = useAuthGate();
  return null;
}
const tree = () => (
  <AuthGateProvider>
    <Probe />
  </AuthGateProvider>
);
const dialog = () => screen.queryByRole("dialog");

beforeEach(() => {
  gate = null;
  h.auth = { user: null, loginWithGoogle: vi.fn(() => Promise.resolve({ status: "success" })) };
  h.toast.success.mockReset();
  h.toast.error.mockReset();
});

afterEach(() => cleanup());

describe("AuthGate — requireAuth", () => {
  it("مستخدم مسجّل: يعيد true ويشغّل onSuccess فوراً بلا نافذة", () => {
    h.auth.user = { id: 1 };
    render(tree());
    const onSuccess = vi.fn();
    let r: boolean | undefined;
    act(() => {
      r = gate!.requireAuth(onSuccess);
    });
    expect(r).toBe(true);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeNull();
  });

  it("زائر: يعيد false ويفتح النافذة بلا تشغيل onSuccess", () => {
    render(tree());
    const onSuccess = vi.fn();
    let r: boolean | undefined;
    act(() => {
      r = gate!.requireAuth(onSuccess);
    });
    expect(r).toBe(false);
    expect(dialog()).not.toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("نداء ثانٍ والنافذة مفتوحة يعيد false ولا يستبدل الاستدعاءات المعلّقة", async () => {
    render(tree());
    const first = vi.fn();
    const second = vi.fn();
    act(() => {
      gate!.requireAuth(first);
    });
    let r: boolean | undefined;
    act(() => {
      r = gate!.requireAuth(second);
    });
    expect(r).toBe(false);

    await act(async () => fireEvent.click(screen.getByText("google")));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});

describe("AuthGate — الدخول من النافذة", () => {
  it("نجاح الدخول يغلق النافذة ويشغّل onSuccess المعلّق مرّة واحدة ولا يشغّل onCancel", async () => {
    render(tree());
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    act(() => {
      gate!.requireAuth(onSuccess, onCancel);
    });

    await act(async () => fireEvent.click(screen.getByText("google")));
    expect(h.auth.loginWithGoogle).toHaveBeenCalledWith("id-token");
    expect(h.toast.success).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeNull();
    expect(onSuccess).toHaveBeenCalledTimes(1);

    // فتحٌ جديد ثم إلغاء لا يُعيد تشغيل استدعاءات الطلب السابق.
    act(() => {
      gate!.requireAuth();
    });
    fireEvent.click(screen.getByText("لاحقاً"));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("فشل الدخول يُبقي النافذة مفتوحة ويُظهر خطأً بلا تشغيل onSuccess، ثم يعود الزرّ فعّالاً", async () => {
    h.auth.loginWithGoogle.mockRejectedValue(new Error("popup closed"));
    render(tree());
    const onSuccess = vi.fn();
    act(() => {
      gate!.requireAuth(onSuccess);
    });

    await act(async () => fireEvent.click(screen.getByText("google")));
    expect(h.toast.error).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
    expect((screen.getByText("google") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("AuthGate — الإغلاق", () => {
  it("«لاحقاً» يغلق النافذة ويشغّل onCancel مرّة ولا يشغّل onSuccess", () => {
    render(tree());
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    act(() => {
      gate!.requireAuth(onSuccess, onCancel);
    });
    fireEvent.click(screen.getByText("لاحقاً"));
    expect(dialog()).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("إغلاق النافذة نفسها (onClose) يشغّل onCancel، والفتح التالي يقبل استدعاءات جديدة", async () => {
    render(tree());
    const cancelA = vi.fn();
    act(() => {
      gate!.requireAuth(undefined, cancelA);
    });
    fireEvent.click(screen.getByText("dialog-x"));
    expect(cancelA).toHaveBeenCalledTimes(1);

    const successB = vi.fn();
    act(() => {
      gate!.requireAuth(successB);
    });
    await act(async () => fireEvent.click(screen.getByText("google")));
    expect(successB).toHaveBeenCalledTimes(1);
    expect(cancelA).toHaveBeenCalledTimes(1);
  });
});

describe("useAuthGate", () => {
  it("يرمي خارج AuthGateProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useAuthGate must be used within AuthGateProvider");
    spy.mockRestore();
  });
});
