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

  /**
   * ⚠️ **حقلٌ مطابق لحقل البحث العادي — لا صندوق بنفسجيّ مميّز.**
   *
   * كان محاطاً بإطارٍ بلون العلامة وخلفيةٍ ملوّنة وزرٍّ ممتلئ، فبدا عنصراً
   * دخيلاً على شريطٍ كلّ حقوله بيضاء بحدّ رمادي شعرة. التمييز البصريّ لا يصنع
   * قيمة: الفرق في **ما يقبله الحقل** لا في لونه، ويقوله نصّ الإرشاد نفسه.
   * الأيقونة (نجوم) عند الطرف كما المكبّرة في الحقل الآخر — نفس المقاس ونفس
   * الموضع ونفس نصف القطر.
   */
  return (
    <div className="relative w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && run()}
        placeholder="ابحث بجملة: شقة إيجار غرفتين في عدن بأقل من 500 ألف…"
        className="h-10 w-full rounded-xl border border-ink/10 bg-white ps-4 pe-10 text-caption text-ink outline-none transition-colors placeholder:text-muted focus:border-primary-300"
      />
      <button
        type="button"
        onClick={run}
        disabled={loading}
        aria-label="بحث ذكي"
        className="absolute end-2 top-1/2 -translate-y-1/2 text-primary-400 transition-colors hover:text-primary disabled:opacity-60"
      >
        {loading ? <Refresh className="h-4 w-4 animate-spin" /> : <Stars className="h-4 w-4" />}
      </button>
    </div>
  );
}
