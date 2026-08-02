"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { formatRelativeTime, fraudTypeLabels, reportStatusColors, reportStatusLabels } from "@/lib/utils";
import type { FraudReport, PaginatedResponse, City } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ShieldWarning, Magnifer, Like, Dislike, ChatRound,
  AddCircle, DangerTriangle, CheckCircle, ClockCircle,
} from "@solar-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, sectionLabel } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useRouter } from "next/navigation";

export default function FraudReportsPage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { cityId, setCity } = useCity();
  const router = useRouter();
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [filters, setFilters] = useState({ search: "", fraud_type: "", status: "" });

  useEffect(() => {
    api.get("/cities/").then((r) => setCities(r.data.results ?? [])).catch(() => {});
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { offset: "0", limit: "20" };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      if (cityId) params.city = cityId;
      const { data } = await api.get<PaginatedResponse<FraudReport>>("/reports/", { params });
      setReports(data.results);
      setTotal(data.count);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, cityId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleVote = async (reportId: number, isCredible: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    try {
      const { data } = await api.post(`/reports/${reportId}/vote/`, { is_credible: isCredible });
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, credibility_score: data.credibility_score } : r));
      toast.success("تم تسجيل تصويتك");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const statusIcon = (s: string) => {
    if (s === "verified") return <CheckCircle className="h-4 w-4 text-red-600" />;
    if (s === "pending") return <ClockCircle className="h-4 w-4 text-yellow-600" />;
    return <DangerTriangle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: sectionLabel("reports"), path: "/reports" }])} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: sectionLabel("reports") }]} />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldWarning className="h-6 w-6 text-red-600" />
            مجتمع الشكاوي
          </h1>
          <p className="text-gray-500 text-sm mt-1">{total} بلاغ | الشفافية تحمي الجميع</p>
        </div>
        <Button onClick={() => requireAuth(() => router.push("/reports/create"))}>
          <AddCircle className="h-4 w-4" />
          رفع بلاغ
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <DangerTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          البلاغات المنشورة هنا لأغراض تحذيرية وقائية. يُرجى الالتزام بالمصداقية والدقة عند رفع أي بلاغ.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Input
          placeholder="بحث..."
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          startIcon={<Magnifer className="h-4 w-4" />}
          className="col-span-2 md:col-span-1"
        />
        <Select
          options={Object.entries(fraudTypeLabels).map(([v, l]) => ({ value: v, label: l }))}
          value={filters.fraud_type}
          onChange={(e) => setFilters((p) => ({ ...p, fraud_type: e.target.value }))}
          placeholder="نوع الاحتيال"
        />
        <Select
          options={cities.map((c) => ({ value: c.id, label: c.name_ar }))}
          value={cityId}
          onChange={(e) => {
            const id = e.target.value;
            const name = cities.find((c) => String(c.id) === id)?.name_ar ?? "";
            setCity(id, name);
          }}
          placeholder="المدينة"
        />
        <Select
          options={[
            { value: "pending", label: "قيد المراجعة" },
            { value: "verified", label: "موثّق" },
            { value: "rejected", label: "مرفوض" },
          ]}
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          placeholder="الحالة"
        />
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <ShieldWarning className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد بلاغات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <div className="bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-200 p-5 cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status & Type */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${reportStatusColors[report.status]}`}>
                        {statusIcon(report.status)}
                        {reportStatusLabels[report.status]}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {fraudTypeLabels[report.fraud_type]}
                      </span>
                      {report.city_name && (
                        <span className="text-xs text-gray-400">{report.city_name}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{report.title}</h3>
                    <p className="text-sm text-gray-500 mb-1">
                      <span className="text-red-600 font-semibold">المتهم:</span> {report.accused_name}
                      {report.accused_phone && <span className="mr-2 text-gray-400">({report.accused_phone})</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      بلاغ من {report.reporter_name} • {formatRelativeTime(report.created_at)}
                    </p>
                  </div>
                  {report.first_image && (
                    <img src={report.first_image} alt="" className="w-16 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => handleVote(report.id, true, e)}
                    className="flex items-center gap-1.5 text-sm text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Like className="h-4 w-4" />
                    <span>مصداقي ({report.votes_credible})</span>
                  </button>
                  <button
                    onClick={(e) => handleVote(report.id, false, e)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Dislike className="h-4 w-4" />
                    <span>غير مصداقي ({report.votes_not_credible})</span>
                  </button>
                  <div className="flex items-center gap-1 text-sm text-gray-400 mr-auto">
                    <ChatRound className="h-4 w-4" />
                    <span>{report.comments_count} تعليق</span>
                  </div>
                  <div className="text-sm font-bold text-gray-600">
                    النقاط: {report.credibility_score > 0 ? "+" : ""}{report.credibility_score}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
