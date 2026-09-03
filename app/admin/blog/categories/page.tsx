"use client";

import { useState, useEffect, useCallback } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HashtagSquare, AddCircle, TrashBinMinimalistic, Pen, AltArrowRight } from "@solar-icons/react";
import { toast } from "sonner";

interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  order: number;
  is_active: boolean;
  articles_count: number;
}

const empty = { name: "", slug: "", description: "", order: 0, is_active: true };

export default function AdminBlogCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // AdminCategoryViewSet يعيد مصفوفة خام (بلا ترقيم صفحي)
      const res = await api.get<Category[]>(ep.admin.blogCategories);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, order: items.length });
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description, order: c.order, is_active: c.is_active });
    setOpen(true);
  };

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { toast.error("اسم التصنيف مطلوب"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim(),
        order: Number(form.order) || 0, is_active: form.is_active,
      };
      if (editing) await api.patch(ep.admin.blogCategoryItem(editing.id), payload);
      else await api.post(ep.admin.blogCategories, payload);
      toast.success(editing ? "تم حفظ التصنيف" : "تم إضافة التصنيف");
      setOpen(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleActive = async (c: Category) => {
    try {
      const res = await api.patch<Category>(ep.admin.blogCategoryItem(c.id), { is_active: !c.is_active });
      setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...res.data } : x)));
      toast.success(c.is_active ? "تم تعطيل التصنيف" : "تم تفعيل التصنيف");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.delete(ep.admin.blogCategoryItem(deleteTarget.id));
      setItems((p) => p.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("تم حذف التصنيف");
    } catch (err) { toast.error(getErrorMessage(err)); } // الباك اند يمنع الحذف إن كان يحوي مقالات
    finally { setBusy(false); }
  };

  const field = "w-full border border-muted-200 rounded-xl px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-1 text-body text-muted">
        <Link href="/admin/blog" className="hover:text-primary">المدونة</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-muted-600">التصنيفات</span>
      </div>

      <PageHeader icon={<HashtagSquare />} title="تصنيفات المدونة" subtitle={`${items.length.toLocaleString(NUMERIC_LOCALE)} تصنيف`}
        actions={<Button onClick={openNew}><AddCircle className="h-4 w-4" /> تصنيف جديد</Button>} />

      <div className="bg-white rounded-2xl shadow-e2 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-muted-100">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted-50 animate-pulse m-3 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted">
            <HashtagSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا تصنيفات بعد — أنشئ أول تصنيف</p>
          </div>
        ) : (
          <div className="divide-y divide-muted-100">
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-muted-50/70 transition-colors">
                <span className="text-caption text-muted-200 tabular-nums w-6 text-center">{c.order}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink text-body">{c.name}</h3>
                    <Badge variant={c.articles_count > 0 ? "info" : "default"}>{c.articles_count} مقال</Badge>
                    {!c.is_active && <Badge variant="default">معطّل</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-caption text-muted mt-1">
                    <span dir="ltr" className="font-mono bg-muted-100 px-1.5 py-0.5 rounded">{c.slug}</span>
                    {c.description && <span className="truncate hidden sm:inline">{c.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleActive(c)} title={c.is_active ? "تعطيل" : "تفعيل"}
                    className={`text-caption font-medium px-2.5 h-9 rounded-lg ${c.is_active ? "bg-primary/10 text-primary" : "bg-muted-100 text-muted-500"}`}>
                    {c.is_active ? "مفعّل" : "معطّل"}
                  </button>
                  <button onClick={() => openEdit(c)} title="تعديل" className="w-9 h-9 rounded-lg bg-muted-50 hover:bg-primary/10 flex items-center justify-center">
                    <Pen className="h-4 w-4 text-muted-500" />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} title="حذف" className="w-9 h-9 rounded-lg bg-danger-50 hover:bg-danger-100 flex items-center justify-center">
                    <TrashBinMinimalistic className="h-4 w-4 text-danger-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-caption text-muted leading-relaxed">
        المعرّف (slug) يُستخدم في رابط صفحة التصنيف <span dir="ltr" className="font-mono">/blog/category/&lt;slug&gt;</span>.
        اتركه فارغاً للتوليد الآلي من الاسم. تغيير المعرّف يُعيد ربط مقالاته تلقائياً. لا يمكن حذف تصنيف يحوي مقالات.
      </p>

      {/* المحرّر */}
      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "تعديل التصنيف" : "تصنيف جديد"}>
        <div className="space-y-4">
          <Input label="اسم التصنيف" value={form.name} onChange={(e) => setF("name", e.target.value)} required />
          <Input label="المعرّف (slug) — اتركه فارغاً للتوليد الآلي" value={form.slug} onChange={(e) => setF("slug", e.target.value)} dir="ltr" />
          <div>
            <label className="text-body font-semibold text-muted-700 mb-1.5 block">الوصف (يظهر في صفحة التصنيف — SEO)</label>
            <textarea className={`${field} resize-none`} rows={3} value={form.description}
              onChange={(e) => setF("description", e.target.value)} maxLength={300} />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <Input label="الترتيب" type="number" value={form.order} onChange={(e) => setF("order", Number(e.target.value))} />
            <label className="flex items-center gap-2 cursor-pointer h-11">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setF("is_active", e.target.checked)} className="rounded" />
              <span className="text-body text-muted-700">مفعّل</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>إلغاء</Button>
            <Button fullWidth loading={saving} onClick={save}>{editing ? "حفظ" : "إضافة"}</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} icon={<TrashBinMinimalistic className="h-6 w-6 text-danger-500" />}
        title="حذف التصنيف؟"
        message={deleteTarget ? `«${deleteTarget.name}»${deleteTarget.articles_count > 0 ? ` — يحتوي ${deleteTarget.articles_count} مقالاً، لن يُحذف حتى تنقلها.` : " — لا يمكن التراجع."}` : ""}
        variant="danger" confirmLabel="حذف" loading={busy}
        onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
