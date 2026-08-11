"use client";

import { useState } from "react";
import { Smartphone, CheckCircle } from "@solar-icons/react";
import { useAuth } from "@/context/AuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { api, getErrorStatus } from "@/lib/api";

const STORE = "https://play.google.com/store/apps/details?id=ar.dev.maskani";
// مفعّل فقط بعد ضبط Cloud Identity + مجموعة المختبِرين على الخادم.
const ENABLED = process.env.NEXT_PUBLIC_TESTER_ENROLL === "1";

// تفعيل المختبِر بضغطة، بلا مغادرة المنصة: تسجيل Google (إن لزم) ثم استدعاء
// endpoint يضيف بريد المستخدم لمجموعة الاختبار المغلق في Play.
export function TesterEnroll() {
  const { user, loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!ENABLED) return null;

  async function handleCredential(idToken: string) {
    setErr(null);
    setBusy(true);
    try {
      await loginWithGoogle(idToken);
    } catch {
      setErr("تعذّر تسجيل الدخول بجوجل. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  async function enroll() {
    setErr(null);
    setBusy(true);
    try {
      await api.post("/auth/enroll-tester/");
      setDone(true);
    } catch (e: unknown) {
      const status = getErrorStatus(e);
      setErr(
        status === 503
          ? "التفعيل التلقائي غير متاح حالياً — استخدم الخطوات اليدوية أدناه."
          : "تعذّر التفعيل الآن — جرّب الخطوات اليدوية أدناه.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-primary-50 ring-1 ring-primary-100 p-6 mb-8 text-center">
      {done ? (
        <div className="flex flex-col items-center">
          <CheckCircle weight="Bold" className="h-12 w-12 text-success mb-3" />
          <h3 className="font-extrabold text-ink text-lg">تم تفعيل حسابك كمختبِر ✓</h3>
          <p className="text-sm text-muted mt-1 mb-4 max-w-md">
            بريدك مسجّل الآن في برنامج الاختبار. ثبّت التطبيق مباشرةً من Google Play
            (قد يستغرق ظهور الوصول بضع دقائق).
          </p>
          <a
            href={STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary text-white font-bold px-6 py-3 hover:bg-primary-600 transition-colors"
          >
            <Smartphone weight="Bold" className="h-5 w-5" />
            تثبيت من Google Play
          </a>
        </div>
      ) : (
        <>
          <span className="inline-block rounded-full bg-gold/20 text-primary text-xs font-bold px-3 py-1.5 mb-3">
            الأسرع — بضغطة واحدة
          </span>
          <h3 className="font-extrabold text-ink text-lg">فعّل التطبيق فوراً</h3>
          <p className="text-sm text-muted mt-1 mb-4 max-w-md mx-auto">
            سجّل دخولك بحساب Google ونحن نسجّلك كمختبِر تلقائياً — دون مغادرة الصفحة.
          </p>

          {user ? (
            <button
              onClick={enroll}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary text-white font-bold px-6 py-3 hover:bg-primary-600 transition-colors disabled:opacity-60"
            >
              <Smartphone weight="Bold" className="h-5 w-5" />
              {busy ? "جارٍ التفعيل…" : "فعّل حسابي كمختبِر"}
            </button>
          ) : (
            <div className="flex justify-center">
              <GoogleSignInButton onCredential={handleCredential} disabled={busy} />
            </div>
          )}

          {err && <p className="text-sm text-danger mt-3">{err}</p>}
        </>
      )}
    </div>
  );
}
