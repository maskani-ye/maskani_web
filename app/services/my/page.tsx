"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { PhoneField } from "@/components/ui/PhoneField";
import { SuggestDescriptionButton } from "@/components/ai/SuggestDescriptionButton";
import { ImproveTextButton } from "@/components/ai/ImproveTextButton";
import { AddCircle, TrashBinTrash, PenNewSquare, CloseCircle } from "@solar-icons/react";
import { compressImage } from "@/lib/imageCompression";

interface ServiceCategory { id: number; name_ar: string; icon?: string | null }
interface CityItem { id: number; name_ar?: string; name?: string }
interface PortfolioItem { id: number; title?: string; image: string }
interface MyService {
  id: number;
  title: string;
  category: { id: number; name_ar?: string } | number | null;
  description: string;
  video_url: string;
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
  video_url: "",
  experience_years: "" as number | "",
  contact_phone: "",
  contact_whatsapp: "",
  cities: [] as number[],
};

const field = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export default function MyServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const router = useRouter();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [services, setServices] = useState<MyService[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MyService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<MyService | null>(null);

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get(ep.serviceCategories).then((r) => setCategories(r.data.results ?? r.data ?? [])).catch(() => {});
    api.get(ep.cities).then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  const loadMine = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // /services/my/ يُرجع قائمة (قد تكون متعددة) — بلا ترقيم
      const { data } = await api.get<MyService[] | { results: MyService[] }>(ep.servicesMine);
      const list = Array.isArray(data) ? data : data.results ?? [];
      setServices(list);
      setShowForm(list.length === 0); // لا خدمات بعد → افتح نموذج الإنشاء
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadMine();
  }, [authLoading, user, loadMine]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPortfolio([]);
    setShowForm(true);
  };

  const openEdit = (s: MyService) => {
    setEditing(s);
    setPortfolio(s.portfolio ?? []);
    setForm({
      title: s.title ?? "",
      category: (typeof s.category === "object" && s.category ? s.category.id : (s.category as number)) ?? "",
      description: s.description ?? "",
      video_url: s.video_url ?? "",
      experience_years: s.experience_years ?? "",
      contact_phone: s.contact_phone ?? "",
      contact_whatsapp: s.contact_whatsapp ?? "",
      cities: s.cities ?? [],
    });
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      video_url: form.video_url,
      experience_years: form.experience_years === "" ? 0 : form.experience_years,
      contact_phone: form.contact_phone,
      contact_whatsapp: form.contact_whatsapp,
      cities: form.cities,
    };
    try {
      if (editing) {
        await api.patch(ep.serviceUpdate(editing.id), body);
        toast.success("تم تحديث الخدمة");
      } else {
        await api.post(ep.serviceCreate, body);
        toast.success("تم إنشاء الخدمة");
      }
      setShowForm(false);
      setEditing(null);
      loadMine();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const remove = (s: MyService) => setConfirmTarget(s);

  const confirmRemove = async () => {
    const s = confirmTarget;
    if (!s) return;
    setDeletingId(s.id);
    try {
      await api.delete(ep.serviceDelete(s.id));
      toast.success("تم حذف الخدمة");
      if (editing?.id === s.id) { setShowForm(false); setEditing(null); }
      setConfirmTarget(null);
      loadMine();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeletingId(null); }
  };

  const addPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editing) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", await compressImage(file));
      fd.append("provider", String(editing.id)); // أيّ خدمة (المستخدم قد يملك عدّة)
      const { data } = await api.post<PortfolioItem>(ep.portfolioAdd, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPortfolio((p) => [...p, data]);
      toast.success("تمت إضافة الصورة");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const deletePortfolio = async (id: number) => {
    try {
      await api.delete(ep.portfolioDelete(id));
      setPortfolio((p) => p.filter((x) => x.id !== id));
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (authLoading || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8"><div className="h-96 bg-gray-100 animate-pulse rounded-2xl" /></div>;
  }

  const catName = (s: MyService) =>
    typeof s.category === "object" && s.category ? s.category.name_ar ?? "" :
    categories.find((c) => c.id === s.category)?.name_ar ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">خدماتي</h1>
        {!showForm && (
          <Button onClick={openCreate}><AddCircle className="h-4 w-4" /> أضف خدمة</Button>
        )}
      </div>

      {/* قائمة خدماتي */}
      {services.length > 0 && (
        <div className="space-y-3 mb-6">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl card-shadow p-4 flex items-center gap-3">
              <Link href={`/services/${s.id}`} className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{catName(s)}</p>
              </Link>
              <button onClick={() => openEdit(s)} className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary/10 flex items-center justify-center text-gray-500 hover:text-primary" title="تعديل">
                <PenNewSquare className="h-4 w-4" />
              </button>
              <button onClick={() => remove(s)} disabled={deletingId === s.id} className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600 disabled:opacity-50" title="حذف">
                <TrashBinTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* نموذج إنشاء/تعديل */}
      {showForm && (
        <div className="bg-white rounded-2xl card-shadow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">{editing ? "تعديل الخدمة" : "خدمة جديدة"}</h2>
            {services.length > 0 && (
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600">
                <CloseCircle className="h-5 w-5" />
              </button>
            )}
          </div>

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
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <SuggestDescriptionButton kind="service" title={form.title} onSuggest={(d) => setForm((f) => ({ ...f, description: d }))} />
              {form.description?.trim().length >= 10 && (
                <ImproveTextButton kind="service" text={form.description} onImprove={(d) => setForm((f) => ({ ...f, description: d }))} />
              )}
            </div>
            <textarea rows={3} className={`${field} resize-none`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="اكتب وصفاً لخدمتك..." />
          </div>
          <div>
            {/* فيديو أعمال المزوّد — أقنع من وصف مكتوب. */}
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط فيديو يوتيوب (اختياري)</label>
            <input
              className={field}
              dir="ltr"
              placeholder="https://youtu.be/..."
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">سنوات الخبرة</label>
              <input type="number" min={0} className={field} value={form.experience_years} onChange={(e) => setForm((f) => ({ ...f, experience_years: e.target.value ? Number(e.target.value) : "" }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم التواصل *</label>
              <PhoneField label="" value={form.contact_phone} onChange={(v) => setForm((f) => ({ ...f, contact_phone: v }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">واتساب (اختياري)</label>
            <PhoneField label="" value={form.contact_whatsapp} onChange={(v) => setForm((f) => ({ ...f, contact_whatsapp: v }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">مدن الخدمة * (اختر واحدة أو أكثر)</label>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => {
                const on = form.cities.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggleCity(c.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${on ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"}`}>
                    {c.name_ar ?? c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={save} loading={saving} fullWidth>{editing ? "حفظ التغييرات" : "إنشاء الخدمة"}</Button>

          {/* معرض الأعمال — عند التعديل فقط */}
          {editing && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">معرض الأعمال</h3>
                <label className="text-sm text-primary font-medium cursor-pointer">
                  {uploading ? "جارٍ الرفع..." : "+ إضافة صورة"}
                  <input type="file" accept="image/*" className="hidden" onChange={addPortfolio} disabled={uploading} />
                </label>
              </div>
              {portfolio.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">لا توجد صور بعد</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {portfolio.map((p) => (
                    <div key={p.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                      <img src={p.image} alt={p.title ?? ""} className="w-full h-full object-cover" />
                      <button onClick={() => deletePortfolio(p.id)} className="absolute top-1 left-1 bg-black/50 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="حذف الخدمة"
        message={confirmTarget ? `هل تريد حذف خدمة «${confirmTarget.title}»؟` : undefined}
        confirmLabel="حذف"
        variant="danger"
        loading={deletingId != null}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
