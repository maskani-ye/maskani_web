"use client";

import { useState, useEffect, useCallback } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotebookBookmark, AddCircle, TrashBinMinimalistic, Pen, Eye, HashtagSquare } from "@solar-icons/react";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";

const PER_PAGE = 20;

// احتياطي — التصنيفات تُجلب ديناميكياً من الباك اند (جدول Category)
const CATEGORIES_FALLBACK = [
  { value: "city_guide", label: "أدلّة المدن" },
  { value: "buying", label: "شراء العقارات" },
  { value: "renting", label: "استئجار العقارات" },
  { value: "market", label: "السوق والأسعار" },
  { value: "safety", label: "الأمان وتجنّب الاحتيال" },
  { value: "tips", label: "نصائح ومقالات" },
];
const STATUSES = [
  { value: "draft", label: "مسودّة" },
  { value: "published", label: "منشور" },
];

interface Article {
  id: number; title: string; slug: string; excerpt: string; body: string;
  cover_image: string | null; category: string; category_display: string;
  tags: string[]; author_name: string; status: string; is_featured: boolean;
  views_count: number; reading_minutes: number;
  meta_title: string; meta_description: string; meta_keywords: string;
  published_at: string | null;
}

const empty = {
  title: "", slug: "", excerpt: "", body: "", category: "tips", tags: "",
  author_name: "فريق مسكني", status: "draft", is_featured: false,
  meta_title: "", meta_description: "", meta_keywords: "",
};

export default function AdminBlogPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cats, setCats] = useState<{ value: string; label: string }[]>(CATEGORIES_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<Article | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [cover, setCover] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(PER_PAGE), offset: String(off) };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<{ count: number; results: Article[] }>(ep.admin.blog, { params });
      setItems(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  // البحث/الفلتر يعيدان للصفحة الأولى
  useEffect(() => { fetchData(0); }, [fetchData]);

  // جلب التصنيفات الديناميكية لقائمة المحرّر
  useEffect(() => {
    api.get<Array<{ value: string; label: string }>>(ep.admin.blogCategories)
      .then((res) => { if (Array.isArray(res.data) && res.data.length) setCats(res.data.map((c) => ({ value: c.value ?? (c as { slug?: string }).slug ?? "", label: c.label ?? (c as { name?: string }).name ?? "" }))); })
      .catch(() => {});
  }, []);

  const openNew = () => { setEditing(null); setForm({ ...empty }); setCover(null); setOpen(true); };
  const openEdit = (a: Article) => {
    setEditing(a);
    setForm({
      title: a.title, slug: a.slug, excerpt: a.excerpt, body: a.body, category: a.category,
      tags: (a.tags || []).join("، "), author_name: a.author_name, status: a.status,
      is_featured: a.is_featured, meta_title: a.meta_title, meta_description: a.meta_description,
      meta_keywords: a.meta_keywords,
    });
    setCover(null);
    setOpen(true);
  };

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  // توليد مقال بالذكاء الاصطناعي من فكرة
  const [genTopic, setGenTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const generate = async () => {
    if (genTopic.trim().length < 3) { toast.error("اكتب فكرة/عنوان المقال"); return; }
    setGenerating(true);
    try {
      const res = await api.post<{
        title: string; excerpt: string; body: string;
        meta_title: string; meta_description: string; meta_keywords: string; tags: string[];
      }>(ep.admin.blogGenerate, { topic: genTopic.trim(), category: form.category });
      const d = res.data;
      setForm((p) => ({
        ...p,
        title: d.title || p.title,
        excerpt: d.excerpt || p.excerpt,
        body: d.body || p.body,
        tags: (d.tags || []).join("، ") || p.tags,
        meta_title: d.meta_title || p.meta_title,
        meta_description: d.meta_description || p.meta_description,
        meta_keywords: d.meta_keywords || p.meta_keywords,
      }));
      toast.success("تم توليد مسوّدة — راجعها وعدّلها قبل النشر");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.body.trim()) {
      toast.error("العنوان والمقتطف والمحتوى مطلوبة"); return;
    }
    setSaving(true);
    try {
      const tags = form.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean);
      let payload: FormData | Record<string, unknown>;
      const base: Record<string, unknown> = {
        title: form.title, slug: form.slug, excerpt: form.excerpt, body: form.body,
        category: form.category, author_name: form.author_name, status: form.status,
        is_featured: form.is_featured, meta_title: form.meta_title,
        meta_description: form.meta_description, meta_keywords: form.meta_keywords,
      };
      if (cover) {
        const fd = new FormData();
        Object.entries(base).forEach(([k, v]) => fd.append(k, String(v)));
        tags.forEach((t) => fd.append("tags", t));
        fd.append("cover_image", await compressImage(cover));
        payload = fd;
      } else {
        payload = { ...base, tags };
      }
      const cfg = cover ? { headers: { "Content-Type": "multipart/form-data" } } : {};
      if (editing) await api.patch(ep.admin.blogItem(editing.id), payload, cfg);
      else await api.post(ep.admin.blog, payload, cfg);
      toast.success(editing ? "تم حفظ المقال" : "تم إنشاء المقال");
      setOpen(false);
      fetchData(editing ? offset : 0);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.delete(ep.admin.blogItem(deleteTarget.id));
      setItems((p) => p.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("تم حذف المقال");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const field = "w-full border border-muted-200 rounded-xl px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader icon={<NotebookBookmark />} title="المدونة" subtitle={`${total.toLocaleString(NUMERIC_LOCALE)} مقال`}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/blog/categories">
              <Button variant="outline"><HashtagSquare className="h-4 w-4" /> التصنيفات</Button>
            </Link>
            <Button onClick={openNew}><AddCircle className="h-4 w-4" /> مقال جديد</Button>
          </div>
        } />

      <Toolbar>
        <Input placeholder="ابحث بالعنوان..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select options={[{ value: "", label: "كل الحالات" }, ...STATUSES]} value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-44" />
      </Toolbar>

      <div className="bg-white rounded-2xl shadow-e2 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-muted-100">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted-50 animate-pulse m-3 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted">
            <NotebookBookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا مقالات بعد — أنشئ أول مقال</p>
          </div>
        ) : (
          <div className="divide-y divide-muted-100">
            {items.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-muted-50/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink text-body line-clamp-1">{a.title}</h3>
                    <Badge variant={a.status === "published" ? "success" : "default"}>{a.status === "published" ? "منشور" : "مسودّة"}</Badge>
                    {a.is_featured && <Badge variant="warning">مميّز</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-caption text-muted mt-1 flex-wrap">
                    <span>{a.category_display}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {a.views_count}</span>
                    <span dir="ltr" className="truncate">/blog/{a.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(a)} title="تعديل" className="w-9 h-9 rounded-lg bg-muted-50 hover:bg-primary/10 flex items-center justify-center">
                    <Pen className="h-4 w-4 text-muted-500" />
                  </button>
                  <button onClick={() => setDeleteTarget(a)} title="حذف" className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                    <TrashBinMinimalistic className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ترقيم صفحي */}
        {total > PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-muted-100">
            <span className="text-caption text-muted-500 tabular-nums">
              {offset + 1}–{Math.min(offset + PER_PAGE, total)} من {total.toLocaleString(NUMERIC_LOCALE)}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={offset === 0 || loading}
                onClick={() => fetchData(Math.max(0, offset - PER_PAGE))}>السابق</Button>
              <Button size="sm" variant="outline" disabled={offset + PER_PAGE >= total || loading}
                onClick={() => fetchData(offset + PER_PAGE)}>التالي</Button>
            </div>
          </div>
        )}
      </div>

      {/* المحرّر */}
      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "تعديل المقال" : "مقال جديد"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* توليد بالذكاء الاصطناعي */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <label className="text-caption font-semibold text-primary flex items-center gap-1.5 mb-2">
              <HashtagSquare className="h-4 w-4" /> توليد مقال بالذكاء الاصطناعي (من فكرة)
            </label>
            <div className="flex items-stretch gap-2">
              <input value={genTopic} onChange={(e) => setGenTopic(e.target.value)}
                placeholder="مثال: نصائح شراء شقة في تعز"
                className="flex-1 border border-muted-200 rounded-xl px-3 text-body h-10 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <Button size="sm" loading={generating} onClick={generate}>توليد</Button>
            </div>
            <p className="text-[11px] text-muted mt-1.5">يملأ العنوان والمحتوى وحقول SEO — راجعها قبل النشر.</p>
          </div>

          <Input label="العنوان" value={form.title} onChange={(e) => setF("title", e.target.value)} required />
          <Input label="المعرّف (slug) — اتركه فارغاً للتوليد الآلي" value={form.slug} onChange={(e) => setF("slug", e.target.value)} dir="ltr" />
          <div>
            <label className="text-body font-semibold text-muted-700 mb-1.5 block">المقتطف (يظهر في البطاقات ونتائج البحث)</label>
            <textarea className={`${field} resize-none`} rows={2} value={form.excerpt} onChange={(e) => setF("excerpt", e.target.value)} maxLength={300} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="التصنيف" options={cats} value={form.category} onChange={(e) => setF("category", e.target.value)} />
            <Select label="الحالة" options={STATUSES} value={form.status} onChange={(e) => setF("status", e.target.value)} />
          </div>
          <div>
            <label className="text-body font-semibold text-muted-700 mb-1.5 block">المحتوى (HTML — استخدم &lt;h2&gt; و&lt;p&gt; و&lt;a&gt; للروابط الداخلية)</label>
            <textarea className={`${field} font-mono text-caption leading-relaxed`} rows={12} value={form.body} onChange={(e) => setF("body", e.target.value)} dir="ltr" />
          </div>
          <Input label="الوسوم (مفصولة بفاصلة)" value={form.tags} onChange={(e) => setF("tags", e.target.value)} />
          <div>
            <label className="text-body font-semibold text-muted-700 mb-1.5 block">صورة الغلاف (للمشاركة وOG)</label>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="text-body" />
            {editing?.cover_image && !cover && <p className="text-caption text-muted mt-1">توجد صورة حالية — اختر جديدة لاستبدالها.</p>}
          </div>
          <details className="border border-muted-100 rounded-xl p-3">
            <summary className="text-body font-semibold text-muted-700 cursor-pointer">تحسين SEO (اختياري)</summary>
            <div className="space-y-3 mt-3">
              <Input label="عنوان SEO" value={form.meta_title} onChange={(e) => setF("meta_title", e.target.value)} maxLength={70} />
              <Input label="وصف SEO" value={form.meta_description} onChange={(e) => setF("meta_description", e.target.value)} maxLength={180} />
              <Input label="كلمات SEO (مفصولة بفاصلة)" value={form.meta_keywords} onChange={(e) => setF("meta_keywords", e.target.value)} />
            </div>
          </details>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setF("is_featured", e.target.checked)} className="rounded" />
            <span className="text-body text-muted-700">مقال مميّز (يظهر بارزاً)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>إلغاء</Button>
            <Button fullWidth loading={saving} onClick={save}>{editing ? "حفظ" : "نشر"}</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} icon={<TrashBinMinimalistic className="h-6 w-6 text-red-500" />}
        title="حذف المقال؟" message={deleteTarget ? `«${deleteTarget.title}» — لا يمكن التراجع.` : ""}
        variant="danger" confirmLabel="حذف" loading={busy}
        onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
