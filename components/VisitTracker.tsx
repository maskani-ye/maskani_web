"use client";

// beacon تتبّع الزيارات (طرف أوّل) — يسجّل كل عرض صفحة في الباك اند لتغذية لوحة
// التحليلات، ويلتقط utm_* للإسناد التسويقي. المنطق في lib/track.ts (مُعاد استخدامه
// أيضاً لأحداث التحويل).
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { trackPageview, utmFromSearch } from "@/lib/track";

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // نتجاهل صفحات الإدارة (زيارات داخلية إدارية) من إحصاءات الجمهور.
    if (pathname.startsWith("/admin")) return;
    const q = searchParams.toString();
    const path = q ? `${pathname}?${q}` : pathname;
    trackPageview(path, utmFromSearch(searchParams));
  }, [pathname, searchParams]);

  return null;
}

export function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
