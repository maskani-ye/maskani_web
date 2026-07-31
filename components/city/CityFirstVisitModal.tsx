"use client";

// ─── CityFirstVisitModal ────────────────────────────────────────────────────
// عند أول زيارة بلا مدينة محفوظة (للزائر أيضاً) يُعرض مودال لاختيار المدينة —
// مطابق لسلوك التطبيق (Flutter). يُعرض مرّة واحدة فقط: نُثبّت علماً في
// localStorage حتى لا يتكرّر إزعاجاً. القرار يُتّخذ داخل useEffect (بعد التحميل)
// لتفادي عدم تطابق SSR/hydration ولاحترام أي مدينة محفوظة مسبقاً.
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useCity } from "@/context/CityContext";
import { Dialog } from "@/components/ui/Dialog";
import { MapPoint, Magnifer, Global } from "@solar-icons/react";
import type { City } from "@/types";

const CITY_KEY = "maskani_selected_city";
const PROMPTED_KEY = "maskani_city_prompted";

export function CityFirstVisitModal() {
  const { setCity } = useCity();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // القرار بعد التحميل فقط: لا نعرض إن سبق اختيار مدينة أو سبق العرض.
    let hasCity = false;
    let prompted = false;
    try {
      hasCity = !!localStorage.getItem(CITY_KEY);
      prompted = !!localStorage.getItem(PROMPTED_KEY);
    } catch {
      return; // localStorage غير متاح — لا نعرض
    }
    if (hasCity || prompted) return;

    api
      .get<{ results?: City[] }>("/cities/", { params: { offset: 0, limit: 100 } })
      .then((r) => {
        const list: City[] = r.data.results ?? [];
        if (list.length) {
          setCities(list);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  const markPrompted = () => {
    try {
      localStorage.setItem(PROMPTED_KEY, "1");
    } catch {
      /* تجاهل */
    }
  };

  const dismiss = () => {
    markPrompted();
    setOpen(false);
  };

  const choose = (c: City) => {
    setCity(String(c.id), c.name_ar);
    markPrompted();
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

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      title={
        <span className="flex items-center gap-2">
          <MapPoint className="h-5 w-5 text-primary" />
          اختر مدينتك
        </span>
      }
    >
      <p className="text-sm text-gray-500 mb-3">
        نعرض لك إعلانات وخدمات مدينتك — يمكنك تغييرها لاحقاً من الأعلى.
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

      {/* كل المدن */}
      <button
        type="button"
        onClick={dismiss}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start hover:bg-primary/5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <Global className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium text-gray-700">كل المدن</span>
      </button>

      {/* قائمة المدن */}
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
