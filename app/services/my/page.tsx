"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface ServiceCategory { id: number; name_ar: string; icon?: string | null }
interface CityItem { id: number; name_ar?: string; name?: string }
interface PortfolioItem { id: number; title?: string; image: string }
interface MyService {
  id: number;
  title: string;
  category: { id: number } | number | null;
  description: string;
  experience_years: number | null;
  contact_phone: string;
  contact_whatsapp: string;
  cities: number[];
  portfolio?: PortfolioItem[];
}

const emptyForm = {
  title: "",
  category: "" as number | "",
  description: "",
  experience_years: "" as number | "",
  contact_phone: "",
  contact_whatsapp: "",
  cities: [] as number[],
};

export default function MyServicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [existing, setExisting] = useState<MyService | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/services/categories/").then((r) => setCategories(r.data.results ?? r.data ?? [])).catch(() => {});
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  const loadMine = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get<MyService>("/services/my/");
      setExisting(data);
      setPortfolio(data.portfolio ?? []);
      setForm({
        title: data.title ?? "",
        category: (typeof data.category === "object" && data.category ? data.category.id : (data.category as number)) ?? "",
        description: data.description ?? "",
        experience_years: data.experience_years ?? "",
        contact_phone: data.contact_phone ?? "",
        contact_whatsapp: data.contact_whatsapp ?? "",
        cities: data.cities ?? [],
      });
    } catch (err) {
      // 404 = لا توجد خدمة بعد → وضع الإنشاء
      if ((err as { response?: { status?: number } })?.response?.status !== 404) {
        toast.error(getErrorMessage(err));
      }
      setExisting(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadMine();
  }, [authLoading, user, loadMine]);

  const toggleCity = (id: number) =>
    setForm((f) => ({
      ...f,
      cities: f.cities.includes(id) ? f.cities.filter((c) => c !== id) : [...f.cities, id],
    }));

  const save = async () => {
    if (!form.title.trim() || !form.category || !form.contact_phone.trim() || form.cities.length === 0) {
      toast.error("يرجى تعبئة الاسم والتخصص ورقم التواصل ومدينة واحدة على الأقل");
      return;
    }
    setSaving(true);
    const body = {
      title: form.title,
      category: form.category,
      description: form.description,
      experience_years: form.experience_years === "" ? 0 : form.experience_years,
      contact_phone: form.contact_phone,
      contact_whatsapp: form.contact_whatsapp,
      cities: form.cities,
    };
    try {
      if (existing) {
        await api.patch("/services/my/", body);
        toast.success("تم تحديث خدمتك");
      } else {
        const { data } = await api.post<MyService>("/services/create/", body);
        toast.success("تم إنشاء خدمتك");
        router.push(`/services/${data.id}`);
        return;
      }
      loadMine();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const addPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post<PortfolioItem>("/services/portfolio/add/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPortfolio((p) => [...p, data]);
      toast.success("تمت إضافة الصورة");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const deletePortfolio = async (id: number) => {
    try {
      await api.delete(`/services/portfolio/${id}/delete/`);
      setPortfolio((p) => p.filter((x) => x.id !== id));
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (authLoading || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8"><div className="h-96 bg-gray-100 animate-pulse rounded-2xl" /></div>;
  }

  if (user && !user.is_service_provider && !existing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-gray-900 mb-2">إنشاء خدمة</h1>
        <p className="text-sm text-gray-500 mb-5">حسابك ليس مزوّد خدمة بعد. تواصل مع الإدارة لتفعيل مزوّد الخدمة.</p>
        <Link href="/services"><Button variant="outline">العودة للخدمات</Button></Link>
      </div>
    );
  }

  const field = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{existing ? "إدارة خدمتي" : "إنشاء خدمة"}</h1>

      <div className="bg-white rounded-2xl card-shadow p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الخدمة/النشاط *</label>
          <input className={field} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">التخصص *</label>
          <select className={`${field} h-11 bg-white`} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value ? Number(e.target.value) : "" }))}>
            <option value="">اختر التخصص</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
          <textarea rows={3} className={`${field} resize-none`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="اكتب وصفاً لخدمتك..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">سنوات الخبرة</label>
            <input type="number" min={0} className={field} value={form.experience_years} onChange={(e) => setForm((f) => ({ ...f, experience_years: e.target.value ? Number(e.target.value) : "" }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم التواصل *</label>
            <input className={field} value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="7XXXXXXXX" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">واتساب (اختياري)</label>
          <input className={field} value={form.contact_whatsapp} onChange={(e) => setForm((f) => ({ ...f, contact_whatsapp: e.target.value }))} placeholder="7XXXXXXXX" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">مدن الخدمة * (اختر واحدة أو أكثر)</label>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => {
              const on = form.cities.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCity(c.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${on ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"}`}
                >
                  {c.name_ar ?? c.name}
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={save} loading={saving} fullWidth>{existing ? "حفظ التغييرات" : "إنشاء الخدمة"}</Button>
      </div>

      {existing && (
        <div className="bg-white rounded-2xl card-shadow p-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">معرض الأعمال</h2>
            <label className="text-sm text-primary font-medium cursor-pointer">
              {uploading ? "جارٍ الرفع..." : "+ إضافة صورة"}
              <input type="file" accept="image/*" className="hidden" onChange={addPortfolio} disabled={uploading} />
            </label>
          </div>
          {portfolio.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">لا توجد صور بعد</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {portfolio.map((p) => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                  <img src={p.image} alt={p.title ?? ""} className="w-full h-full object-cover" />
                  <button
                    onClick={() => deletePortfolio(p.id)}
                    className="absolute top-1 left-1 bg-black/50 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
