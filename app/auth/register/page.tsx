"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PhoneField } from "@/components/ui/PhoneField";
import { Home2, LockPassword, User } from "@solar-icons/react";
import { toast } from "sonner";
import { getErrorMessage, api } from "@/lib/api";
import type { City } from "@/types";

export default function RegisterPage() {
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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

    if (password !== passwordConfirm) {
      const msg = "كلمتا المرور غير متطابقتين";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        phone,
        password,
        password_confirm: passwordConfirm,
        ...(city ? { city: parseInt(city, 10) } : {}),
      });
      toast.success("تم إنشاء حسابك بنجاح!");
      window.location.href = "/";
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
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
          <p className="text-gray-500 mt-2 text-sm">أنشئ حسابك وانضم إلى مسكني</p>
        </div>

        <div className="bg-white rounded-3xl card-shadow p-8">
          <h1 className="text-xl font-bold text-primary text-center mb-1">إنشاء حساب جديد</h1>
          <p className="text-center text-sm text-gray-500 mb-6">
            أدخل بياناتك لإنشاء حسابك
          </p>

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
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startIcon={<LockPassword className="h-4 w-4" />}
              required
            />
            <Input
              label="تأكيد كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              startIcon={<LockPassword className="h-4 w-4" />}
              required
            />
            <Select
              label="المدينة"
              options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="اختر مدينتك"
              required
            />

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              إنشاء الحساب
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          لديك حساب بالفعل؟{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
