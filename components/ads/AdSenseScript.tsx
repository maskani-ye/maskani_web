"use client";

// سكربت AdSense — يُحمَّل بعد تفاعل الصفحة (`afterInteractive`) فلا يزاحم
// عرض المحتوى ولا يضرّ Core Web Vitals. لا يُحمَّل إطلاقاً في المسارات الخاصة
// (اللوحة/الشات/الحساب) — لا فائدة إعلانية منها، وسياسة أدسنس لا تحبّ صفحات
// خلف تسجيل الدخول.

import Script from "next/script";
import { usePathname } from "next/navigation";
import { AD_CLIENT, adsEnabled, isAdFreePath, isManualAdsPath } from "@/lib/ads";

/**
 * `force` تتجاوز شرط المسار — للصفحة التي تقرّر بنفسها من بياناتها (المقال
 * المراجَع يدوياً). ⚠️ وفي المدوّنة لا يُحمَّل السكربت من الجذر إطلاقاً: المسار
 * وحده لا يعرف هل رُوجع المقال، وتحميله يُفعّل الإعلانات التلقائية عليه.
 */
export function AdSenseScript({ force = false }: { force?: boolean }) {
  const pathname = usePathname();
  if (!adsEnabled) return null;
  if (!force && (isAdFreePath(pathname) || isManualAdsPath(pathname))) return null;
  return (
    <Script
      id="adsbygoogle"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
