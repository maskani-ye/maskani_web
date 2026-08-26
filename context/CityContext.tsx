"use client";

// ─────────────────────────────────────────────────────────────────────────
//  حالة المدينة العامة — مصدر واحد لاختيار المدينة عبر كل الصفحات العامة
//  (مثل التطبيق). تُحفظ في localStorage تحت المفتاح `maskani_selected_city`.
//  القراءة تتم داخل useEffect فقط لتفادي عدم تطابق SSR/hydration.
//
//  ⚠️ المدينة تابعةٌ للدولة، فهذا السياق يملك **دورة حياتها كاملةً**:
//  كان `setCountry` يمسح المدينة من التخزين ولا يمسح حالة React، فتبقى صنعاء
//  عاملةً في الذاكرة بينما الواجهة تقول «مصر» — يرى القاهريّ بيانات صنعاء.
//  مالكان لحالةٍ واحدة يعني حالتين متضاربتين، فجُمع الملك هنا: عند كل تغيّر
//  للدولة نُطابق المدينة معها، وننتقي مدينتها الأولى (العاصمة بحكم `order`)
//  إن كانت المحفوظة تتبع دولةً أخرى.
// ─────────────────────────────────────────────────────────────────────────
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { api } from "@/lib/api";
import { useCountry } from "@/context/CountryContext";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "maskani_selected_city";

interface CityRow {
  id: number;
  name_ar: string;
  name_en?: string;
  image?: string | null;
  image_popout?: string | null;
}

interface CityContextType {
  /** مُعرّف المدينة المختارة كنص، أو "" حين لا اختيار */
  cityId: string;
  /** الاسم العربي للمدينة المختارة (للعرض وتوسيط الخريطة) */
  cityName: string;
  /** مدن الدولة المختارة فقط — مرتّبة بالعاصمة أولاً (`order` من الخادم) */
  cities: CityRow[];
  /** true قبل اكتمال أوّل مطابقة مدينة/دولة — تمنع جلباً بمدينةٍ خاطئة */
  loading: boolean;
  /** يحدّث المدينة العامة ويُثبّتها في localStorage — مرّر "" للمسح */
  setCity: (id: string, name: string) => void;
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const { code, loading: countryLoading } = useCountry();
  const { user, refreshUser } = useAuth();
  const [cityId, setCityId] = useState("");
  const [cityName, setCityName] = useState("");
  const [cities, setCities] = useState<CityRow[]>([]);
  const [restored, setRestored] = useState(false);
  const [loading, setLoading] = useState(true);

  // نقرأ المُعرّف داخل التأثير عبر ref لا عبر التبعيات: وضعه في deps يُعيد
  // تشغيل المطابقة عند كل اختيار مدينة فيدور الجلب بلا نهاية.
  const cityIdRef = useRef("");
  cityIdRef.current = cityId;
  const prevCodeRef = useRef("");

  const setCity = useCallback((id: string, name: string) => {
    setCityId(id);
    setCityName(name);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name }));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* التخزين غير متاح — نتجاهل بصمت */
    }
  }, []);

  // ① القراءة الأولى من localStorage — بعد التحميل فقط (لا أثناء الـ render)
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.id != null) {
        setCityId(String(parsed.id));
        setCityName(typeof parsed.name === "string" ? parsed.name : "");
      } else {
        // صيغة قديمة: مُعرّف خام مخزَّن كنص (مثل "3")
        setCityId(String(parsed));
      }
    } catch {
      // نص قديم غير JSON — عامله كمُعرّف
      if (raw) setCityId(raw);
    } finally {
      setRestored(true);
    }
  }, []);

  // ② مطابقة المدينة مع الدولة — تعمل عند أوّل تحديد وعند كل تبديل.
  useEffect(() => {
    if (!restored || countryLoading) return;
    if (!code) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const switched = prevCodeRef.current !== "" && prevCodeRef.current !== code;
    prevCodeRef.current = code;

    api
      .get<{ results?: CityRow[] }>("/cities/", {
        params: { limit: 100, country: code },
      })
      .then((r) => {
        if (cancelled) return;
        const list = r.data.results ?? [];
        setCities(list);

        const current = cityIdRef.current;
        if (current && list.some((c) => String(c.id) === current)) return; // تتبعها — لا تمسّها

        // المحفوظة تتبع دولةً أخرى (أو بدّل المستخدم الدولة): ننتقي مدينة
        // الدولة الأولى — وهي العاصمة بحكم `order` من الخادم لا الأبجدية.
        // نُبقي "" في أوّل زيارة بلا اختيار كي يظهر المودال الإجباري.
        if (!current && !switched) return;
        const first = list[0];
        if (first) setCity(String(first.id), first.name_ar);
        else setCity("", "");
      })
      .catch(() => {
        /* الشبكة متعذّرة — نُبقي المحفوظ بدل إفراغ اختيار المستخدم */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, restored, countryLoading, setCity]);

  /**
   * ③ مزامنة المدينة إلى **الحساب** لا إلى المتصفّح وحده.
   *
   * ⚠️ الويب يفرض اختيار المدينة على كل زائر (`CityFirstVisitModal` غير قابل
   * للإغلاق)، لكن الاختيار كان يُحفظ في `localStorage` فقط ولا يُربط بالحساب.
   * النتيجة المقيسة: **٦٧ مستخدماً، ٤ منهم فقط لهم مدينة (٥٪)** — فلا تُعرف
   * دولة ٩١٪ منهم، ولا تقوم حملة تسويقية موجّهة على بيانات غائبة.
   *
   * المستخدم اختار مدينته فعلاً؛ كنّا نحن من لا يسجّلها. لا نضيف خطوة جديدة
   * ولا احتكاكاً — نحفظ ما اختاره.
   *
   * الشرط `!user.city`: لا نطغى على مدينةٍ ضبطها المستخدم في ملفّه من قبل،
   * فاختياره الصريح في الملف أوثق من تفضيل جهازٍ قد يكون لجهاز آخر.
   */
  const syncedRef = useRef<string>("");
  useEffect(() => {
    if (!user || !cityId) return;
    if (user.city) return; // له مدينة في ملفّه — لا نلمسها
    if (syncedRef.current === `${user.id}:${cityId}`) return;
    syncedRef.current = `${user.id}:${cityId}`;
    api
      .patch("/auth/me/", { city: Number(cityId) })
      .then(() => refreshUser())
      .catch(() => {
        // فشل المزامنة لا يُعطّل التصفّح — نُعيد المحاولة عند التغيير التالي.
        syncedRef.current = "";
      });
  }, [user, cityId, refreshUser]);

  return (
    <CityContext.Provider
      value={{ cityId, cityName, cities, loading, setCity }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within CityProvider");
  return ctx;
}
