"use client";

// beacon تتبّع الزيارات (طرف أوّل) — يسجّل كل عرض صفحة في الباك اند لتغذية لوحة
// التحليلات. خفيف: fetch مع keepalive، بلا مصادقة إلزامية، ولا يكسر التنقّل إن فشل.
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

function visitorId(): string {
  try {
    let id = localStorage.getItem("mk_vid");
    if (!id) {
      // معرّف زائر ثابت لكل متصفّح (يبقى عبر الجلسات) → عدّ دقيق بلا تكرار.
      id = crypto.randomUUID?.() ?? `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("mk_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // نتجاهل صفحات الإدارة (زيارات داخلية إدارية) من إحصاءات الجمهور.
    if (pathname.startsWith("/admin")) return;
    const q = searchParams.toString();
    const path = q ? `${pathname}?${q}` : pathname;
    try {
      fetch(`${API}/analytics/track/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          platform: "web",
          referrer: document.referrer || "",
          session_id: visitorId(),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* لا شيء — التتبّع أفضل-جهد */
    }
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
