"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Home2, Phone, Lock, User, Eye, EyeClosed } from "@solar-icons/react";
import { toast } from "sonner";
import { getErrorMessage, api } from "@/lib/api";
import type { City } from "@/types";

const roleOptions = [
  { value: "client", label: "عميل (أبحث عن عقار)" },
  { value: "owner", label: "مالك عقار" },
  { value: "broker", label: "دلال / وسيط" },
  { value: "service_provider", label: "مزود خدمة (مهندس / مقاول...)" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    phone: "", full_name: "", password: "", password_confirm: "",
    role: "client", city: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const { register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        ...form,
        city: form.city ? (parseInt(form.city) as unknown as undefined) : undefined,
      } as Parameters<typeof register>[0]);
      toast.success("مرحباً بك في مسكني! تم إنشاء حسابك بنجاح");
      router.push("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Home2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-primary">مسكني</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">إنشاء حساب جديد</p>
        </div>

        <div className="bg-white rounded-3xl card-shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="الاسم الكامل"
              placeholder="محمد أحمد"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              startIcon={<User className="h-4 w-4" />}
              required
            />
            <Input
              label="رقم الهاتف"
              type="tel"
              placeholder="05xxxxxxxx"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              startIcon={<Phone className="h-4 w-4" />}
              required
              dir="ltr"
            />
            <Select
              label="نوع الحساب"
              options={roleOptions}
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              required
            />
            <Select
              label="المدينة"
              options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="اختر مدينتك"
            />
            <Input
              label="كلمة المرور"
              type={showPassword ? "text" : "password"}
              placeholder="8 أحرف على الأقل"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              startIcon={<Lock className="h-4 w-4" />}
              endIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />
            <Input
              label="تأكيد كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={form.password_confirm}
              onChange={(e) => handleChange("password_confirm", e.target.value)}
              startIcon={<Lock className="h-4 w-4" />}
              required
            />

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              إنشاء الحساب
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              لديك حساب؟{" "}
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
