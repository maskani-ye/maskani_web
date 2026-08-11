"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Bell, CloseCircle } from "@solar-icons/react";

interface NotificationTemplate {
  id: number;
  event_type: string;
  event_type_display: string;
  title_template: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
}

export default function AdminNotificationTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState({ title_template: "", body_template: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // القائمة تُرجَع كمصفوفة خام (بلا ترقيم) من الـ backend.
      const res = await api.get<NotificationTemplate[]>(ep.admin.notificationTemplates);
      const data = res.data as NotificationTemplate[] | { results?: NotificationTemplate[] };
      setItems(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openEdit = (t: NotificationTemplate) => {
    setForm({ title_template: t.title_template, body_template: t.body_template, is_active: t.is_active });
    setEditing(t);
  };

  const save = async () => {
    if (!editing) return;
    if (!form.title_template.trim() || !form.body_template.trim()) {
      toast.error("العنوان والنص مطلوبان");
      return;
    }
    setSaving(true);
    try {
      await api.patch(ep.admin.notificationTemplate(editing.id), {
        title_template: form.title_template.trim(),
        body_template: form.body_template.trim(),
        is_active: form.is_active,
      });
      toast.success("تم حفظ القالب");
      setEditing(null);
      fetchItems();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: NotificationTemplate) => {
    try {
      const res = await api.patch<NotificationTemplate>(ep.admin.notificationTemplate(t.id), {
        is_active: !t.is_active,
      });
      setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...res.data } : x)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <PageHeader icon={<Bell />} title="قوالب الإشعارات"
          subtitle="عنوان ونصّ كل نوع إشعار — المتغيّرات بين الأقواس تُحقن تلقائياً عند الإرسال" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-right py-3 px-4 font-semibold">النوع</th>
                <th className="text-right py-3 px-4 font-semibold">العنوان</th>
                <th className="text-right py-3 px-4 font-semibold hidden md:table-cell">النص</th>
                <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                <th className="text-right py-3 px-4 font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-800">{t.event_type_display}</td>
                  <td className="py-3 px-4 text-gray-700">{t.title_template}</td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell max-w-xs truncate">
                    {t.body_template}
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
                    <button
                      onClick={() => openEdit(t)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={`تعديل: ${editing.event_type_display}`} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <Input
              label="العنوان"
              required
              value={form.title_template}
              onChange={(e) => setForm((p) => ({ ...p, title_template: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">النص</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none min-h-[90px] focus:border-primary focus:ring-1 focus:ring-primary"
                value={form.body_template}
                onChange={(e) => setForm((p) => ({ ...p, body_template: e.target.value }))}
              />
            </div>
            {editing.variables.length > 0 && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                المتغيّرات المتاحة:
                {editing.variables.map((v) => (
                  <code
                    key={v}
                    className="mx-1 bg-white border border-gray-200 px-1.5 py-0.5 rounded text-primary"
                  >
                    {`{${v}}`}
                  </code>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">مفعّل</span>
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={save} loading={saving} fullWidth>
              حفظ
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} fullWidth>
              إلغاء
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl card-shadow w-full max-w-lg p-6 relative">
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
