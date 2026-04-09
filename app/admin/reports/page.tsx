"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime, fraudTypeLabels, reportStatusColors, reportStatusLabels } from "@/lib/utils";
import type { FraudReport, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import {
  ShieldWarning, Magnifer, CheckCircle, CloseCircle,
  ClockCircle, Like, Dislike, ChatRound, User, AltArrowRight,
  AltArrowLeft, DangerTriangle,
} from "@solar-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────

interface ReportDetail extends FraudReport {
  admin_note: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "verified", label: "موثّق" },
  { value: "rejected", label: "مرفوض" },
];

const FRAUD_TYPE_OPTIONS = [
  { value: "", label: "كل الأنواع" },
  ...Object.entries(fraudTypeLabels).map(([v, l]) => ({ value: v, label: l })),
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<FraudReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 15;

  const [filters, setFilters] = useState({ search: "", status: "pending", fraud_type: "" });
  const [selected, setSelected] = useState<ReportDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: String(offset), limit: String(limit) };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.fraud_type) params.fraud_type = filters.fraud_type;
      const { data } = await api.get<PaginatedResponse<FraudReport>>("/fraud-reports/", { params });
      setReports(data.results);
      setTotal(data.count);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, offset]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openReport = async (id: number) => {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const { data } = await api.get<ReportDetail>(`/fraud-reports/${id}/`);
      setSelected(data);
      setAdminNote(data.admin_note || "");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoadingDetail(false); }
  };

  const updateStatus = async (newStatus: string) => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/fraud-reports/${selected.id}/admin-update/`, {
        status: newStatus,
        admin_note: adminNote,
      });
      toast.success("تم تحديث الحالة");
      setSelected((prev) => prev ? { ...prev, status: newStatus as FraudReport["status"], admin_note: adminNote } : null);
      setReports((prev) => prev.map((r) => r.id === selected.id ? { ...r, status: newStatus as FraudReport["status"] } : r));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUpdatingStatus(false); }
  };

  const statusIcon = (s: string) => {
    if (s === "verified") return <CheckCircle className="h-3.5 w-3.5" />;
    if (s === "pending") return <ClockCircle className="h-3.5 w-3.5" />;
    return <CloseCircle className="h-3.5 w-3.5" />;
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldWarning className="h-6 w-6 text-red-500" />
            إدارة بلاغات الاحتيال
          </h1>
          <p className="text-sm text-gray-400 mt-1">{total} بلاغ إجمالي</p>
        </div>
        <div className="flex gap-2">
          {["pending", "verified", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setFilters((p) => ({ ...p, status: filters.status === s ? "" : s })); setOffset(0); }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${filters.status === s ? reportStatusColors[s] + " border-transparent" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
            >
              {statusIcon(s)} {reportStatusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── List Panel ── */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="bg-white rounded-2xl card-shadow p-3 mb-4 flex gap-3 flex-wrap">
            <Input
              placeholder="بحث بالاسم أو العنوان..."
              value={filters.search}
              onChange={(e) => { setFilters((p) => ({ ...p, search: e.target.value })); setOffset(0); }}
              startIcon={<Magnifer className="h-4 w-4" />}
              className="flex-1 min-w-48"
            />
            <select
              value={filters.fraud_type}
              onChange={(e) => { setFilters((p) => ({ ...p, fraud_type: e.target.value })); setOffset(0); }}
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {FRAUD_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Reports list */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShieldWarning className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد بلاغات مطابقة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => openReport(report.id)}
                  className={`w-full text-right bg-white rounded-2xl card-shadow p-4 hover:ring-2 hover:ring-primary/20 transition-all ${selected?.id === report.id ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${reportStatusColors[report.status]}`}>
                          {statusIcon(report.status)} {reportStatusLabels[report.status]}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {fraudTypeLabels[report.fraud_type]}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm line-clamp-1">{report.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        المتهم: <span className="text-red-600 font-medium">{report.accused_name}</span>
                        {report.accused_phone && <span className="mr-2 text-gray-400">{report.accused_phone}</span>}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-xs text-gray-400">{formatRelativeTime(report.created_at)}</p>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <span className="flex items-center gap-0.5 text-xs text-green-600">
                          <Like className="h-3 w-3" />{report.votes_credible}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-red-500">
                          <Dislike className="h-3 w-3" />{report.votes_not_credible}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-gray-400">
                          <ChatRound className="h-3 w-3" />{report.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <Button
                variant="outline" size="sm"
                onClick={() => setOffset((p) => Math.max(0, p - limit))}
                disabled={offset === 0}
              >
                <AltArrowRight className="h-4 w-4" /> السابق
              </Button>
              <span className="text-sm text-gray-500">صفحة {currentPage} من {totalPages}</span>
              <Button
                variant="outline" size="sm"
                onClick={() => setOffset((p) => p + limit)}
                disabled={currentPage >= totalPages}
              >
                التالي <AltArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Detail Panel ── */}
        <div className="w-96 flex-shrink-0">
          {loadingDetail ? (
            <div className="bg-white rounded-2xl card-shadow p-6 animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          ) : selected ? (
            <div className="bg-white rounded-2xl card-shadow p-5 sticky top-20 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* Status badges */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${reportStatusColors[selected.status]}`}>
                  {statusIcon(selected.status)} {reportStatusLabels[selected.status]}
                </span>
                <span className="text-xs text-gray-400">#{selected.id}</span>
              </div>

              {/* Title & type */}
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-snug">{selected.title}</h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full mt-1 inline-block">
                  {fraudTypeLabels[selected.fraud_type]}
                </span>
              </div>

              {/* Accused */}
              <div className="bg-red-50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-bold text-red-700 mb-1">المتهم</p>
                <p className="text-sm font-semibold text-gray-900">{selected.accused_name}</p>
                {selected.accused_phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <span>📞</span> {selected.accused_phone}
                  </p>
                )}
                {selected.accused_profile_link && (
                  <a href={selected.accused_profile_link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline">رابط الملف الشخصي</a>
                )}
              </div>

              {/* Details */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1">تفاصيل البلاغ</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selected.details}</p>
              </div>

              {/* Images */}
              {(selected.images?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">صور الأدلة ({selected.images?.length ?? 0})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(selected.images ?? []).map((img) => (
                      <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer">
                        <img src={img.image} alt="" className="w-full h-20 object-cover rounded-xl hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reporter */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">مقدّم البلاغ</p>
                  <p className="text-sm font-semibold text-gray-800">{selected.reporter_name}</p>
                </div>
                <div className="mr-auto text-left">
                  <p className="text-xs text-gray-400">{formatRelativeTime(selected.created_at)}</p>
                  {selected.city_name && <p className="text-xs text-gray-500">{selected.city_name}</p>}
                </div>
              </div>

              {/* Votes */}
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                  <Like className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-700">{selected.votes_credible}</p>
                  <p className="text-xs text-green-600">مصداقي</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                  <Dislike className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-600">{selected.votes_not_credible}</p>
                  <p className="text-xs text-red-500">غير مصداقي</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-700">{selected.credibility_score > 0 ? "+" : ""}{selected.credibility_score}</p>
                  <p className="text-xs text-gray-400">النقاط</p>
                </div>
              </div>

              {/* Comments */}
              {(selected.comments?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">التعليقات ({selected.comments?.length ?? 0})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(selected.comments ?? []).map((c) => (
                      <div key={c.id} className="flex gap-2 bg-gray-50 rounded-xl p-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700">{c.user_name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Admin Action ── */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-gray-700">قرار المشرف</p>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="ملاحظة المشرف (اختياري)..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus("verified")}
                    loading={updatingStatus}
                    disabled={selected.status === "verified"}
                    className="bg-green-600 hover:bg-green-700 text-white border-0"
                  >
                    <CheckCircle className="h-4 w-4" /> توثيق
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => updateStatus("rejected")}
                    loading={updatingStatus}
                    disabled={selected.status === "rejected"}
                  >
                    <CloseCircle className="h-4 w-4" /> رفض
                  </Button>
                </div>
                {selected.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    onClick={() => updateStatus("pending")}
                    loading={updatingStatus}
                  >
                    <DangerTriangle className="h-4 w-4" /> إعادة للمراجعة
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl card-shadow p-8 text-center text-gray-400">
              <ShieldWarning className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">اختر بلاغاً للاطلاع على تفاصيله</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
