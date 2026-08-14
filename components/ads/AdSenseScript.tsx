"use client";

// سكربت AdSense — يُحمَّل بعد تفاعل الصفحة (`afterInteractive`) فلا يزاحم
// عرض المحتوى ولا يضرّ Core Web Vitals. لا يُحمَّل إطلاقاً في المسارات الخاصة
// (اللوحة/الشات/الحساب) — لا فائدة إعلانية منها، وسياسة أدسنس لا تحبّ صفحات
// خلف تسجيل الدخول.

import Script from "next/script";
import { usePathname } from "next/navigation";
import { AD_CLIENT, adsEnabled, isAdFreePath } from "@/lib/ads";

export function AdSenseScript() {
  const pathname = usePathname();
  if (!adsEnabled || isAdFreePath(pathname)) return null;
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
