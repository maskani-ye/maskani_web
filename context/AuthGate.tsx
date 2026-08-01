"use client";

// ─── AuthGate ────────────────────────────────────────────────────────────────
// بوابة مصادقة «زائر-أولاً» مطابقة للتطبيق: بدل التوجيه إلى صفحة /auth/login،
// تُعرض نافذة مصادقة (Google) منبثقة عند طلب فعل/صفحة محمية. الزائر يتصفّح بحرّية،
// وتظهر النافذة فقط عند الحاجة. requireAuth(onSuccess?, onCancel?) تُعيد true إن
// كان مسجّلاً (وتشغّل onSuccess)، وإلا تفتح النافذة وتُعيد false.
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Dialog } from "@/components/ui/Dialog";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PENDING_GOOGLE_KEY } from "@/components/auth/GoogleOneTap";
import { useRouter } from "next/navigation";
import { HomeSmile } from "@solar-icons/react";
import { toast } from "sonner";

interface AuthGateType {
  /** يُعيد true إن كان مسجّلاً (ويشغّل onSuccess)، وإلا يفتح نافذة الدخول ويُعيد false. */
  requireAuth: (onSuccess?: () => void, onCancel?: () => void) => boolean;
}

const AuthGateContext = createContext<AuthGateType | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ onSuccess?: () => void; onCancel?: () => void }>({});

  const requireAuth = useCallback(
    (onSuccess?: () => void, onCancel?: () => void) => {
      if (user) {
        onSuccess?.();
        return true;
      }
      if (open) return false; // النافذة مفتوحة بالفعل — لا تُعِد فتحها
      pending.current = { onSuccess, onCancel };
      setOpen(true);
      return false;
    },
    [user, open]
  );

  const close = () => {
    setOpen(false);
    const cb = pending.current.onCancel;
    pending.current = {};
    cb?.();
  };

  const handleCredential = async (idToken: string) => {
    setBusy(true);
    try {
      const result = await loginWithGoogle(idToken);
      if (result.status === "needs_completion") {
        // احتياط (لا يحدث مع الباك الحالي): مرّر البيانات لصفحة الإكمال.
        try {
          sessionStorage.setItem(
            PENDING_GOOGLE_KEY,
            JSON.stringify({ id_token: idToken, email: result.email, full_name: result.full_name })
          );
        } catch {
          /* تجاهل */
        }
        setOpen(false);
        router.push("/auth/login");
        return;
      }
      toast.success("تم تسجيل الدخول");
      const cb = pending.current.onSuccess;
      pending.current = {};
      setOpen(false);
      cb?.();
    } catch {
      toast.error("تعذّر تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      <Dialog
        open={open}
        onClose={close}
        className="max-w-sm"
        title={
          <span className="flex items-center gap-2">
            <HomeSmile className="h-5 w-5 text-primary" />
            سجّل الدخول للمتابعة
          </span>
        }
      >
        <p className="text-sm text-gray-500 mb-5">
          بحساب Google — بلا كلمة مرور. يمكنك التصفّح كزائر، ونطلب الدخول فقط عند
          الحاجة.
        </p>
        <div className="flex justify-center py-2">
          <GoogleSignInButton onCredential={handleCredential} disabled={busy} />
        </div>
        <button
          type="button"
          onClick={close}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          لاحقاً
        </button>
      </Dialog>
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider");
  return ctx;
}
