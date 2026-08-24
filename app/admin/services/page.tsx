"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import type { PaginatedResponse, ServiceCategoryRef } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ServiceIcon } from "@/lib/serviceIcons";
import { toast } from "sonner";
import {
  Settings, Magnifer, CloseCircle, Eye,
  CheckCircle, DangerCircle, TrashBinTrash, Star,
} from "@solar-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminService {
  id: number;
  user: number;
  user_name?: string;
  user_phone?: string;
  user_avatar?: string | null;
  category: ServiceCategoryRef | null;
  title: string;
  experience_years: number;
  cities_names: string[];
  is_active: boolean;
  average_rating: number | null;
  reviews_count: number;
  created_at: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [services, setServices]     = useState<AdminService[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [offset, setOffset]         = useState(0);
  const LIMIT = 20;

  const [search, setSearch]           = useState("");
  const [catFilter, setCat]           = useState("");
  const [activeFilter, setActive]     = useState("");
  const [selected, setSelected]       = useState<AdminService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminService | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const [categories, setCategories]   = useState<ServiceCategoryRef[]>([]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount = useRef(false);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchServices = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { offset: off, limit: LIMIT };
      if (search)       params.search    = search;
      if (catFilter)    params.category  = catFilter;
      if (activeFilter) params.is_active = activeFilter;
      const res = await api.get<PaginatedResponse<AdminService>>(ep.admin.services, { params });
      setServices(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, catFilter, activeFilter]);

  // ── fetch categories (plain array, not paginated) ────────────────────────────
  useEffect(() => {
    api.get<ServiceCategoryRef[]>("/services/categories/")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  // ── single fetch driver: immediate on mount, debounced on filter changes ──────
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      fetchServices(0);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchServices(0), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, catFilter, activeFilter, fetchServices]);

  // ── actions ────────────────────────────────────────────────────────────────
  const toggleActive = async (s: AdminService) => {
    try {
      const res = await api.patch<AdminService>(ep.admin.service(s.id), { is_active: !s.is_active });
      const updated = res.data;
      setServices((prev) => prev.map((x) => x.id === updated.id ? updated : x));
      if (selected?.id === updated.id) setSelected(updated);
      toast.success(updated.is_active ? "تم تفعيل مزود الخدمة" : "تم إيقاف مزود الخدمة");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(ep.admin.service(deleteTarget.id));
      toast.success("تم حذف مزود الخدمة");
      setServices((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleting(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <PageHeader icon={<Settings />} title="إدارة مزودي الخدمة"
          subtitle={`${total.toLocaleString(NUMERIC_LOCALE)} مزود خدمة`} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Magnifer className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو التخصص..."
            className="w-full h-10 border border-gray-200 rounded-xl pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <CloseCircle className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <select value={catFilter} onChange={(e) => setCat(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none">
          <option value="">كل التخصصات</option>
          {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name_ar}</option>)}
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
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Settings className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">لا يوجد مزودو خدمة</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">المزود</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">التخصص</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">المدن</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">التقييم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === s.id ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.user_avatar ? (
                          <img src={s.user_avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                            {(s.user_name ?? "؟").charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{s.user_name}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{s.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {s.category ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-600">
                            <ServiceIcon icon={s.category.icon} className="h-3.5 w-3.5" />
                          </span>
                          <Badge variant="gray">{s.category.name_ar}</Badge>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                      {s.cities_names.slice(0, 2).join("، ")}
                      {s.cities_names.length > 2 && ` +${s.cities_names.length - 2}`}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        <Star className="h-3.5 w-3.5 text-gold" />
                        {s.average_rating?.toFixed(1) ?? "—"}
                        <span className="text-xs text-gray-400">({s.reviews_count})</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.is_active
                        ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="h-3.5 w-3.5" />نشط</span>
                        : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><DangerCircle className="h-3.5 w-3.5" />موقوف</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(s); }}
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
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => fetchServices(offset - LIMIT)}>السابق</Button>
                <Button size="sm" variant="outline" disabled={offset + LIMIT >= total} onClick={() => fetchServices(offset + LIMIT)}>التالي</Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-white rounded-2xl card-shadow p-5 self-start sticky top-6">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-5">
              {selected.user_avatar ? (
                <img src={selected.user_avatar} className="w-16 h-16 rounded-full object-cover mb-3" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-2xl mb-3">
                  {(selected.user_name ?? "؟").charAt(0)}
                </div>
              )}
              <h2 className="font-bold text-gray-900">{selected.user_name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{selected.title}</p>
              {selected.category && (
                <Badge variant="gray" className="mt-2 inline-flex items-center gap-1.5">
                  <ServiceIcon icon={selected.category.icon} className="h-3.5 w-3.5" />
                  {selected.category.name_ar}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-gray-900">{selected.experience_years}</p>
                <p className="text-xs text-gray-500">سنة خبرة</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-gray-900">{selected.average_rating?.toFixed(1) ?? "—"}</p>
                <p className="text-xs text-gray-500">تقييم</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-gray-900">{selected.reviews_count}</p>
                <p className="text-xs text-gray-500">تقييم</p>
              </div>
            </div>

            {/* Cities */}
            {selected.cities_names.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-1.5">المدن</p>
                <div className="flex flex-wrap gap-1">
                  {selected.cities_names.map((c) => (
                    <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button onClick={() => toggleActive(selected)} variant="outline" fullWidth size="sm">
                {selected.is_active
                  ? <><DangerCircle className="h-4 w-4" /> إيقاف</>
                  : <><CheckCircle className="h-4 w-4" /> تفعيل</>}
              </Button>
              <Button onClick={() => setDeleteTarget(selected)} variant="danger" fullWidth size="sm">
                <TrashBinTrash className="h-4 w-4" /> حذف نهائي
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              انضم في {new Date(selected.created_at).toLocaleDateString("ar-YE")}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد الحذف"
        message={
          deleteTarget
            ? <>هل أنت متأكد من حذف <strong>{deleteTarget.user_name}</strong> من مزودي الخدمة؟</>
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
