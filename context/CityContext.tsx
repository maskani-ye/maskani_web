"use client";

// ─────────────────────────────────────────────────────────────────────────
//  حالة المدينة العامة — مصدر واحد لاختيار المدينة عبر كل الصفحات العامة
//  (مثل التطبيق). تُحفظ في localStorage تحت المفتاح `maskani_selected_city`.
//  القراءة تتم داخل useEffect فقط لتفادي عدم تطابق SSR/hydration.
// ─────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "maskani_selected_city";

interface CityContextType {
  /** مُعرّف المدينة المختارة كنص، أو "" حين "كل المدن" */
  cityId: string;
  /** الاسم العربي للمدينة المختارة (للعرض وتوسيط الخريطة) */
  cityName: string;
  /** يحدّث المدينة العامة ويُثبّتها في localStorage — مرّر "" للمسح */
  setCity: (id: string, name: string) => void;
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [cityId, setCityId] = useState("");
  const [cityName, setCityName] = useState("");

  // القراءة الأولى من localStorage — بعد التحميل فقط (لا أثناء الـ render)
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
    }
  }, []);

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

  return (
    <CityContext.Provider value={{ cityId, cityName, setCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within CityProvider");
  return ctx;
}
