"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import type { City } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PhoneField } from "@/components/ui/PhoneField";
import { PenNewSquare, AltArrowRight } from "@solar-icons/react";
import { toast } from "sonner";

const PROPERTY_TYPE_OPTS = [
  { value: "apartment", label: "شقة" },
  { value: "house", label: "بيت / فيلا" },
  { value: "land", label: "أرض" },
  { value: "commercial", label: "محل تجاري" },
  { value: "any", label: "أي نوع" },
];
const OFFER_TYPE_OPTS = [
  { value: "sale", label: "للشراء" },
  { value: "rent_monthly", label: "إيجار شهري" },
  { value: "rent_yearly", label: "إيجار سنوي" },
  { value: "any", label: "أي نوع" },
];
const CURRENCY_OPTS = [
  { value: "YER", label: "ريال يمني" },
  { value: "SAR", label: "ريال سعودي" },
  { value: "USD", label: "دولار" },
];

export default function CreateRequestPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    property_type: "any",
    offer_type: "any",
    city: "",
    neighborhood: "",
    budget_min: "",
    budget_max: "",
    currency: "YER",
    rooms_needed: "",
    additional_specs: "",
    contact_phone: "",
    duration_days: "30",
  });

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.phone) setForm((p) => (p.contact_phone ? p : { ...p, contact_phone: user.phone }));
  }, [user]);

  const setField = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_type || !form.offer_type || !form.city) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        property_type: form.property_type,
        offer_type: form.offer_type,
        city: Number(form.city),
        currency: form.currency,
        duration_days: Number(form.duration_days) || 30,
      };
      if (form.neighborhood) payload.neighborhood = form.neighborhood;
      if (form.budget_min) payload.budget_min = form.budget_min;
      if (form.budget_max) payload.budget_max = form.budget_max;
      if (form.rooms_needed) payload.rooms_needed = Number(form.rooms_needed);
      if (form.additional_specs) payload.additional_specs = form.additional_specs;
      if (form.contact_phone) payload.contact_phone = form.contact_phone;

      const { data } = await api.post("/requests/create/", payload);
      toast.success("تم نشر طلبك");
      // خادم الإنشاء قد لا يُرجع id — نعود لقائمة الطلبات في هذه الحالة
      router.push(data?.id ? `/requests/${data.id}` : "/requests");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/requests" className="hover:text-primary">طلبات العملاء</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 font-medium">طلب جديد</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <PenNewSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">نشر طلب عقار</h1>
          <p className="text-gray-500 text-sm">اكتب ما تبحث عنه ودع أصحاب العقارات يتواصلون معك</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl card-shadow p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Select label="نوع العقار المطلوب" options={PROPERTY_TYPE_OPTS} value={form.property_type} onChange={(e) => setField("property_type", e.target.value)} required />
          <Select label="نوع العرض" options={OFFER_TYPE_OPTS} value={form.offer_type} onChange={(e) => setField("offer_type", e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="المدينة" options={cities.map((c) => ({ value: c.id, label: c.name_ar }))} value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="اختر المدينة" required />
          <Input label="الحي المفضّل" placeholder="اختياري" value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="أقل ميزانية" type="number" placeholder="0" value={form.budget_min} onChange={(e) => setField("budget_min", e.target.value)} />
          <Input label="أعلى ميزانية" type="number" placeholder="غير محدد" value={form.budget_max} onChange={(e) => setField("budget_max", e.target.value)} />
          <Select label="العملة" options={CURRENCY_OPTS} value={form.currency} onChange={(e) => setField("currency", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="عدد الغرف المطلوبة" type="number" placeholder="أي عدد" value={form.rooms_needed} onChange={(e) => setField("rooms_needed", e.target.value)} />
          <Input label="مدة الطلب (أيام)" type="number" placeholder="30" value={form.duration_days} onChange={(e) => setField("duration_days", e.target.value)} hint="1 إلى 90 يوماً" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">مواصفات إضافية</label>
          <textarea
            value={form.additional_specs}
            onChange={(e) => setField("additional_specs", e.target.value)}
            rows={4}
            placeholder="اذكر أي تفاصيل تساعد أصحاب العقارات على فهم طلبك..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        <PhoneField label="رقم التواصل" value={form.contact_phone} onChange={(v) => setField("contact_phone", v)} />

        <Button type="submit" fullWidth loading={saving} size="lg">
          <PenNewSquare className="h-4 w-4" /> نشر الطلب
        </Button>
      </form>
    </div>
  );
}
