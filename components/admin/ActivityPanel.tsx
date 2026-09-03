"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { History, Refresh, AltArrowLeft, AltArrowRight } from "@solar-icons/react";

/**
 * لوحة العمليات الجانبية — ثابتة في كل تبويبات لوحة التحكّم.
 *
 * موضعها الحافة المقابلة لشريط التنقّل، فلا يتكدّس عمودان على جهة واحدة
 * ويبقى المحتوى في وسط الشاشة لا محشوراً في طرفها.
 *
 * تحديث تلقائي كل دقيقة: مشرفٌ يتابع بلاغاً حيّاً يحتاج أن يرى الجديد بلا نقر،
 * والدقيقة كافية لمنصّة بهذا الحجم بلا إغراق الخادم.
 */

interface Item {
  kind: string; label: string; icon: string; title: string;
  actor: string; target_type: string; target_id: number | null; at: string;
}

const REFRESH_MS = 60_000;

// الفلاتر مجمّعة بالمعنى لا بالكيان: المشرف يسأل «ما جرى في العقارات؟» لا «كم صفّ
// Property أُنشئ؟» — فالطلب وعرضه وجهان لحدث واحد، ويجمعهما زرّ واحد.
const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "property", label: "عقارات" },
  { key: "user", label: "مستخدمون" },
  { key: "request,request_offer", label: "طلبات وعروض" },
  { key: "job,job_offer,service", label: "خدمات وعروضها" },
  { key: "comment,rating,review,favorite,follow", label: "تفاعل" },
  { key: "conversation,message,helpdesk", label: "محادثات" },
  { key: "fraud_report,fraud_vote,fraud_comment,user_report,block,verification", label: "رقابة" },
  { key: "visit,device,guest_alert,saved_search", label: "زيارات وأجهزة" },
  { key: "admin_action", label: "إجراءات إدارية" },
];

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `${Math.floor(s / 60)} د`;
  if (s < 86400) return `${Math.floor(s / 3600)} س`;
  return `${Math.floor(s / 86400)} ي`;
}

const HREF: Record<string, (id: number) => string> = {
  property: (id) => `/properties/${id}`,
  user: (id) => `/users/${id}`,
  request: (id) => `/requests/${id}`,
  job: (id) => `/jobs/${id}`,
  service: (id) => `/services/${id}`,
  report: (id) => `/reports/${id}`,
};

export default function ActivityPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  //: يُحفظ الطيّ محلياً — المشرف الذي يحتاج عرضاً أوسع لا يعيد طيّه كل صفحة.
  const [collapsed, setCollapsed] = useState(false);
  //: الفلتر المختار يُحفظ كذلك — مشرف الرقابة يبقى على تبويبه بين الصفحات.
  const [types, setTypes] = useState("");

  useEffect(() => {
    setCollapsed(localStorage.getItem("maskani_activity_collapsed") === "1");
    setTypes(localStorage.getItem("maskani_activity_types") ?? "");
  }, []);

  const pick = (key: string) => {
    localStorage.setItem("maskani_activity_types", key);
    setTypes(key);
  };

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem("maskani_activity_collapsed", c ? "0" : "1");
      return !c;
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ results: Item[] }>(endpoints.admin.activity, {
        params: { limit: 40, ...(types ? { types } : {}) },
      });
      setItems(data.results ?? []);
    } catch {
      // لوحة مرافقة لا صفحة رئيسية: فشل التحديث لا يُقحم خطأً في كل تبويب.
    } finally {
      setLoading(false);
    }
  }, [types]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  if (collapsed) {
    return (
      <aside className="hidden xl:flex w-11 shrink-0 bg-white border-s border-muted-100 sticky top-0 h-screen flex-col items-center pt-4 gap-3">
        <button type="button" onClick={toggle} title="إظهار سجلّ العمليات"
          className="p-2 rounded-lg text-muted-500 hover:bg-muted-100">
          <AltArrowRight className="h-4 w-4" />
        </button>
        <History className="h-5 w-5 text-primary/60" />
      </aside>
    );
  }

  return (
    <aside className="hidden xl:flex w-72 shrink-0 bg-white border-s border-muted-100 sticky top-0 h-screen flex-col">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-muted-100 shrink-0">
        <History className="h-4 w-4 text-primary" />
        <span className="text-body font-bold text-ink">آخر العمليات</span>
        <button type="button" onClick={load} title="تحديث"
          className="ms-auto p-1.5 rounded-lg text-muted hover:bg-muted-100 hover:text-primary">
          <Refresh className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button type="button" onClick={toggle} title="طيّ"
          className="p-1.5 rounded-lg text-muted hover:bg-muted-100">
          <AltArrowLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="shrink-0 flex flex-wrap gap-1 px-3 py-2 border-b border-muted-100">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => pick(f.key)}
            className={`text-micro rounded-lg px-2 py-1 font-semibold transition-colors ${
              types === f.key
                ? "bg-primary text-white"
                : "bg-muted-100 text-muted-600 hover:bg-muted-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 && (
          <p className="text-center text-caption text-muted py-8">
            {loading ? "جارٍ التحميل…" : "لا عمليات في هذا الفلتر."}
          </p>
        )}
        {items.map((it, i) => {
          const href = it.target_id && HREF[it.target_type] ? HREF[it.target_type](it.target_id) : null;
          const row = (
            <div className="flex items-start gap-2 px-2 py-2 rounded-xl">
              <span className="text-body-lg leading-none mt-0.5 shrink-0">{it.icon || "•"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-caption font-bold text-ink truncate">
                  {it.label}
                  {it.actor && <span className="font-normal text-muted"> · {it.actor}</span>}
                </p>
                <p className="text-micro text-muted-500 truncate">{it.title}</p>
              </div>
              <span className="text-micro text-muted shrink-0 mt-0.5 tabular-nums">{ago(it.at)}</span>
            </div>
          );
          return href ? (
            <a key={`${it.kind}-${it.target_id}-${i}`} href={href} target="_blank"
               rel="noopener noreferrer" className="block hover:bg-muted-50 rounded-xl">{row}</a>
          ) : (
            <div key={`${it.kind}-${i}`}>{row}</div>
          );
        })}
      </div>
    </aside>
  );
}
