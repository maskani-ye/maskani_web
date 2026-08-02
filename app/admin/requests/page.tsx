"use client";

import { useState, useEffect, useCallback } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { formatRelativeTime, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import {
  ChatRound, Magnifer, CloseCircle, TrashBinTrash,
  AltArrowLeft, AltArrowRight, MapPoint, Dollar,
  CheckCircle, ClockCircle, Buildings2,
} from "@solar-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminRequest {
  id: number;
  client: number;
  client_name: string;
  client_phone: string;
  property_type: string;
  offer_type: string;
  city: number;
  city_name: string;
  neighborhood: string;
  budget_min: string | null;
  budget_max: string | null;
  currency: string;
  rooms_needed: number | null;
  additional_specs: string;
  contact_phone: string;
  is_active: boolean;
  expires_at: string;
  offers_count: number;
  created_at: string;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const PROPERTY_LABELS: Record<string, string> = {
  apartment: "شقة", house: "بيت / فيلا", land: "أرض",
  commercial: "محل تجاري", any: "أي نوع",
};

const OFFER_LABELS: Record<string, string> = {
  sale: "شراء", rent_monthly: "إيجار شهري",
  rent_yearly: "إيجار سنوي", any: "أي نوع",
};

const PROPERTY_FILTER = [
  { value: "", label: "كل الأنواع" },
  { value: "apartment", label: "شقة" },
  { value: "house", label: "بيت / فيلا" },
  { value: "land", label: "أرض" },
  { value: "commercial", label: "محل تجاري" },
  { value: "any", label: "أي نوع" },
];

const OFFER_FILTER = [
  { value: "", label: "كل العروض" },
  { value: "sale", label: "شراء" },
  { value: "rent_monthly", label: "إيجار شهري" },
  { value: "rent_yearly", label: "إيجار سنوي" },
  { value: "any", label: "أي نوع" },
];

const LIMIT = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [offset, setOffset]     = useState(0);

  const [search, setSearch]           = useState("");
  const [propFilter, setPropFilter]   = useState("");
  const [offerFilter, setOfferFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [selected, setSelected] = useState<AdminRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(LIMIT), offset: String(off) };
      if (search)      params.search        = search;
      if (propFilter)  params.property_type = propFilter;
      if (offerFilter) params.offer_type    = offerFilter;
      if (activeFilter) params.is_active    = activeFilter;

      const res = await api.get<{ count: number; results: AdminRequest[] }>(
        ep.admin.demands, { params }
      );
      setRequests(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, propFilter, offerFilter, activeFilter]);

  useEffect(() => { fetchRequests(0); }, [fetchRequests]);

  // ── Toggle active ───────────────────────────────────────────────────────────
  const toggleActive = async (req: AdminRequest) => {
    try {
      const res = await api.patch<AdminRequest>(ep.admin.demand(req.id), {
        is_active: !req.is_active,
      });
      setRequests((prev) => prev.map((r) => (r.id === req.id ? res.data : r)));
      if (selected?.id === req.id) setSelected(res.data);
      toast.success(res.data.is_active ? "تم تفعيل الطلب" : "تم إيقاف الطلب");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(ep.admin.demand(deleteTarget.id));
      setRequests((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      if (selected?.id === deleteTarget.id) setSelected(null);
      toast.success("تم حذف الطلب");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  // ── Budget helper ────────────────────────────────────────────────────────────
  const budgetLabel = (req: AdminRequest) => {
    if (!req.budget_min && !req.budget_max) return null;
    const cur = req.currency;
    if (req.budget_min && req.budget_max)
      return `${formatPrice(Number(req.budget_min), cur)} — ${formatPrice(Number(req.budget_max), cur)}`;
    if (req.budget_min) return `من ${formatPrice(Number(req.budget_min), cur)}`;
    return `حتى ${formatPrice(Number(req.budget_max!), cur)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChatRound className="h-6 w-6 text-primary" />
            طلبات عقارية
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString("ar-YE")} طلب إجمالاً</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="بحث باسم العميل أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Magnifer className="h-4 w-4" />}
            endIcon={search ? (
              <button onClick={() => setSearch("")}>
                <CloseCircle className="h-4 w-4 text-gray-400" />
              </button>
            ) : undefined}
          />
        </div>

        <select
          value={propFilter}
          onChange={(e) => setPropFilter(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PROPERTY_FILTER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={offerFilter}
          onChange={(e) => setOfferFilter(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {OFFER_FILTER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">كل الحالات</option>
          <option value="true">نشط</option>
          <option value="false">منتهي</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <ChatRound className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelected(req)}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selected?.id === req.id ? "bg-primary/5 border-r-2 border-primary" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      req.is_active ? "bg-primary/10" : "bg-gray-100"
                    }`}>
                      <Buildings2 className={`h-5 w-5 ${req.is_active ? "text-primary" : "text-gray-400"}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">{req.client_name}</span>
                        <Badge variant={req.is_active ? "green" : "gray"}>
                          {req.is_active ? "نشط" : "منتهي"}
                        </Badge>
                        <Badge variant="blue">{PROPERTY_LABELS[req.property_type]}</Badge>
                        <Badge variant="yellow">{OFFER_LABELS[req.offer_type]}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPoint className="h-3 w-3" /> {req.city_name}
                        </span>
                        {budgetLabel(req) && (
                          <span className="flex items-center gap-1">
                            <Dollar className="h-3 w-3" /> {budgetLabel(req)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ChatRound className="h-3 w-3" /> {req.offers_count} عرض
                        </span>
                        <span>{formatRelativeTime(req.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleActive(req)}
                        title={req.is_active ? "إيقاف" : "تفعيل"}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {req.is_active
                          ? <ClockCircle className="h-4 w-4 text-yellow-500" />
                          : <CheckCircle className="h-4 w-4 text-green-500" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(req)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <TrashBinTrash className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-gray-500">
                صفحة {currentPage} من {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => fetchRequests(offset - LIMIT)}
                >
                  <AltArrowRight className="h-4 w-4" /> السابق
                </Button>
                <Button
                  variant="outline"
                  disabled={offset + LIMIT >= total}
                  onClick={() => fetchRequests(offset + LIMIT)}
                >
                  التالي <AltArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-2xl card-shadow p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">تفاصيل الطلب</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <CloseCircle className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Status badges */}
              <div className="flex gap-2 flex-wrap mb-4">
                <Badge variant={selected.is_active ? "green" : "gray"}>
                  {selected.is_active ? "نشط" : "منتهي"}
                </Badge>
                <Badge variant="blue">{PROPERTY_LABELS[selected.property_type]}</Badge>
                <Badge variant="yellow">{OFFER_LABELS[selected.offer_type]}</Badge>
              </div>

              {/* Client */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">صاحب الطلب</p>
                <p className="font-semibold text-gray-900">{selected.client_name}</p>
                <p className="text-sm text-gray-500 mt-0.5 font-mono">{selected.client_phone}</p>
                {selected.contact_phone && selected.contact_phone !== selected.client_phone && (
                  <p className="text-xs text-gray-400 mt-1">تواصل: {selected.contact_phone}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2 mb-4">
                <_Row icon={<MapPoint className="h-3.5 w-3.5" />} label="المدينة" value={selected.city_name} />
                {selected.neighborhood && (
                  <_Row icon={<MapPoint className="h-3.5 w-3.5" />} label="الحي" value={selected.neighborhood} />
                )}
                {budgetLabel(selected) && (
                  <_Row icon={<Dollar className="h-3.5 w-3.5" />} label="الميزانية" value={budgetLabel(selected)!} />
                )}
                {selected.rooms_needed && (
                  <_Row icon={<Buildings2 className="h-3.5 w-3.5" />} label="الغرف" value={`${selected.rooms_needed} غرف`} />
                )}
                <_Row
                  icon={<ClockCircle className="h-3.5 w-3.5" />}
                  label="ينتهي"
                  value={selected.expires_at?.split("T")[0] ?? "—"}
                />
                <_Row
                  icon={<ChatRound className="h-3.5 w-3.5" />}
                  label="العروض"
                  value={`${selected.offers_count} عرض`}
                />
              </div>

              {/* Additional specs */}
              {selected.additional_specs && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">مواصفات إضافية</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                    {selected.additional_specs}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant={selected.is_active ? "outline" : "primary"}
                 
                  fullWidth
                  onClick={() => toggleActive(selected)}
                >
                  {selected.is_active ? (
                    <><ClockCircle className="h-4 w-4" /> إيقاف الطلب</>
                  ) : (
                    <><CheckCircle className="h-4 w-4" /> تفعيل الطلب</>
                  )}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => setDeleteTarget(selected)}
                >
                  <TrashBinTrash className="h-4 w-4" /> حذف الطلب
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد الحذف"
        message={
          deleteTarget
            ? `هل أنت متأكد من حذف طلب "${PROPERTY_LABELS[deleteTarget.property_type] ?? deleteTarget.property_type}" لـ "${deleteTarget.client_name}"؟`
            : ""
        }
        confirmLabel="حذف"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Helper Row ───────────────────────────────────────────────────────────────

function _Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500 w-16 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 flex-1">{value}</span>
    </div>
  );
}
