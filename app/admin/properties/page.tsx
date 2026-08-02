"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import type { PropertyTypeItem, PaginatedResponse } from "@/types";
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

interface PropertyTypeForm {
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  is_active: boolean;
  order: number;
}

const emptyForm: PropertyTypeForm = {
  name_ar: "", name_en: "", slug: "", icon: "", is_active: true, order: 0,
};

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPropertyTypesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [types, setTypes] = useState<PropertyTypeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const [modal, setModal] = useState<{ open: boolean; editing: PropertyTypeItem | null }>({ open: false, editing: null });
  const [form, setForm] = useState<PropertyTypeForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PropertyTypeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const fetchTypes = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<PropertyTypeItem>>(ep.admin.propertyTypes, {
        params: { offset: off, limit: LIMIT },
      });
      setTypes(res.data.results ?? []);
      setTotal(res.data.count ?? 0);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(0); }, [fetchTypes]);

  // ── open modals ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...emptyForm, order: types.length });
    setSlugTouched(false);
    setModal({ open: true, editing: null });
  };

  const openEdit = (t: PropertyTypeItem) => {
    setForm({
      name_ar: t.name_ar, name_en: t.name_en, slug: t.slug,
      icon: t.icon, is_active: t.is_active, order: t.order,
    });
    setSlugTouched(true);
    setModal({ open: true, editing: t });
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
        await api.patch(ep.admin.propertyType(modal.editing.id), payload);
        toast.success("تم تعديل نوع العقار");
      } else {
        await api.post(ep.admin.propertyTypes, payload);
        toast.success("تم إضافة نوع العقار");
      }
      closeModal();
      fetchTypes(offset);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleActive = async (t: PropertyTypeItem) => {
    try {
      const res = await api.patch<PropertyTypeItem>(ep.admin.propertyType(t.id), { is_active: !t.is_active });
      setTypes((prev) => prev.map((c) => (c.id === t.id ? { ...c, ...res.data } : c)));
      toast.success(t.is_active ? "تم تعطيل النوع" : "تم تفعيل النوع");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(ep.admin.propertyType(deleteTarget.id));
      toast.success("تم حذف نوع العقار");
      setDeleteTarget(null);
      fetchTypes(offset);
    } catch (err) {
      // الـ backend يمنع الحذف إن كان مرتبطاً بإعلانات — نُظهر رسالته
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
            <h1 className="text-xl font-bold text-gray-900">أنواع العقارات</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString("ar-YE")} نوع</p>
          </div>
        </div>
        <Button onClick={openAdd}>
          <AddCircle className="h-4 w-4" />
          إضافة نوع
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Widget className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد أنواع بعد</p>
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
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-gray-400">{t.order}</td>
                  <td className="py-3 px-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <ServiceIcon icon={t.icon} className="h-5 w-5" />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {t.name_ar}
                    {typeof t.listings_count === "number" && (
                      <span className="text-xs text-gray-400 font-normal mr-2">({t.listings_count} إعلان)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">{t.name_en || "—"}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{t.slug || "—"}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleActive(t)}>
                      {t.is_active ? (
                        <Badge variant="green">مفعّل</Badge>
                      ) : (
                        <Badge variant="gray">معطّل</Badge>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="text-xs text-primary hover:underline font-medium">تعديل</button>
                      <button onClick={() => setDeleteTarget(t)} className="text-xs text-red-500 hover:underline font-medium">حذف</button>
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
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => fetchTypes(offset - LIMIT)}>السابق</Button>
                <Button size="sm" variant="outline" disabled={offset + LIMIT >= total} onClick={() => fetchTypes(offset + LIMIT)}>التالي</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal.open && (
        <Modal title={modal.editing ? "تعديل نوع" : "إضافة نوع"} onClose={closeModal}>
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
            سيتم حذف النوع <strong>{deleteTarget.name_ar}</strong> نهائياً.
            {typeof deleteTarget.listings_count === "number" && deleteTarget.listings_count > 0 && (
              <span className="block mt-2 text-red-500">
                يوجد {deleteTarget.listings_count} إعلان مرتبط بهذا النوع — قد يمنع النظام الحذف.
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
