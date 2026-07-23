"use client";

import { useState, useEffect, useCallback, useRef, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";
import {
  DangerTriangle, CheckCircle, CloseCircle, Eye, AltArrowLeft,
} from "@solar-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserReport {
  id: number;
  reporter: number;
  reporter_name: string;
  reporter_phone: string;
  reported: number;
  reported_name: string;
  reported_phone: string;
  reason: "spam" | "harassment" | "scam" | "inappropriate" | "other";
  detail: string;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
  updated_at: string;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<UserReport["reason"], string> = {
  spam: "إزعاج/سبام", harassment: "تحرّش/إساءة", scam: "احتيال",
  inappropriate: "محتوى غير لائق", other: "أخرى",
};

const STATUS_LABELS: Record<UserReport["status"], string> = {
  open: "مفتوح", reviewed: "تمت المراجعة", dismissed: "مرفوض",
};
const STATUS_COLORS: Record<UserReport["status"], "yellow" | "green" | "gray"> = {
  open: "yellow", reviewed: "green", dismissed: "gray",
};

const STATUS_FILTER = [
  { value: "open",      label: "مفتوح" },
  { value: "reviewed",  label: "تمت المراجعة" },
  { value: "dismissed", label: "مرفوض" },
  { value: "",          label: "الكل" },
];

const LIMIT = 20;

// أيقونات Solar تُعرّف weight كنوع اتحادي أضيق مما تتوقّعه المكوّنات المشتركة —
// نُوسّع النوع لأيقونة تكفيها className لتفادي تعارض الأنواع (مطابق لـ dashboard).
const asIcon = (I: ComponentType<{ className?: string }>) => I;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUserReportsPage() {
  const { user: me, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems]     = useState<UserReport[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset]   = useState(0);

  const [statusFilter, setStatusFilter] = useState("open");

  const [selected, setSelected] = useState<UserReport | null>(null);

  const [action, setAction] = useState<{ report: UserReport; status: "reviewed" | "dismissed" } | null>(null);
  const [saving, setSaving] = useState(false);

  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialFetch = useRef(false);

  // ── auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!me || me.role !== "admin")) router.push("/");
  }, [me, authLoading, router]);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { offset: off, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<PaginatedResponse<UserReport>>(
        "/admin/user-reports/", { params }
      );
      setItems(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [statusFilter]);

  // ── single fetch driver: immediate on first auth-ready render, debounced after ──
  useEffect(() => {
    if (authLoading || me?.role !== "admin") return;
    if (!didInitialFetch.current) {
      didInitialFetch.current = true;
      fetchItems(0);
      return;
    }
    if (filterTimer.current) clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => fetchItems(0), 400);
    return () => { if (filterTimer.current) clearTimeout(filterTimer.current); };
  }, [authLoading, me, statusFilter, fetchItems]);

  // ── actions ────────────────────────────────────────────────────────────────
  const confirmAction = async () => {
    if (!action) return;
    setSaving(true);
    try {
      const res = await api.patch<UserReport>(
        `/admin/user-reports/${action.report.id}/`, { status: action.status }
      );
      toast.success(action.status === "reviewed" ? "تم وضع علامة تمت المراجعة" : "تم رفض البلاغ");
      setItems((prev) => prev.map((x) => x.id === res.data.id ? res.data : x));
      if (selected?.id === res.data.id) setSelected(res.data);
      setAction(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <DangerTriangle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">بلاغات المستخدمين</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString("ar-YE")} بلاغ</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none"
        >
          {STATUS_FILTER.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Split panel */}
      <div className="flex gap-6">

        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl card-shadow overflow-hidden">
          {loading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 animate-pulse mx-4 my-2 rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={asIcon(DangerTriangle)}
              title="لا توجد بلاغات"
              message="لم يتم العثور على بلاغات مطابقة للفلتر الحالي."
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">المُبلِّغ ← المُبلَّغ عنه</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">السبب</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">التاريخ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => setSelected(it)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === it.id ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-gray-700">{it.reporter_name}</span>
                        <AltArrowLeft className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-900">{it.reported_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="gray">{REASON_LABELS[it.reason]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[it.status]}>{STATUS_LABELS[it.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                      {new Date(it.created_at).toLocaleDateString("ar-YE")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(it); }}
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
                <Button
                  size="sm" variant="outline"
                  disabled={offset === 0}
                  onClick={() => fetchItems(offset - LIMIT)}
                >السابق</Button>
                <Button
                  size="sm" variant="outline"
                  disabled={offset + LIMIT >= total}
                  onClick={() => fetchItems(offset + LIMIT)}
                >التالي</Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-white rounded-2xl card-shadow p-5 self-start sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="إغلاق"
              >
                <CloseCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Reporter */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">المُبلِّغ</p>
              <p className="text-sm font-medium text-gray-900">{selected.reporter_name}</p>
              <p className="text-xs text-gray-500" dir="ltr">{selected.reporter_phone}</p>
            </div>

            {/* Reported */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">المُبلَّغ عنه</p>
              <p className="text-sm font-medium text-gray-900">{selected.reported_name}</p>
              <p className="text-xs text-gray-500" dir="ltr">{selected.reported_phone}</p>
            </div>

            {/* Reason */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">السبب</p>
              <Badge variant="gray">{REASON_LABELS[selected.reason]}</Badge>
            </div>

            {/* Detail */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">التفاصيل</p>
              {selected.detail ? (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap break-words">
                  {selected.detail}
                </p>
              ) : (
                <p className="text-sm text-gray-400">لا توجد تفاصيل</p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => setAction({ report: selected, status: "reviewed" })}
                variant="primary" fullWidth size="sm"
                disabled={selected.status === "reviewed"}
              >
                <CheckCircle className="h-4 w-4" /> تمت المراجعة
              </Button>
              <Button
                onClick={() => setAction({ report: selected, status: "dismissed" })}
                variant="outline" fullWidth size="sm"
                disabled={selected.status === "dismissed"}
              >
                <CloseCircle className="h-4 w-4" /> رفض البلاغ
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              بُلِّغ في {new Date(selected.created_at).toLocaleDateString("ar-YE")}
            </p>
          </div>
        )}
      </div>

      {/* Action confirm */}
      <ConfirmDialog
        open={!!action}
        title={action?.status === "reviewed" ? "تأكيد المراجعة" : "تأكيد رفض البلاغ"}
        message={
          action
            ? action.status === "reviewed"
              ? <>وضع علامة &laquo;تمت المراجعة&raquo; على بلاغ <strong>{action.report.reporter_name}</strong> ضد <strong>{action.report.reported_name}</strong>؟</>
              : <>رفض بلاغ <strong>{action.report.reporter_name}</strong> ضد <strong>{action.report.reported_name}</strong>؟</>
            : ""
        }
        confirmLabel={action?.status === "reviewed" ? "تمت المراجعة" : "رفض"}
        variant={action?.status === "reviewed" ? "primary" : "danger"}
        loading={saving}
        onConfirm={confirmAction}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}
