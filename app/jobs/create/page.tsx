"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { Button } from "@/components/ui/Button";
import { PhoneField } from "@/components/ui/PhoneField";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { toast } from "sonner";
import { SuggestDescriptionButton } from "@/components/ai/SuggestDescriptionButton";
import { ImproveTextButton } from "@/components/ai/ImproveTextButton";

interface ServiceCategory { id: number; name_ar: string }
interface CityItem { id: number; name_ar?: string; name?: string }

export default function CreateJobPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId: globalCityId } = useCity();
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "" as number | "",
    title: "",
    description: "",
    city: "" as number | "",
    budget_min: "",
    budget_max: "",
    currency: "YER",
    duration_days: 30,
    contact_phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/services/categories/").then((r) => setCategories(r.data.results ?? r.data ?? [])).catch(() => {});
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.phone && !form.contact_phone) setForm((f) => ({ ...f, contact_phone: user.phone }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // المدينة الافتراضية: المدينة العالمية ثم مدينة المستخدم (قابلة للتغيير).
  useEffect(() => {
    setForm((f) => {
      if (f.city) return f;
      const def = globalCityId ? Number(globalCityId) : (user?.city ? Number(user.city) : "");
      return def ? { ...f, city: def } : f;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, globalCityId]);

  const save = async () => {
    if (!form.title.trim() || !form.category || !form.city || !form.description.trim()) {
      toast.error("يرجى تعبئة العنوان والتخصص والمدينة والوصف");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        category: form.category,
        title: form.title,
        description: form.description,
        city: form.city,
        currency: form.currency,
        duration_days: form.duration_days,
        contact_phone: form.contact_phone,
      };
      if (form.budget_min) body.budget_min = form.budget_min;
      if (form.budget_max) body.budget_max = form.budget_max;
      const { data } = await api.post<{ id: number }>("/jobs/create/", body);
      toast.success("تم نشر طلبك");
      router.push(`/jobs/${data.id}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const field = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/jobs" className="hover:text-primary">طلبات الخدمات</Link>
        <span>/</span><span className="text-gray-700 font-medium">طلب جديد</span>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">عنوان الطلب *</label>
          <input className={field} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثال: أحتاج سبّاكاً لإصلاح تسريب" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">التخصص *</label>
          <select className={`${field} h-11 bg-white`} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value ? Number(e.target.value) : "" }))}>
            <option value="">اختر التخصص</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="block text-sm font-medium text-gray-700">الوصف *</label>
            <SuggestDescriptionButton kind="job" title={form.title} fields={{ "المدينة": form.city }} onSuggest={(d) => setForm((f) => ({ ...f, description: d }))} />
            {form.description?.trim().length >= 10 && (
              <ImproveTextButton kind="job" text={form.description} onImprove={(d) => setForm((f) => ({ ...f, description: d }))} />
            )}
          </div>
          <textarea rows={4} className={`${field} resize-none`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="صف الخدمة التي تحتاجها بالتفصيل..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">المدينة *</label>
          <select className={`${field} h-11 bg-white`} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value ? Number(e.target.value) : "" }))}>
            <option value="">اختر المدينة</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name_ar ?? c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">أدنى ميزانية</label>
            <MoneyInput value={form.budget_min} onChange={(raw) => setForm((f) => ({ ...f, budget_min: raw }))} placeholder="اختياري" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">أقصى ميزانية</label>
            <MoneyInput value={form.budget_max} onChange={(raw) => setForm((f) => ({ ...f, budget_max: raw }))} placeholder="اختياري" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">العملة</label>
            <select className={`${field} h-11 bg-white`} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
              <option value="YER">ريال يمني</option>
              <option value="SAR">ريال سعودي</option>
              <option value="USD">دولار</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">مدة الطلب (أيام)</label>
            <input type="number" min={1} max={90} className={field} value={form.duration_days} onChange={(e) => setForm((f) => ({ ...f, duration_days: Number(e.target.value) || 30 }))} />
          </div>
          <PhoneField label="رقم التواصل" value={form.contact_phone} onChange={(v) => setForm((f) => ({ ...f, contact_phone: v }))} />
        </div>
        <Button onClick={save} loading={saving} fullWidth>نشر الطلب</Button>
      </div>
    </div>
  );
}
