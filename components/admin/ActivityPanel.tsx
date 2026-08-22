"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { History, Refresh, AltArrowLeft, AltArrowRight } from "@solar-icons/react";

/**
 * لوحة العمليات الجانبية — ثابتة في كل تبويبات لوحة التحكّم.
 *
 * الشريط الجانبي للتنقّل يشغل الحافة اليمنى (RTL)، فتأخذ العمليات الحافة
 * المقابلة كي لا يتكدّس عمودان على جهة واحدة ويُخنق المحتوى بينهما.
 *
 * تحديث تلقائي كل دقيقة: مشرفٌ يتابع بلاغاً حيّاً يحتاج أن يرى الجديد بلا نقر،
 * والدقيقة كافية لمنصّة بهذا الحجم بلا إغراق الخادم.
 */

interface Item {
  kind: string; label: string; icon: string; title: string;
  actor: string; target_type: string; target_id: number | null; at: string;
}

const REFRESH_MS = 60_000;

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

  useEffect(() => {
    setCollapsed(localStorage.getItem("maskani_activity_collapsed") === "1");
  }, []);

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
        params: { limit: 40 },
      });
      setItems(data.results ?? []);
    } catch {
      // لوحة مرافقة لا صفحة رئيسية: فشل التحديث لا يُقحم خطأً في كل تبويب.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  if (collapsed) {
    return (
      <aside className="hidden xl:flex w-11 shrink-0 bg-white border-e border-gray-100 sticky top-0 h-screen flex-col items-center pt-4 gap-3">
        <button type="button" onClick={toggle} title="إظهار سجلّ العمليات"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <AltArrowLeft className="h-4 w-4" />
        </button>
        <History className="h-5 w-5 text-primary/60" />
      </aside>
    );
  }

  return (
    <aside className="hidden xl:flex w-72 shrink-0 bg-white border-e border-gray-100 sticky top-0 h-screen flex-col">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-100 shrink-0">
        <History className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-ink">آخر العمليات</span>
        <button type="button" onClick={load} title="تحديث"
          className="ms-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary">
          <Refresh className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button type="button" onClick={toggle} title="طيّ"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
          <AltArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">
            {loading ? "جارٍ التحميل…" : "لا عمليات بعد."}
          </p>
        )}
        {items.map((it, i) => {
          const href = it.target_id && HREF[it.target_type] ? HREF[it.target_type](it.target_id) : null;
          const row = (
            <div className="flex items-start gap-2 px-2 py-2 rounded-xl">
              <span className="text-base leading-none mt-0.5 shrink-0">{it.icon || "•"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {it.label}
                  {it.actor && <span className="font-normal text-gray-400"> · {it.actor}</span>}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{it.title}</p>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 tabular-nums">{ago(it.at)}</span>
            </div>
          );
          return href ? (
            <a key={`${it.kind}-${it.target_id}-${i}`} href={href} target="_blank"
               rel="noopener noreferrer" className="block hover:bg-gray-50 rounded-xl">{row}</a>
          ) : (
            <div key={`${it.kind}-${i}`}>{row}</div>
          );
        })}
      </div>

      <a href="/admin/activity"
         className="shrink-0 border-t border-gray-100 py-2.5 text-center text-xs font-semibold text-primary hover:bg-primary/5">
        عرض السجلّ الكامل
      </a>
    </aside>
  );
}
