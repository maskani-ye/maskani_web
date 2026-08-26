"use client";

/**
 * حارس الموقع — يحوّل إلى `/location` من الشاشات التي لا معنى لها بلا سوق.
 *
 * ⚠️ **الفخّ الذي يتجنّبه هذا الملفّ:** زاحف جوجل **يُنفّذ JavaScript** ولا
 * يملك تخزيناً محلّياً — فبلا استثناء صريح يُحوَّل هو أيضاً، وتصير كل صفحاتك
 * المفهرسة «اختر موقعك» في نتائج البحث. الخسارة صامتة ولا تظهر إلا بعد
 * أسابيع حين تسقط الفهرسة.
 *
 * ثلاثة حرّاس متتالية قبل أي تحويل:
 *   ① وكيلٌ زاحف؟ لا تحويل أبداً (نفس نمط `middleware.ts`).
 *   ② ما زال السياق يحمّل؟ انتظر — التحويل بحالةٍ ناقصة يطرد زائراً له مدينة.
 *   ③ المسار مشمول؟ الشاشات التي لا تعتمد على السوق (مقال، بلاغ، ملفّ) تُترك.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";

/** المسارات التي لا معنى لمحتواها بلا مدينة — الجذر ثمّ الأقسام الأربعة. */
const GATED = ["/properties", "/services", "/jobs", "/requests"];

/** نفس أنماط `middleware.ts` — مصدرٌ واحد للتعريف يمنع تباعد السلوكين. */
const BOT_RE =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|applebot|facebookexternalhit|twitterbot|whatsapp|telegrambot|linkedinbot|ahrefsbot|semrushbot|petalbot|gptbot|claudebot|slurp|\bbot\b|crawl|spider/i;

function isGated(path: string): boolean {
  if (path === "/") return true;
  return GATED.some((p) => path === p || path.startsWith(`${p}?`));
}

export function LocationGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { cityId, loading } = useCity();

  useEffect(() => {
    if (loading) return;                 // ② حالة ناقصة — لا قرار
    if (cityId) return;                  // له مدينة
    if (!isGated(pathname)) return;      // ③ شاشة لا تعتمد على السوق
    if (pathname.startsWith("/location")) return;
    if (BOT_RE.test(navigator.userAgent)) return; // ① زاحف — لا تحويل

    // ⚠️ نقرأ الاستعلام من `window` لا من `useSearchParams`: هذا المكوّن يعيش
    // في الغلاف العامّ، و`useSearchParams` هناك تُبطل التوليد الساكن **لكل
    // صفحة في الموقع** (يفشل البناء بـ missing-suspense-with-csr-bailout).
    // الحارس يعمل بعد الترطيب أصلاً، فـ`window` متاحة ومكافئة.
    const qs = window.location.search;
    const next = encodeURIComponent(pathname + qs);
    // `replace` لا `push`: التحويل خطوة إعداد لا وجهة، فلا يجوز أن يعيد زرّ
    // الرجوع المستخدمَ إليها بعد أن اختار.
    router.replace(`/location?next=${next}`);
  }, [cityId, loading, pathname, router]);

  return null;
}
