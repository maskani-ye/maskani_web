"use client";

// ─── CityFirstVisitModal ────────────────────────────────────────────────────
// اختيار المدينة **إجباري** عند أول زيارة بلا مدينة محفوظة (للزائر أيضاً) —
// مطابق لسلوك التطبيق. المودال لا يُغلق ولا يوجد «كل المدن»: يجب اختيار مدينة
// للمتابعة. البوابة الوحيدة هي وجود مدينة محفوظة؛ فطالما لا مدينة يُعاد العرض
// عند كل تحميل. القرار داخل useEffect (بعد التحميل) لتفادي عدم تطابق SSR.
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { Dialog } from "@/components/ui/Dialog";
import { MapPoint, Magnifer } from "@solar-icons/react";
import type { City } from "@/types";

const CITY_KEY = "maskani_selected_city";

export function CityFirstVisitModal() {
  const { cityId, setCity } = useCity();
  const { code: countryCode, country, loading: countryLoading } = useCountry();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // إجباري: نعرض ما لم تكن هناك مدينة محفوظة. لا علَم «تم العرض» — الحسم
    // الوحيد هو وجود مدينة (فلا مهرب من الاختيار).
    let hasCity = false;
    try {
      hasCity = !!localStorage.getItem(CITY_KEY);
    } catch {
      return; // localStorage غير متاح — لا نعرض
    }
    if (hasCity) return;
    // ⚠️ ننتظر تحديد الدولة: كانت القائمة تُجلب بلا فلتر، فيُطلب من زائر
    // القاهرة أن يختار محافظةً يمنية — وهو أوّل ما يراه على المنصّة.
    if (countryLoading || !countryCode) return;

    api
      .get<{ results?: City[] }>("/cities/", {
        params: { offset: 0, limit: 100, country: countryCode },
      })
      .then((r) => {
        const list: City[] = r.data.results ?? [];
        if (list.length) {
          setCities(list);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, [countryCode, countryLoading]);

  const choose = (c: City) => {
    setCity(String(c.id), c.name_ar);
    setOpen(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name_ar.toLowerCase().includes(q) ||
        c.name_en?.toLowerCase().includes(q)
    );
  }, [cities, query]);

  // لا نعرض إن أُغلق أو إن صار هناك مدينة مختارة (أمان إضافي)
  if (!open || cityId) return null;

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      dismissable={false}
      hideClose
      title={
        <span className="flex items-center gap-2">
          <MapPoint className="h-5 w-5 text-primary" />
          اختر مدينتك للمتابعة
        </span>
      }
    >
      <p className="text-sm text-gray-500 mb-3">
        نعرض لك عقارات وخدمات مدينتك{country?.name_ar ? ` في ${country.name_ar}` : ""}. اختر
        مدينتك للمتابعة — يمكنك تغيير المدينة أو الدولة لاحقاً من الأعلى.
      </p>

      {/* بحث */}
      <div className="relative mb-3">
        <Magnifer className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مدينة..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-9 pe-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* قائمة المدن — لا «كل المدن»: يجب اختيار مدينة */}
      <div className="mt-1 divide-y divide-gray-100">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => choose(c)}
            className="flex w-full items-center gap-3 px-3 py-3 text-start hover:bg-primary/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPoint className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {c.name_ar}
              </span>
              {c.region && (
                <span className="text-xs text-gray-400">{c.region}</span>
              )}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            لا توجد مدينة مطابقة
          </p>
        )}
      </div>
    </Dialog>
  );
}
