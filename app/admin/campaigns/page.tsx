"use client";

import { useState, useEffect, useCallback } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import type { PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { MARKETS, MARKET_NAMES } from "@/lib/markets";
import { compressImage } from "@/lib/imageCompression";
import { toast } from "sonner";
import { Sale, AddCircle, CloseCircle, TrashBinTrash } from "@solar-icons/react";

// إعلانات مسكني الخاصّة — بانرات لأيّ معلن (OxFile أو غيره)، تظهر في المواضع
// المختارة من الموقع والتطبيق. الظهور يُعدّ حين يُرى الإعلان، والنقرة تمرّ بالخادم.

interface AdminCampaign {
  id: number;
  name: string;
  advertiser: string;
  label: string;
  headline: string;
  body: string;
  cta_label: string;
  target_url: string;
  image: string | null;
  placements: string[];
  countries: string[];
  platforms: string[];
  keywords: string[];
  priority: number;
  spotlight_every_hours: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  last_7_days: { impressions: number; clicks: number };
}

interface CampaignForm {
  name: string;
  advertiser: string;
  label: string;
  headline: string;
  body: string;
  cta_label: string;
  target_url: string;
  placements: string[];
  countries: string[];
  platforms: string[];
  keywords: string;
  priority: number;
  spotlight_every_hours: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const emptyForm: CampaignForm = {
  name: "", advertiser: "", label: "إعلان", headline: "", body: "", cta_label: "اعرف أكثر",
  target_url: "https://", placements: [], countries: [], platforms: [], keywords: "", priority: 0, spotlight_every_hours: 24,
  is_active: true, starts_at: "", ends_at: "",
};

// datetime-local يعمل بالتوقيت المحلّي بلا منطقة — نحوّله إلى ISO والعكس.
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const fmt = (n: number) => n.toLocaleString(NUMERIC_LOCALE);

const PLATFORMS = [
  { value: "android", label: "أندرويد" },
  { value: "ios", label: "آيفون" },
  { value: "desktop", label: "كمبيوتر" },
];
const platformLabel = (v: string) => PLATFORMS.find((p) => p.value === v)?.label ?? v;

export default function AdminCampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<AdminCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState<{ value: string; label: string }[]>([]);

  const [modal, setModal] = useState<{ open: boolean; editing: AdminCampaign | null }>({ open: false, editing: null });
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCampaign | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<AdminCampaign>>(ep.admin.campaigns, { params: { offset: 0, limit: 100 } });
      setItems(res.data.results ?? []);
      setTotal(res.data.count ?? 0);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchItems();
    api.get<{ value: string; label: string }[]>(ep.admin.campaignPlacements)
      .then((r) => setPlacements(r.data))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [fetchItems]);

  const placementLabel = (v: string) => placements.find((p) => p.value === v)?.label ?? v;

  const openAdd = () => {
    setForm(emptyForm);
    setImage(null);
    setRemoveImage(false);
    setModal({ open: true, editing: null });
  };

  const openEdit = (c: AdminCampaign) => {
    setForm({
      name: c.name, advertiser: c.advertiser, label: c.label, headline: c.headline, body: c.body,
      cta_label: c.cta_label, target_url: c.target_url, placements: c.placements, countries: c.countries, platforms: c.platforms ?? [],
      keywords: c.keywords.join("، "), priority: c.priority, spotlight_every_hours: c.spotlight_every_hours ?? 24, is_active: c.is_active,
      starts_at: toLocalInput(c.starts_at), ends_at: toLocalInput(c.ends_at),
    });
    setImage(null);
    setRemoveImage(false);
    setModal({ open: true, editing: c });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const toggle = (key: "placements" | "countries" | "platforms", v: string) =>
    setForm((p) => ({ ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }));

  const save = async () => {
    if (!form.name.trim() || !form.headline.trim()) return toast.error("الاسم الداخلي والعنوان مطلوبان");
    if (!/^https?:\/\/.+\..+/.test(form.target_url.trim())) return toast.error("الرابط غير صالح");
    if (form.placements.length === 0) return toast.error("اختر موضعاً واحداً على الأقلّ");

    const fields = {
      name: form.name.trim(), advertiser: form.advertiser.trim(), label: form.label.trim(),
      headline: form.headline.trim(), body: form.body.trim(), cta_label: form.cta_label.trim(),
      target_url: form.target_url.trim(), priority: Number(form.priority) || 0, is_active: form.is_active,
      spotlight_every_hours: Math.max(1, Math.round(Number(form.spotlight_every_hours) || 24)),
    };
    // الكلمات تُكتب مفصولةً بفاصلة عربية أو لاتينية.
    const keywords = form.keywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean);
    const starts_at = fromLocalInput(form.starts_at);
    const ends_at = fromLocalInput(form.ends_at);

    let payload: FormData | Record<string, unknown>;
    if (image) {
      // مع صورة → multipart، والقوائم نصٌّ مفصول بفواصل (الخادم يقبل الشكلين).
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append("placements", form.placements.join(","));
      fd.append("countries", form.countries.join(","));
      fd.append("platforms", form.platforms.join(","));
      fd.append("keywords", keywords.join(","));
      fd.append("starts_at", starts_at ?? "");
      fd.append("ends_at", ends_at ?? "");
      fd.append("image", await compressImage(image));
      payload = fd;
    } else {
      payload = { ...fields, placements: form.placements, countries: form.countries, platforms: form.platforms, keywords, starts_at, ends_at };
      if (removeImage) payload.image = null;
    }

    setSaving(true);
    try {
      if (modal.editing) {
        await api.patch(ep.admin.campaign(modal.editing.id), payload);
        toast.success("تم تعديل الإعلان");
      } else {
        await api.post(ep.admin.campaigns, payload);
        toast.success("تم إضافة الإعلان");
      }
      closeModal();
      fetchItems();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleActive = async (c: AdminCampaign) => {
    try {
      const res = await api.patch<AdminCampaign>(ep.admin.campaign(c.id), { is_active: !c.is_active });
      setItems((prev) => prev.map((x) => (x.id === c.id ? res.data : x)));
      toast.success(c.is_active ? "أُوقف الإعلان" : "فُعّل الإعلان");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(ep.admin.campaign(deleteTarget.id));
      toast.success("تم حذف الإعلان");
      setDeleteTarget(null);
      fetchItems();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleting(false); }
  };

  const previewImage = image
    ? URL.createObjectURL(image)
    : removeImage ? null : modal.editing?.image ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <PageHeader icon={<Sale />} title="الإعلانات"
          subtitle={`${fmt(total)} إعلان — تظهر في الموقع والتطبيق حسب الموضع والسوق`} />
        <Button onClick={openAdd}>
          <AddCircle className="h-4 w-4" />
          إعلان جديد
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <Sale className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد إعلانات بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-x-auto">
          <table className="w-full text-body">
            <thead>
              <tr className="bg-muted-50 text-muted-500 text-caption">
                <th className="text-right py-3 px-4 font-semibold">الإعلان</th>
                <th className="text-right py-3 px-4 font-semibold hidden md:table-cell">المواضع</th>
                <th className="text-right py-3 px-4 font-semibold">الظهور</th>
                <th className="text-right py-3 px-4 font-semibold">النقرات</th>
                <th className="text-right py-3 px-4 font-semibold hidden sm:table-cell">نسبة النقر</th>
                <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                <th className="text-right py-3 px-4 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-muted-50/50 transition-colors align-top">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-caption text-muted-500 mt-0.5">
                      {c.advertiser || "—"} · أولويّة {c.priority}
                      {c.countries.length > 0 && <> · {c.countries.join("، ")}</>}
                      {(c.platforms ?? []).length > 0 && <> · {c.platforms.map(platformLabel).join("، ")} فقط</>}
                      {c.keywords.length > 0 && <> · {c.keywords.length} كلمة موضوع</>}
                    </p>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.placements.map((p) => <Badge key={p} variant="gray">{placementLabel(p)}</Badge>)}
                    </div>
                  </td>
                  <td className="py-3 px-4 tabular-nums">
                    {fmt(c.impressions)}
                    <span className="block text-caption text-muted">٧ أيام: {fmt(c.last_7_days.impressions)}</span>
                  </td>
                  <td className="py-3 px-4 tabular-nums">
                    {fmt(c.clicks)}
                    <span className="block text-caption text-muted">٧ أيام: {fmt(c.last_7_days.clicks)}</span>
                  </td>
                  <td className="py-3 px-4 tabular-nums hidden sm:table-cell">{c.ctr.toLocaleString(NUMERIC_LOCALE)}٪</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleActive(c)}>
                      {c.is_active ? <Badge variant="green">مفعّل</Badge> : <Badge variant="gray">موقوف</Badge>}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-caption text-primary hover:underline font-medium">تعديل</button>
                      <button onClick={() => setDeleteTarget(c)} className="text-caption text-danger-500 hover:underline font-medium">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal title={modal.editing ? "تعديل إعلان" : "إعلان جديد"} onClose={closeModal}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="الاسم الداخلي" required value={form.name}
                hint="للوحة فقط — لا يظهر للزائر"
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <Input label="المعلن" value={form.advertiser}
                onChange={(e) => setForm((p) => ({ ...p, advertiser: e.target.value }))} />
            </div>
            <Input label="الوسم الظاهر" value={form.label}
              hint="يظهر فوق الإعلان دائماً — مثل «إعلان» أو «من أدوات OxFile»"
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
            <Input label="العنوان" required value={form.headline} maxLength={120}
              onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} />
            <Input label="النصّ" value={form.body} maxLength={300}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="نصّ الزرّ" value={form.cta_label} maxLength={40}
                onChange={(e) => setForm((p) => ({ ...p, cta_label: e.target.value }))} />
              <Input label="الرابط" required dir="ltr" value={form.target_url}
                onChange={(e) => setForm((p) => ({ ...p, target_url: e.target.value }))} />
            </div>

            <div>
              <p className="text-body font-medium text-muted-700 mb-2">الصورة (اختيارية)</p>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*"
                  onChange={(e) => { setImage(e.target.files?.[0] ?? null); setRemoveImage(false); }}
                  className="text-caption" />
                {(modal.editing?.image || image) && !removeImage && (
                  <button type="button" className="text-caption text-danger-500 hover:underline"
                    onClick={() => { setImage(null); setRemoveImage(true); }}>إزالة الصورة</button>
                )}
              </div>
            </div>

            <div>
              <p className="text-body font-medium text-muted-700 mb-2">المواضع</p>
              <div className="flex flex-wrap gap-2">
                {placements.map((p) => (
                  <Chip key={p.value} on={form.placements.includes(p.value)} onClick={() => toggle("placements", p.value)}>
                    {p.label}
                  </Chip>
                ))}
              </div>
              {form.placements.includes("spotlight") && (
                <div className="mt-3"><Input label="تكرار النافذة المنبثقة (بالساعات)" type="number" min={1}
                  value={form.spotlight_every_hours}
                  hint="لا تظهر للزائر نفسه قبل مرور هذه المدّة. ولا تظهر في أوّل صفحة يفتحها الزائر."
                  onChange={(e) => setForm((p) => ({ ...p, spotlight_every_hours: Number(e.target.value) }))} /></div>
              )}
            </div>

            <div>
              <p className="text-body font-medium text-muted-700 mb-1">الأسواق</p>
              <p className="text-caption text-muted mb-2">بلا اختيار = كل الأسواق</p>
              <div className="flex flex-wrap gap-2">
                {MARKETS.map((m) => {
                  const code = m.toUpperCase();
                  return (
                    <Chip key={m} on={form.countries.includes(code)} onClick={() => toggle("countries", code)}>
                      {MARKET_NAMES[m]}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-body font-medium text-muted-700 mb-1">الأجهزة</p>
              <p className="text-caption text-muted mb-2">بلا اختيار = كل الأجهزة. إعلان تطبيق أندرويد ← اختر «أندرويد» وحده.</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <Chip key={p.value} on={form.platforms.includes(p.value)} onClick={() => toggle("platforms", p.value)}>
                    {p.label}
                  </Chip>
                ))}
              </div>
            </div>

            <Input label="كلمات الموضوع" value={form.keywords}
              hint="مفصولة بفاصلة. فارغة = إعلان عامّ لأيّ صفحة. وإلا يظهر حين يحوي عنوان الصفحة إحداها، ويتقدّم على العامّ إن تساوت الأولويّة."
              onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="الأولويّة" type="number" value={form.priority}
                hint="الأعلى يظهر أوّلاً — ارفعها ليتقدّم على غيره في كل المواضع"
                onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
              <Input label="يبدأ" type="datetime-local" value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))} />
              <Input label="ينتهي" type="datetime-local" value={form.ends_at}
                onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} className="rounded"
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
              <span className="text-body text-muted-700">مفعّل</span>
            </label>

            <div>
              <p className="text-body font-medium text-muted-700 mb-2">معاينة</p>
              <CampaignCard preview campaign={{
                id: modal.editing?.id ?? 0, label: form.label, advertiser: form.advertiser,
                headline: form.headline || "عنوان الإعلان", body: form.body, cta_label: form.cta_label,
                image: previewImage, target_url: form.target_url,
              }} />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={save} loading={saving} fullWidth>حفظ</Button>
            <Button variant="outline" onClick={closeModal} fullWidth>إلغاء</Button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="تأكيد الحذف" onClose={() => setDeleteTarget(null)}>
          <p className="text-muted-600 text-body mb-6">
            سيُحذف الإعلان <strong>{deleteTarget.name}</strong> وإحصاءاته نهائياً. لإيقافه مؤقّتاً اضغط حالته بدل الحذف.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" fullWidth loading={deleting} onClick={confirmDelete}>
              <TrashBinTrash className="h-4 w-4" /> حذف
            </Button>
            <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-caption font-semibold border transition-colors ${
        on ? "bg-primary text-white border-primary" : "bg-white text-muted-600 border-muted-200 hover:border-primary"
      }`}>
      {children}
    </button>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl card-shadow w-full max-w-2xl max-h-full overflow-y-auto p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-ink text-h3">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-muted-600">
            <CloseCircle className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
