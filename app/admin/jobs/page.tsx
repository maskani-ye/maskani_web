"use client";

// لوحة إدارة «طلبات الخدمة» (jobs / ServiceRequest) — مسار admin_v1 حصراً.
import { useState, useEffect, useCallback } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { formatPrice, NUMERIC_LOCALE } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Case, MapPoint, TrashBinMinimalistic, CheckCircle, CloseCircle,
  UserRounded, Wallet, ChatRound,
} from "@solar-icons/react";
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
    : r.budget_min ? `من ${formatPrice(r.budget_min, r.currency)}` : "غير محدّد";

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── الترويسة ── */}
      <PageHeader icon={<Case />} title="طلبات الخدمة"
        subtitle={`${total.toLocaleString(NUMERIC_LOCALE)} طلب خدمة`} />

      {/* ── التولبار ── */}
      <div className="bg-white rounded-2xl card-shadow p-4 flex flex-col sm:flex-row gap-3">
        <Input placeholder="ابحث بالعنوان أو العميل..." value={search}
          onChange={(e) => { setOffset(0); setSearch(e.target.value); }} className="flex-1" />
        <Select
          options={[{ value: "", label: "كل الحالات" }, { value: "true", label: "نشط" }, { value: "false", label: "متوقّف" }]}
          value={activeFilter} onChange={(e) => { setOffset(0); setActiveFilter(e.target.value); }}
          className="w-full sm:w-48" />
      </div>

      {/* ── القائمة ── */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {loading ? (
          <div className="divide-y divide-muted-100">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-muted-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted-100 rounded w-1/3" />
                  <div className="h-3 bg-muted-50 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted-100 flex items-center justify-center mb-3">
              <Case className="h-7 w-7 text-muted-200" />
            </div>
            <p className="text-muted-500 font-medium">لا توجد طلبات خدمة</p>
            <p className="text-body text-muted mt-0.5">جرّب تغيير البحث أو الفلتر</p>
          </div>
        ) : (
          <div className="divide-y divide-muted-100">
            {items.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-muted-50/70 transition-colors">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${r.is_active ? "bg-primary/10" : "bg-muted-100"}`}>
                  <Case className={`h-5 w-5 ${r.is_active ? "text-primary" : "text-muted"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink text-body line-clamp-1">{r.title}</h3>
                    <Badge variant={r.is_active ? "success" : "default"}>{r.is_active ? "نشط" : "متوقّف"}</Badge>
                    {r.category_name && (
                      <span className="text-[11px] font-medium bg-muted-100 text-muted-500 px-2 py-0.5 rounded-full">{r.category_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3.5 text-caption text-muted-500 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1"><UserRounded className="h-3.5 w-3.5 text-muted" /> {r.client_name}</span>
                    {r.city_name && <span className="flex items-center gap-1"><MapPoint className="h-3.5 w-3.5 text-muted" /> {r.city_name}</span>}
                    <span className="flex items-center gap-1 text-primary font-semibold"><Wallet className="h-3.5 w-3.5" /> {budgetOf(r)}</span>
                    <span className="flex items-center gap-1"><ChatRound className="h-3.5 w-3.5 text-muted" /> {r.offers_count} عرض</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleActive(r)} title={r.is_active ? "إيقاف" : "تفعيل"}
                    className="w-9 h-9 rounded-lg bg-muted-50 hover:bg-primary/10 flex items-center justify-center transition-colors">
                    {r.is_active ? <CloseCircle className="h-4 w-4 text-muted-500" /> : <CheckCircle className="h-4 w-4 text-primary" />}
                  </button>
                  <button onClick={() => setDeleteTarget(r)} title="حذف"
                    className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                    <TrashBinMinimalistic className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── الترقيم ── */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>السابق</Button>
          <span className="text-body text-muted-500 tabular-nums">{Math.floor(offset / LIMIT) + 1} / {pages}</span>
          <Button variant="outline" size="sm" disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)}>التالي</Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        icon={<TrashBinMinimalistic className="h-6 w-6 text-red-500" />}
        title="حذف طلب الخدمة؟"
        message={deleteTarget ? `«${deleteTarget.title}» — لا يمكن التراجع عن هذا الإجراء.` : ""}
        variant="danger"
        confirmLabel="حذف"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
