"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PhoneField } from "@/components/ui/PhoneField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Home2, User } from "@solar-icons/react";
import { toast } from "sonner";
import { getErrorMessage, api } from "@/lib/api";
import type { City, User as AppUser } from "@/types";

// تنقّل كامل بعد الدخول حسب الدور — يقرأ التطبيق الجلسة من الكوكيز نظيفاً (يتفادى السباق الزمني)
function redirectByRole(role?: string) {
  window.location.href = role === "admin" ? "/admin" : "/";
}

interface CompletionState {
  idToken: string;
  email: string;
  full_name: string;
}

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionState | null>(null);

  const { loginWithGoogle, completeGoogle } = useAuth();

  // نجاح جوجل → id_token → POST /auth/google/
  const handleGoogleCredential = async (idToken: string) => {
    setInlineError(null);
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(idToken);
      if (result.status === "success") {
        toast.success("مرحباً بك في مسكني!");
        redirectByRole(result.user.role);
      } else {
        setCompletion({
          idToken,
          email: result.email,
          full_name: result.full_name,
        });
      }
    } catch (err) {
      setInlineError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Home2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-primary">مسكني</span>
          </div>
          <p className="text-gray-500 mt-2 text-sm">مرحباً بك في مسكني</p>
        </div>

        {completion ? (
          <GoogleCompletionForm
            completion={completion}
            onCancel={() => setCompletion(null)}
            onComplete={completeGoogle}
            onDone={(user) => {
              toast.success("مرحباً بك في مسكني!");
              redirectByRole(user.role);
            }}
          />
        ) : (
          <div className="bg-white rounded-3xl card-shadow p-8">
            <h1 className="text-xl font-bold text-primary text-center mb-1">تسجيل الدخول</h1>
            <p className="text-center text-sm text-gray-500 mb-6">
              سجّل دخولك للمتابعة إلى حسابك
            </p>

            {inlineError && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
                {inlineError}
              </div>
            )}

            <div aria-busy={googleLoading}>
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                disabled={googleLoading}
              />
            </div>
            {googleLoading && (
              <p className="text-center text-xs text-gray-400 mt-3">جارٍ التحقق…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── نموذج استكمال بيانات مستخدم جوجل الجديد ─────────────────────────────
interface CompletionFormProps {
  completion: CompletionState;
  onComplete: ReturnType<typeof useAuth>["completeGoogle"];
  onDone: (user: AppUser) => void;
  onCancel: () => void;
}

function GoogleCompletionForm({
  completion,
  onComplete,
  onDone,
  onCancel,
}: CompletionFormProps) {
  const [fullName, setFullName] = useState(completion.full_name);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/cities/", { params: { offset: 0, limit: 100 } })
      .then((r) => setCities(r.data.results ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await onComplete({
        idToken: completion.idToken,
        phone,
        city: city ? parseInt(city, 10) : undefined,
        full_name: fullName.trim() || undefined,
      });
      if (result.status === "success") {
        onDone(result.user);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl card-shadow p-8">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-md mb-3">
          <User className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-lg font-bold text-primary">خطوة أخيرة</h2>
        <p className="text-sm text-gray-500 mt-1">أكمل بياناتك لإنشاء حسابك في مسكني</p>
        {completion.email && (
          <p className="text-xs text-gray-400 mt-1">{completion.email}</p>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="الاسم الكامل"
          placeholder="محمد أحمد"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          startIcon={<User className="h-4 w-4" />}
          required
        />
        <PhoneField value={phone} onChange={setPhone} required />
        <Select
          label="المدينة (اختياري)"
          options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="اختر مدينتك"
        />

        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
          إكمال التسجيل
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-sm text-gray-400 hover:text-gray-600 mt-1"
        >
          رجوع
        </button>
      </form>
    </div>
  );
}
