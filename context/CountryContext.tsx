"use client";

// ─────────────────────────────────────────────────────────────────────────
//  حالة الدولة العامة — تُحدَّد تلقائياً عند أوّل فتح من عنوان الزائر، ثم
//  يبقى الاختيار بيده. تُحفظ في localStorage تحت `maskani_selected_country`.
//
//  قاعدة مقصودة: الكشف التلقائي يجري **مرّة واحدة فقط** (عند غياب اختيار
//  محفوظ). لو أعدنا الكشف كل زيارة لأبطلنا اختيار مَن يتصفّح سوقاً غير سوقه
//  (مغترب يبحث عن عقار في بلده) — وهو بالضبط ما تحتاجه منصّة عابرة للحدود.
// ─────────────────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isMarket, marketPath, splitMarket } from "@/lib/markets";
import { api } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import type { Country } from "@/types";

const STORAGE_KEY = "maskani_selected_country";

interface CountryContextType {
  /** رمز ISO للدولة المختارة (مثل "YE")، أو "" قبل اكتمال التحديد */
  code: string;
  country: Country | null;
  /** كل الدول المفعّلة — تملأ قائمة الاختيار */
  countries: Country[];
  loading: boolean;
  /** تغيير الدولة يدوياً — يُثبَّت فوراً ويُلغي الكشف التلقائي لاحقاً */
  setCountry: (c: Country) => void;
}

const CountryContext = createContext<CountryContextType | null>(null);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  /**
   * ⚠️ **العنوان يملك السوق — ومن أوّل تصيير لا بعد نداء.**
   *
   * كان `MarketSync` يصحّح السياق **بعد** تحميل قائمة الدول، فتسبقه القوائم
   * وتجلب بالدولة المحفوظة في المتصفّح: يفتح الزائر `/sa` فيرى الأردن — وهو
   * ما وقع فعلاً. مصدران للحقيقة (المسار والتخزين) يعني سباقاً، والسباق يُحسم
   * لصالح الخطأ كلّما كان النداء أبطأ.
   *
   * الآن يُشتقّ الرمز من المسار **تزامنياً** فيصحّ أوّل طلب. والتخزين المحلّي
   * ينزل إلى دوره الصحيح: اقتراحٌ لمن دخل من `/` لا حاكمٌ على من فتح رابط سوق.
   */
  const pathname = usePathname();
  const router = useRouter();
  const urlMarket = useMemo(() => splitMarket(pathname || "/").market, [pathname]);

  const [country, setCountryState] = useState<Country | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) اختيار محفوظ؟ يفوز دائماً على الكشف.
      let saved: Country | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) saved = JSON.parse(raw) as Country;
      } catch {
        /* تخزين غير متاح أو قيمة تالفة — نتابع بالكشف */
      }
      if (saved?.code && !cancelled) setCountryState(saved);

      // 2) قائمة الدول — تُعرض في المُبدِّل ويُطابَق بها الكشف.
      try {
        const { data } = await api.get<{ results: Country[] }>(ep.countries, {
          params: { limit: 100 },
        });
        const list = data.results ?? [];
        if (!cancelled) setCountries(list);

        // 3) لا اختيار محفوظ ولا سوق في المسار → نكشف الدولة من الخادم مرّة.
        //    ⚠️ المسار يسبق الكشف: من فتح `/sa` لا يُسأل الخادم عن بلده.
        if (!saved?.code && !urlMarket) {
          const { data: det } = await api.get<{
            supported: boolean;
            country: Country | null;
          }>(ep.detectCountry);
          const picked = det.country ?? list[0] ?? null;
          if (picked && !cancelled) {
            setCountryState(picked);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(picked));
            } catch {
              /* تجاهل */
            }
          }
        }
      } catch {
        /* الشبكة متعذّرة — نبقى على المحفوظ إن وُجد */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMarket]);

  // متى وصلت القائمة، يُطابَق كائن الدولة بسوق المسار (الرمز صحيح قبلها أصلاً).
  useEffect(() => {
    if (!urlMarket || !countries.length) return;
    const hit = countries.find((c) => c.code.toLowerCase() === urlMarket);
    if (hit && hit.code !== country?.code) setCountryState(hit);
  }, [urlMarket, countries, country?.code]);

  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
    // ⚠️ داخل مسار سوق **لا يجوز** أن يتغيّر المحتوى والعنوان ثابت: نُبدّل
    // العنوان نفسه فيبقى الرابط صادقاً ويُفهرَس كل سوق بصفحاته.
    if (urlMarket && isMarket(c.code.toLowerCase()) && c.code.toLowerCase() !== urlMarket) {
      router.push(marketPath(c.code.toLowerCase(), splitMarket(pathname || "/").rest));
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
      // ⚠️ لا نلمس المدينة هنا. كان هذا الموضع يمسحها من التخزين وحده فتبقى
      // حالة React عاملةً بمدينة الدولة السابقة — يرى القاهريّ بيانات صنعاء.
      // `CityProvider` (المُتداخل تحتنا) يراقب `code` ويطابق المدينة معه.
    } catch {
      /* تجاهل */
    }
  }, []);

  return (
    <CountryContext.Provider
      value={{
        // الرمز من المسار تزامنياً — قبل أن تصل أي قائمة أو يُقرأ أي تخزين.
        code: urlMarket ? urlMarket.toUpperCase() : (country?.code ?? ""),
        country,
        countries,
        // ⚠️ داخل سوق لا يوجد «انتظار»: الرمز معروف من العنوان، وإبقاء
        // `loading` صحيحاً يُجمّد القوائم بلا سبب.
        loading: urlMarket ? false : loading,
        setCountry,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
