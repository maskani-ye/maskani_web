"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import {
  Buildings2, Magnifer, CloseCircle, Eye,
  CheckCircle, DangerCircle, TrashBinTrash,
} from "@solar-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminListing {
  id: number;
  title: string;
  property_type: string;
  offer_type: string;
  price: string;
  area: string | null;
  city: number;
  city_name?: string;
  neighborhood: string;
  user: number;
  user_name?: string;
  user_phone?: string;
  is_active: boolean;
  views_count: number;
  main_image: string | null;
  created_at: string;
}

const PROPERTY_LABELS: Record<string, string> = {
  apartment: "شقة", house: "منزل", land: "أرض", commercial: "تجاري",
};
const OFFER_LABELS: Record<string, string> = {
  sale: "بيع", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي",
};
const OFFER_COLORS: Record<string, "green" | "yellow" | "blue"> = {
  sale: "green", rent_monthly: "yellow", rent_yearly: "blue",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminListingsPage() {
  const [listings, setListings]   = useState<AdminListing[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [offset, setOffset]       = useState(0);
  const LIMIT = 20;

  const [search, setSearch]           = useState("");
  const [offerFilter, setOffer]       = useState("");
  const [typeFilter, setType]         = useState("");
  const [activeFilter, setActive]     = useState("");

  const [selected, setSelected]       = useState<AdminListing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminListing | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchListings = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { offset: off, limit: LIMIT };
      if (search)       params.search        = search;
      if (offerFilter)  params.offer_type    = offerFilter;
      if (typeFilter)   params.property_type = typeFilter;
      if (activeFilter) params.is_active     = activeFilter;
      const res = await api.get<PaginatedResponse<AdminListing>>("/admin/listings/", { params });
      setListings(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, offerFilter, typeFilter, activeFilter]);

  useEffect(() => { fetchListings(0); }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchListings(0), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, offerFilter, typeFilter, activeFilter]);

  // ── actions ────────────────────────────────────────────────────────────────
  const toggleActive = async (l: AdminListing) => {
    try {
      const res = await api.patch<AdminListing>(`/admin/listings/${l.id}/`, { is_active: !l.is_active });
      const updated = res.data;
      setListings((prev) => prev.map((x) => x.id === updated.id ? updated : x));
      if (selected?.id === updated.id) setSelected(updated);
      toast.success(updated.is_active ? "تم تفعيل الإعلان" : "تم إيقاف الإعلان");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/listings/${deleteTarget.id}/`);
      toast.success("تم حذف الإعلان");
      setListings((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleteTarget(null); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
            <Buildings2 className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">إدارة الإعلانات</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString("ar-YE")} إعلان</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Magnifer className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالعنوان أو المالك..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <CloseCircle className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <select value={offerFilter} onChange={(e) => setOffer(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none">
          <option value="">كل أنواع العرض</option>
          {Object.entries(OFFER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setType(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none">
          <option value="">كل أنواع العقار</option>
          {Object.entries(PROPERTY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={activeFilter} onChange={(e) => setActive(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none">
          <option value="">كل الحالات</option>
          <option value="true">نشط</option>
          <option value="false">موقوف</option>
        </select>
      </div>

      {/* Split panel */}
      <div className="flex gap-6">

        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl card-shadow overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Buildings2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">لا توجد إعلانات</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الإعلان</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">المالك</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">النوع</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">السعر</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === l.id ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                          {l.main_image
                            ? <img src={l.main_image} className="w-full h-full object-cover" alt="" />
                            : <div className="w-full h-full flex items-center justify-center"><Buildings2 className="h-4 w-4 text-gray-300" /></div>}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight line-clamp-1">{l.title}</p>
                          <p className="text-xs text-gray-400">{l.city_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      <p className="text-sm">{l.user_name}</p>
                      <p className="text-xs text-gray-400" dir="ltr">{l.user_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={OFFER_COLORS[l.offer_type] ?? "gray"}>
                          {OFFER_LABELS[l.offer_type] ?? l.offer_type}
                        </Badge>
                        <span className="text-xs text-gray-500">{PROPERTY_LABELS[l.property_type] ?? l.property_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary hidden md:table-cell">
                      {formatPrice(l.price)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {l.is_active
                        ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="h-3.5 w-3.5" />نشط</span>
                        : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><DangerCircle className="h-3.5 w-3.5" />موقوف</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(l); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {offset + 1}–{Math.min(offset + LIMIT, total)} من {total}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => fetchListings(offset - LIMIT)}>السابق</Button>
                <Button size="sm" variant="outline" disabled={offset + LIMIT >= total} onClick={() => fetchListings(offset + LIMIT)}>التالي</Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-white rounded-2xl card-shadow p-5 self-start sticky top-6">
            {/* Image */}
            <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 mb-4">
              {selected.main_image
                ? <img src={selected.main_image} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center"><Buildings2 className="h-8 w-8 text-gray-300" /></div>}
            </div>

            {/* Info */}
            <h2 className="font-bold text-gray-900 mb-1 leading-snug">{selected.title}</h2>
            <p className="text-xs text-gray-500 mb-3">{selected.city_name} • {selected.neighborhood}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold text-primary">{formatPrice(selected.price)}</p>
                <p className="text-xs text-gray-500">السعر</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold text-gray-900">{selected.views_count}</p>
                <p className="text-xs text-gray-500">مشاهدة</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">نوع العرض</span>
                <span className="font-medium">{OFFER_LABELS[selected.offer_type] ?? selected.offer_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">نوع العقار</span>
                <span className="font-medium">{PROPERTY_LABELS[selected.property_type] ?? selected.property_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المالك</span>
                <span className="font-medium">{selected.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الهاتف</span>
                <span className="font-medium text-xs" dir="ltr">{selected.user_phone}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button onClick={() => toggleActive(selected)} variant="outline" fullWidth size="sm">
                {selected.is_active
                  ? <><DangerCircle className="h-4 w-4" /> إيقاف الإعلان</>
                  : <><CheckCircle className="h-4 w-4" /> تفعيل الإعلان</>}
              </Button>
              <Button onClick={() => setDeleteTarget(selected)} variant="danger" fullWidth size="sm">
                <TrashBinTrash className="h-4 w-4" /> حذف نهائي
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              {new Date(selected.created_at).toLocaleDateString("ar-YE")}
            </p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-600 mb-5">
              هل أنت متأكد من حذف إعلان <strong>{deleteTarget.title}</strong>؟ لا يمكن التراجع.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setDeleteTarget(null)} variant="outline" fullWidth>إلغاء</Button>
              <Button onClick={confirmDelete} variant="danger" fullWidth>حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
