"use client";

// Google Analytics 4 — معرّف القياس G-HL5LQLL3DD يخصّ خاصية GA4 التابعة لنفس
// مشروع Google/Firebase «maskani-d808a» المرتبط بـ Search Console (معرّف عام
// يُكشف في الصفحة أصلاً، لذا يُثبَّت افتراضياً كما في firebaseConfig — ويمكن
// تجاوزه عبر NEXT_PUBLIC_GA_ID). يتتبّع مشاهدات الصفحات عند التنقّل داخل تطبيق
// App Router (الذي لا يُطلق إعادة تحميل كاملة).
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-HL5LQLL3DD";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/// إرسال حدث مخصّص إلى GA4 من أي مكان في التطبيق (آمن إن كان معطّلاً).
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}

function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        // lazyOnload لا afterInteractive: 150 ك.ب من جوجل كانت تزاحم رسم الصفحة
        // على الجوّال. القياس الأساسي عندنا أوّليّ (VisitTracker) فلا نفقد بيانات.
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
