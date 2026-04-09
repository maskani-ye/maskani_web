"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import type { City } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ShieldAlert, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const FRAUD_TYPES = [
  { value: "fake_listing", label: "إعلان وهمي" },
  { value: "scam", label: "احتيال / نصب" },
  { value: "fake_owner", label: "انتحال صفة المالك" },
  { value: "double_rent", label: "تأجير مزدوج" },
  { value: "deposit_theft", label: "سرقة عربون" },
  { value: "other", label: "أخرى" },
];

export default function CreateFraudReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    accused_name: "", accused_phone: "", accused_profile_link: "",
    fraud_type: "", title: "", details: "", city: "",
  });

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    api.get("/cities/").then((r) => setCities(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => {});
  }, [user, router]);

  const handleChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((p) => [...p, ...Array.from(e.target.files!)].slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      images.forEach((img) => fd.append("images", img));
      const { data } = await api.post("/fraud-reports/create/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم رفع البلاغ بنجاح");
      router.push(`/fraud-reports/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">رفع بلاغ احتيال</h1>
          <p className="text-gray-500 text-sm">ساعد الآخرين على تجنّب الاحتيال العقاري</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl card-shadow p-6 space-y-5">
        <Input label="عنوان البلاغ" placeholder="وصف مختصر لما حدث" value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="اسم المتهم" placeholder="الاسم الكامل" value={form.accused_name} onChange={(e) => handleChange("accused_name", e.target.value)} required />
          <Input label="رقم هاتف المتهم" placeholder="05xxxxxxxx" value={form.accused_phone} onChange={(e) => handleChange("accused_phone", e.target.value)} dir="ltr" />
        </div>
        <Input label="رابط الإعلان أو البروفايل" placeholder="https://..." value={form.accused_profile_link} onChange={(e) => handleChange("accused_profile_link", e.target.value)} dir="ltr" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="نوع الاحتيال" options={FRAUD_TYPES} value={form.fraud_type} onChange={(e) => handleChange("fraud_type", e.target.value)} required placeholder="اختر النوع" />
          <Select label="المدينة" options={cities.map((c) => ({ value: c.id, label: c.name_ar }))} value={form.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="اختر المدينة" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">تفاصيل البلاغ <span className="text-red-500">*</span></label>
          <textarea
            value={form.details}
            onChange={(e) => handleChange("details", e.target.value)}
            rows={5}
            placeholder="اشرح ما حدث بالتفصيل — كلما كانت التفاصيل أدق كان البلاغ أكثر مصداقية"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">أدلة وصور (حتى 5 صور)</label>
          <label className="flex items-center justify-center gap-2 h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">اضغط لرفع الصور</span>
            <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
          </label>
          {images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-14 rounded-xl overflow-hidden">
                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg" variant="danger">
          <ShieldAlert className="h-4 w-4" />
          نشر البلاغ
        </Button>
      </form>
    </div>
  );
}
