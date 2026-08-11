"use client";

// شريط بحث ذكي — يحوّل جملة عربية طبيعية إلى فلاتر عقارات ويطبّقها.
// مثال: «شقة إيجار شهري غرفتين في عدن بأقل من 500 ألف».
import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { toast } from "sonner";
import { Stars, Refresh, Magnifer } from "@solar-icons/react";

export interface AiFilters {
  city?: number;
  offer_type?: string;
  rooms?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  search?: string;
}

export function SmartSearchBar({ onResult }: { onResult: (f: AiFilters) => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (q.trim().length < 3) {
      toast.error("اكتب ما تبحث عنه بجملة");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ filters: AiFilters }>(ep.aiSearchFilters, { query: q.trim() });
      const f = res.data.filters || {};
      if (!Object.keys(f).length) {
        toast.info("لم نفهم فلاتر محدّدة — جرّب صياغة أوضح (المدينة، النوع، السعر…)");
      } else {
        onResult(f);
        toast.success("طبّقنا بحثك");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-stretch gap-2 rounded-2xl border-2 border-primary/20 bg-primary/5 p-2">
      <div className="flex items-center gap-2 flex-1 px-2">
        <Stars className="h-5 w-5 text-primary shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="ابحث بجملة: شقة إيجار غرفتين في عدن بأقل من 500 ألف…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
      >
        {loading ? <Refresh className="h-4 w-4 animate-spin" /> : <Magnifer className="h-4 w-4" />}
        بحث ذكي
      </button>
    </div>
  );
}
