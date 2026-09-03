"use client";

import { useState, useEffect, useCallback, useRef, type ComponentType } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import type { PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";
import {
  ShieldCheck, CheckCircle, CloseCircle, Eye, Document,
} from "@solar-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerificationRequest {
  id: number;
  user: number;
  user_name: string;
  user_phone: string;
  user_avatar: string | null;
  user_is_verified: boolean;
  status: "pending" | "approved" | "rejected";
  note: string;
  document: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  review_note: string;
  created_at: string;
  updated_at: string;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<VerificationRequest["status"], string> = {
  pending: "قيد المراجعة", approved: "موثّق", rejected: "مرفوض",
};
const STATUS_COLORS: Record<VerificationRequest["status"], "yellow" | "green" | "red"> = {
  pending: "yellow", approved: "green", rejected: "red",
};

const STATUS_FILTER = [
  { value: "pending",  label: "قيد المراجعة" },
  { value: "approved", label: "موثّق" },
  { value: "rejected", label: "مرفوض" },
  { value: "",         label: "الكل" },
];

const LIMIT = 20;

// أيقونات Solar تُعرّف weight كنوع اتحادي أضيق مما تتوقّعه المكوّنات المشتركة —
// نُوسّع النوع لأيقونة تكفيها className لتفادي تعارض الأنواع (مطابق لـ dashboard).
const asIcon = (I: ComponentType<{ className?: string }>) => I;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminVerificationPage() {
  const { user: me, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems]     = useState<VerificationRequest[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset]   = useState(0);

  const [statusFilter, setStatusFilter] = useState("pending");

  const [selected, setSelected] = useState<VerificationRequest | null>(null);

  const [approveTarget, setApproveTarget] = useState<VerificationRequest | null>(null);
  const [approving, setApproving] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<VerificationRequest | null>(null);
  const [rejectNote, setRejectNote]     = useState("");
  const [rejecting, setRejecting]       = useState(false);

  const [noteDialog, setNoteDialog] = useState<VerificationRequest | null>(null);

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
      const res = await api.get<PaginatedResponse<VerificationRequest>>(
        ep.admin.verificationRequests, { params }
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
  const applyUpdate = (updated: VerificationRequest) => {
    setItems((prev) => prev.map((x) => x.id === updated.id ? updated : x));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const res = await api.patch<VerificationRequest>(
        ep.admin.verificationRequest(approveTarget.id), { status: "approved" }
      );
      toast.success("تم توثيق الحساب");
      applyUpdate(res.data);
      setApproveTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setApproving(false); }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      const res = await api.patch<VerificationRequest>(
        ep.admin.verificationRequest(rejectTarget.id),
        { status: "rejected", review_note: rejectNote.trim() }
      );
      toast.success("تم رفض الطلب");
      applyUpdate(res.data);
      setRejectTarget(null);
      setRejectNote("");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setRejecting(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader icon={<ShieldCheck />} title="طلبات التوثيق"
          subtitle={`${total.toLocaleString(NUMERIC_LOCALE)} طلب`} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 border border-muted-200 rounded-xl px-3 text-body focus:outline-none"
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
                <div key={i} className="h-14 bg-muted-50 animate-pulse mx-4 my-2 rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={asIcon(ShieldCheck)}
              title="لا توجد طلبات توثيق"
              message="لم يتم العثور على طلبات مطابقة للفلتر الحالي."
            />
          ) : (
            <table className="w-full text-body">
              <thead className="bg-muted-50 border-b border-muted-100">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-muted-600">المستخدم</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-600 hidden lg:table-cell">الملاحظة</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-600 hidden sm:table-cell">التاريخ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-50">
                {items.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => setSelected(it)}
                    className={`cursor-pointer hover:bg-muted-50 transition-colors ${selected?.id === it.id ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {it.user_avatar ? (
                          <img src={it.user_avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-caption">
                            {it.user_name?.charAt(0) ?? "؟"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-ink leading-tight">{it.user_name}</p>
                          <p className="text-caption text-muted-500" dir="ltr">{it.user_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-500 hidden lg:table-cell max-w-xs">
                      <span className="line-clamp-1">{it.note || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[it.status]}>{STATUS_LABELS[it.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-500 hidden sm:table-cell whitespace-nowrap">
                      {new Date(it.created_at).toLocaleDateString("ar-YE")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(it); }}
                        className="p-1.5 rounded-lg hover:bg-muted-100 text-muted hover:text-primary transition-colors"
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-muted-100">
              <span className="text-caption text-muted-500">
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
            {/* Avatar & name */}
            <div className="flex flex-col items-center text-center mb-5">
              {selected.user_avatar ? (
                <img src={selected.user_avatar} className="w-16 h-16 rounded-full object-cover mb-3" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-h2 mb-3">
                  {selected.user_name?.charAt(0) ?? "؟"}
                </div>
              )}
              <h2 className="font-bold text-ink">{selected.user_name}</h2>
              <p className="text-body text-muted-500" dir="ltr">{selected.user_phone}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
                {selected.user_is_verified && <Badge variant="green">حساب موثّق ✓</Badge>}
              </div>
            </div>

            {/* Note */}
            <div className="mb-4">
              <p className="text-caption font-semibold text-muted-600 mb-1.5">ملاحظة مقدّم الطلب</p>
              {selected.note ? (
                <>
                  <p className="text-body text-muted-700 bg-muted-50 rounded-xl p-3 leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
                    {selected.note}
                  </p>
                  {selected.note.length > 160 && (
                    <button
                      onClick={() => setNoteDialog(selected)}
                      className="text-caption text-primary font-semibold mt-1.5 hover:underline"
                    >عرض الملاحظة كاملة</button>
                  )}
                </>
              ) : (
                <p className="text-body text-muted">لا توجد ملاحظة</p>
              )}
            </div>

            {/* Document */}
            {selected.document && (
              <a
                href={selected.document}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-4 text-body font-semibold text-primary bg-primary/5 rounded-xl px-3 py-2.5 hover:bg-primary/10 transition-colors"
              >
                <Document className="h-4 w-4 shrink-0" />
                عرض المستند المرفق
              </a>
            )}

            {/* Review note (if reviewed) */}
            {selected.status === "rejected" && selected.review_note && (
              <div className="mb-4">
                <p className="text-caption font-semibold text-muted-600 mb-1.5">سبب الرفض</p>
                <p className="text-body text-danger-600 bg-danger-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap break-words">
                  {selected.review_note}
                </p>
              </div>
            )}
            {selected.reviewed_by_name && (
              <p className="text-caption text-muted mb-4">تمت المراجعة بواسطة {selected.reviewed_by_name}</p>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => setApproveTarget(selected)}
                variant="primary" fullWidth size="sm"
                disabled={selected.status === "approved"}
              >
                <CheckCircle className="h-4 w-4" /> قبول وتوثيق
              </Button>
              <Button
                onClick={() => { setRejectTarget(selected); setRejectNote(selected.review_note || ""); }}
                variant="danger" fullWidth size="sm"
                disabled={selected.status === "rejected"}
              >
                <CloseCircle className="h-4 w-4" /> رفض الطلب
              </Button>
            </div>

            {/* Requested at */}
            <p className="text-caption text-muted text-center mt-4">
              قُدّم في {new Date(selected.created_at).toLocaleDateString("ar-YE")}
            </p>
          </div>
        )}
      </div>

      {/* Full note dialog */}
      <Dialog
        open={!!noteDialog}
        onClose={() => setNoteDialog(null)}
        title="ملاحظة طلب التوثيق"
      >
        <p className="text-body text-muted-700 leading-relaxed whitespace-pre-wrap break-words">
          {noteDialog?.note}
        </p>
      </Dialog>

      {/* Approve confirm */}
      <ConfirmDialog
        open={!!approveTarget}
        title="تأكيد التوثيق"
        message={
          approveTarget
            ? <>هل تريد الموافقة على طلب <strong>{approveTarget.user_name}</strong>؟ سيتم توثيق حسابه وإشعاره.</>
            : ""
        }
        confirmLabel="قبول وتوثيق"
        variant="primary"
        loading={approving}
        onConfirm={confirmApprove}
        onCancel={() => setApproveTarget(null)}
      />

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onClose={() => { if (!rejecting) { setRejectTarget(null); setRejectNote(""); } }}
        title="رفض طلب التوثيق"
        dismissable={!rejecting}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectNote(""); }} disabled={rejecting}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={confirmReject} loading={rejecting}>
              رفض الطلب
            </Button>
          </>
        }
      >
        <p className="text-body text-muted-600 mb-3">
          سيتم رفض طلب <strong>{rejectTarget?.user_name}</strong> وإشعاره. يمكنك إضافة سبب اختياري.
        </p>
        <label className="text-caption font-semibold text-muted-600 mb-1.5 block">سبب الرفض (اختياري)</label>
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          rows={3}
          placeholder="مثال: المستند غير واضح، يرجى إعادة الرفع..."
          className="w-full border border-muted-200 rounded-xl p-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </Dialog>
    </div>
  );
}
