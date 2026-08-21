"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { History, Refresh } from "@solar-icons/react";

// سجلّ العمليات — كل ما يجري على المنصّة في تدفّق واحد.
//
// يقرأ من الكيانات مباشرةً لا من جدول أحداث، فيُظهر التاريخ كاملاً منذ اليوم
// الأول لا منذ لحظة تفعيل الصفحة — وأوّل ما يسأل عنه المشرف هو الماضي القريب.

interface Item {
  kind: string; label: string; icon: string; title: string;
  actor: string; target_type: string; target_id: number | null; at: string;
}

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "property", label: "عقارات" },
  { key: "user", label: "مستخدمون" },
  { key: "request,request_offer", label: "طلبات وعروض" },
  { key: "job,job_offer", label: "خدمات وعروضها" },
  { key: "comment,rating,review", label: "تفاعل" },
  { key: "fraud_report,user_report,verification", label: "رقابة" },
  { key: "admin_action", label: "إجراءات إدارية" },
];

/** «قبل 5 دقائق» — الوقت النسبيّ أسرع قراءةً من طابع زمنيّ كامل. */
function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `قبل ${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `قبل ${Math.floor(s / 3600)} ساعة`;
  if (s < 2592000) return `قبل ${Math.floor(s / 86400)} يوم`;
  return new Date(iso).toLocaleDateString("ar", { dateStyle: "medium" });
}

const HREF: Record<string, (id: number) => string> = {
  property: (id) => `/properties/${id}`,
  user: (id) => `/users/${id}`,
  request: (id) => `/requests/${id}`,
  job: (id) => `/jobs/${id}`,
  service: (id) => `/services/${id}`,
  report: (id) => `/reports/${id}`,
};

export default function ActivityPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [types, setTypes] = useState("");
  const [limit, setLimit] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<{ results: Item[] }>(endpoints.admin.activity, {
        params: { limit, ...(types ? { types } : {}) },
      });
      setItems(data.results ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [types, limit]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        icon={<History />}
        title="سجلّ العمليات"
        subtitle="كل ما جرى على المنصّة — عقارات وطلبات وتفاعل ورقابة"
        actions={
          <Button onClick={load} loading={loading} variant="outline" size="sm">
            <Refresh className="h-4 w-4" /> تحديث
          </Button>
        }
      />

      <Card className="p-5">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTypes(f.key)}
              className={`text-xs rounded-xl px-3 py-1.5 font-semibold transition-colors ${
                types === f.key ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="ms-auto rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-primary"
          >
            {[30, 60, 120, 200].map((n) => <option key={n} value={n}>آخر {n}</option>)}
          </select>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 divide-y divide-gray-100">
          {!loading && items.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">لا عمليات في هذا النطاق.</p>
          )}
          {items.map((it, i) => {
            const href = it.target_id && HREF[it.target_type]
              ? HREF[it.target_type](it.target_id) : null;
            const row = (
              <div className="flex items-start gap-3 py-3">
                <span className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0">
                  {it.icon || "•"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-bold">{it.label}</span>
                    {it.actor && <span className="text-gray-500"> · {it.actor}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{it.title}</p>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">{ago(it.at)}</span>
              </div>
            );
            return href ? (
              <a key={`${it.kind}-${it.target_id}-${i}`} href={href} target="_blank"
                 rel="noopener noreferrer" className="block hover:bg-gray-50 -mx-2 px-2 rounded-xl">
                {row}
              </a>
            ) : (
              <div key={`${it.kind}-${i}`}>{row}</div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
