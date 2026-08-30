"use client";

import { useEffect } from "react";
import { useCountry } from "@/context/CountryContext";

/**
 * يفرض سوق المسار على سياق الدولة — **العنوان يفوز دائماً**.
 *
 * ⚠️ بلا هذا يقع تناقضٌ صامت: زائرٌ حفظ «السعودية» في متصفّحه يفتح رابط
 * `/ye/properties` وصله من صديق، فيرى عقارات السعودية على عنوان اليمن. القاعدة:
 * ما في المسار هو الحقيقة، والمحفوظ اقتراحٌ لا حكم.
 */
export function MarketSync({ market }: { market: string }) {
  const { code, countries, setCountry } = useCountry();

  // ⚠️ كعكة `mk_market` تُقرأ **في الحافة**: الروابط القديمة بلا بادئة
  // (`/properties` من مفضّلة أو من نتيجة بحث) تُحوَّل إلى سوق الزائر نفسه بدل
  // أن ترميه في السوق الافتراضي. `localStorage` لا يُقرأ في الحافة، فلزمت كعكة.
  useEffect(() => {
    document.cookie = `mk_market=${market.toLowerCase()}; path=/; max-age=31536000; samesite=lax`;
  }, [market]);

  useEffect(() => {
    if (!countries.length) return;
    if (code?.toLowerCase() === market.toLowerCase()) return;
    const target = countries.find((c) => c.code.toLowerCase() === market.toLowerCase());
    if (target) setCountry(target);
  }, [market, code, countries, setCountry]);

  return null;
}
