"use client";

// ─────────────────────────────────────────────────────────────────────────
//  حالة الدولة العامة — تُحدَّد تلقائياً عند أوّل فتح من عنوان الزائر، ثم
//  يبقى الاختيار بيده. تُحفظ في localStorage تحت `maskani_selected_country`.
//
//  قاعدة مقصودة: الكشف التلقائي يجري **مرّة واحدة فقط** (عند غياب اختيار
//  محفوظ). لو أعدنا الكشف كل زيارة لأبطلنا اختيار مَن يتصفّح سوقاً غير سوقه
//  (مغترب يبحث عن عقار في بلده) — وهو بالضبط ما تحتاجه منصّة عابرة للحدود.
// ─────────────────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
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

        // 3) لا اختيار محفوظ → نكشف الدولة من الخادم مرّة واحدة.
        if (!saved?.code) {
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
  }, []);

  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
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
      value={{ code: country?.code ?? "", country, countries, loading, setCountry }}
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
