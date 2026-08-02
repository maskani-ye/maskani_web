"use client";

// لوحة إدارة «طلبات الخدمة» (jobs / ServiceRequest) — مسار admin_v1 حصراً.
import { useState, useEffect, useCallback } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Case, MapPoint, TrashBinMinimalistic, CheckCircle, CloseCircle } from "@solar-icons/react";
import { toast } from "sonner";

interface AdminServiceRequest {
  id: number;
  client_name: string;
  client_phone: string;
  category_name: string | null;
  title: string;
  description: string;
  city_name: string | null;
  budget_min: string | null;
  budget_max: string | null;
  currency: string;
  status: string;
  is_active: boolean;
  offers_count: number;
  created_at: string;
}

const LIMIT = 20;

export default function AdminJobsPage() {
  const [items, setItems] = useState<AdminServiceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminServiceRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { offset, limit: LIMIT };
      if (search) params.search = search;
      if (activeFilter) params.is_active = activeFilter;
      const res = await api.get<{ count: number; results: AdminServiceRequest[] }>(
        ep.admin.jobs, { params }
      );
      setItems(res.data.results);
      setTotal(res.data.count);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [offset, search, activeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleActive = async (r: AdminServiceRequest) => {
    try {
      const res = await api.patch<AdminServiceRequest>(ep.admin.job(r.id), { is_active: !r.is_active });
      setItems((prev) => prev.map((x) => (x.id === r.id ? res.data : x)));
      toast.success(res.data.is_active ? "تم تفعيل الطلب" : "تم إيقاف الطلب");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.delete(ep.admin.job(deleteTarget.id));
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("تم حذف الطلب");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const budgetOf = (r: AdminServiceRequest) =>
    r.budget_min && r.budget_max ? `${formatPrice(r.budget_min, r.currency)} — ${formatPrice(r.budget_max, r.currency)}`
    : r.budget_max ? `حتى ${formatPrice(r.budget_max, r.currency)}`
    : r.budget_min ? `من ${formatPrice(r.budget_min, r.currency)}` : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Case className="h-6 w-6 text-primary" /> طلبات الخدمة
        </h1>
        <p className="text-gray-500 text-sm mt-1">{total} طلب خدمة</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="ابحث بالعنوان أو العميل..." value={search}
          onChange={(e) => { setOffset(0); setSearch(e.target.value); }} className="flex-1" />
        <Select
          options={[{ value: "", label: "الكل" }, { value: "true", label: "نشط" }, { value: "false", label: "متوقّف" }]}
          value={activeFilter} onChange={(e) => { setOffset(0); setActiveFilter(e.target.value); }}
          className="w-full sm:w-44" />
      </div>

      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">جارٍ التحميل...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">لا توجد طلبات خدمة</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.is_active ? "bg-primary/10" : "bg-gray-100"}`}>
                  <Case className={`h-5 w-5 ${r.is_active ? "text-primary" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{r.title}</h3>
                    <Badge variant={r.is_active ? "success" : "default"}>{r.is_active ? "نشط" : "متوقّف"}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                    <span>{r.client_name}</span>
                    {r.category_name && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{r.category_name}</span>}
                    {r.city_name && <span className="flex items-center gap-1"><MapPoint className="h-3 w-3" /> {r.city_name}</span>}
                    <span className="text-primary font-semibold">{budgetOf(r)}</span>
                    <span>{r.offers_count} عرض</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActive(r)} title={r.is_active ? "إيقاف" : "تفعيل"}
                    className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary/10 flex items-center justify-center">
                    {r.is_active ? <CloseCircle className="h-4 w-4 text-gray-500" /> : <CheckCircle className="h-4 w-4 text-primary" />}
                  </button>
                  <button onClick={() => setDeleteTarget(r)} title="حذف"
                    className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                    <TrashBinMinimalistic className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>السابق</Button>
          <span className="text-sm text-gray-500">{Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}</span>
          <Button variant="outline" size="sm" disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)}>التالي</Button>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">حذف طلب الخدمة؟</h3>
            <p className="text-sm text-gray-500 mb-5">«{deleteTarget.title}» — لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>إلغاء</Button>
              <Button variant="danger" fullWidth loading={busy} onClick={confirmDelete}>حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
