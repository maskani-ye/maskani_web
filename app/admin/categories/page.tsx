"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { ServiceCategoryItem, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ServiceIcon } from "@/lib/serviceIcons";
import { IconPicker } from "@/components/ui/IconPicker";
import { toast } from "sonner";
import {
  Widget, AddCircle, CloseCircle, TrashBinTrash,
} from "@solar-icons/react";

// ─── Form ───────────────────────────────────────────────────────────────────

interface CategoryForm {
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  is_active: boolean;
  order: number;
}

const emptyForm: CategoryForm = {
  name_ar: "", name_en: "", slug: "", icon: "", is_active: true, order: 0,
};

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminServiceCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const [modal, setModal] = useState<{ open: boolean; editing: ServiceCategoryItem | null }>({ open: false, editing: null });
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceCategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const fetchCategories = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<ServiceCategoryItem>>("/admin/service-categories/", {
        params: { offset: off, limit: LIMIT },
      });
      setCategories(res.data.results ?? []);
      setTotal(res.data.count ?? 0);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(0); }, [fetchCategories]);

  // ── open modals ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...emptyForm, order: categories.length });
    setSlugTouched(false);
    setModal({ open: true, editing: null });
  };

  const openEdit = (cat: ServiceCategoryItem) => {
    setForm({
      name_ar: cat.name_ar, name_en: cat.name_en, slug: cat.slug,
      icon: cat.icon, is_active: cat.is_active, order: cat.order,
    });
    setSlugTouched(true);
    setModal({ open: true, editing: cat });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  // ── name_en → suggest slug (only if user hasn't manually edited it) ────────
  const onNameEnChange = (value: string) => {
    setForm((p) => ({
      ...p,
      name_en: value,
      slug: slugTouched ? p.slug : slugify(value),
    }));
  };

  const save = async () => {
    if (!form.name_ar.trim()) {
      toast.error("الاسم بالعربية مطلوب");
      return;
    }
    const payload = {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim(),
      slug: form.slug.trim(),
      icon: form.icon.trim(),
      is_active: form.is_active,
      order: Number(form.order) || 0,
    };
    setSaving(true);
    try {
      if (modal.editing) {
        await api.patch(`/admin/service-categories/${modal.editing.id}/`, payload);
        toast.success("تم تعديل الصنف");
      } else {
        await api.post("/admin/service-categories/", payload);
        toast.success("تم إضافة الصنف");
      }
      closeModal();
      fetchCategories(offset);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleActive = async (cat: ServiceCategoryItem) => {
    try {
      const res = await api.patch<ServiceCategoryItem>(`/admin/service-categories/${cat.id}/`, { is_active: !cat.is_active });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, ...res.data } : c)));
      toast.success(cat.is_active ? "تم تعطيل الصنف" : "تم تفعيل الصنف");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/service-categories/${deleteTarget.id}/`);
      toast.success("تم حذف الصنف");
      setDeleteTarget(null);
      fetchCategories(offset);
    } catch (err) {
      // الـ backend يمنع الحذف إن كان مرتبطاً بمزوّدين — نُظهر رسالته
      toast.error(getErrorMessage(err));
    } finally { setDeleting(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Widget className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">أصناف الخدمات</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString("ar-YE")} صنف</p>
          </div>
        </div>
        <Button onClick={openAdd}>
          <AddCircle className="h-4 w-4" />
          إضافة صنف
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Widget className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد أصناف بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-right py-3 px-4 font-semibold">الترتيب</th>
                <th className="text-right py-3 px-4 font-semibold">الأيقونة</th>
                <th className="text-right py-3 px-4 font-semibold">الاسم بالعربية</th>
                <th className="text-right py-3 px-4 font-semibold hidden sm:table-cell">الاسم بالإنجليزية</th>
                <th className="text-right py-3 px-4 font-semibold hidden md:table-cell">المعرّف (slug)</th>
                <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                <th className="text-right py-3 px-4 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-gray-400">{cat.order}</td>
                  <td className="py-3 px-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <ServiceIcon icon={cat.icon} className="h-5 w-5" />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {cat.name_ar}
                    {typeof cat.providers_count === "number" && (
                      <span className="text-xs text-gray-400 font-normal mr-2">({cat.providers_count} مزوّد)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">{cat.name_en || "—"}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{cat.slug || "—"}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleActive(cat)}>
                      {cat.is_active ? (
                        <Badge variant="green">مفعّل</Badge>
                      ) : (
                        <Badge variant="gray">معطّل</Badge>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)} className="text-xs text-primary hover:underline font-medium">تعديل</button>
                      <button onClick={() => setDeleteTarget(cat)} className="text-xs text-red-500 hover:underline font-medium">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {offset + 1}–{Math.min(offset + LIMIT, total)} من {total}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => fetchCategories(offset - LIMIT)}>السابق</Button>
                <Button size="sm" variant="outline" disabled={offset + LIMIT >= total} onClick={() => fetchCategories(offset + LIMIT)}>التالي</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal.open && (
        <Modal title={modal.editing ? "تعديل صنف" : "إضافة صنف"} onClose={closeModal}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="الاسم بالعربية"
                required
                value={form.name_ar}
                onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
              />
              <Input
                label="الاسم بالإنجليزية"
                value={form.name_en}
                onChange={(e) => onNameEnChange(e.target.value)}
              />
            </div>

            <Input
              label="المعرّف (slug)"
              value={form.slug}
              hint="يُقترح تلقائياً من الاسم الإنجليزي — يمكنك تعديله"
              onChange={(e) => { setSlugTouched(true); setForm((p) => ({ ...p, slug: e.target.value })); }}
            />

            {/* Icon picker */}
            <IconPicker
              label="الأيقونة"
              value={form.icon}
              onChange={(k) => setForm((p) => ({ ...p, icon: k }))}
            />

            <div className="grid grid-cols-2 gap-3 items-end">
              <Input
                label="الترتيب"
                type="number"
                value={form.order}
                onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
              />
              <label className="flex items-center gap-2 cursor-pointer h-11">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">مفعّل</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={save} loading={saving} fullWidth>حفظ</Button>
            <Button variant="outline" onClick={closeModal} fullWidth>إلغاء</Button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <Modal title="تأكيد الحذف" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-600 text-sm mb-6">
            سيتم حذف الصنف <strong>{deleteTarget.name_ar}</strong> نهائياً.
            {typeof deleteTarget.providers_count === "number" && deleteTarget.providers_count > 0 && (
              <span className="block mt-2 text-red-500">
                يوجد {deleteTarget.providers_count} مزوّد مرتبط بهذا الصنف — قد يمنع النظام الحذف.
              </span>
            )}
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

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl card-shadow w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <CloseCircle className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
