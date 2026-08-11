import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// تتبّع الزواحف server-side: محرّكات البحث وبوتات المشاركة لا تُشغّل JavaScript،
// فلا يصلها beacon المتصفّح (VisitTracker) — نلتقطها هنا على الحافة (Edge) بقراءة
// الـuser-agent ونسجّل مشاهدة الصفحة عبر الباك اند. الأنماط تُطابق detect_bot في
// الباك اند (googlebot/bingbot/gptbot/claudebot/...).
const BOT_RE =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|applebot|facebookexternalhit|twitterbot|whatsapp|telegrambot|linkedinbot|ahrefsbot|semrushbot|petalbot|gptbot|claudebot|slurp|\bbot\b|crawl|spider/i;

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export function middleware(req: NextRequest, event: NextFetchEvent) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) {
    // زاحف: سجّل مشاهدة الصفحة server-side. waitUntil يضمن إكمال الإرسال بعد
    // إرجاع الاستجابة فلا يتأخّر الزاحف. fire-and-forget — أي فشل يُتجاهل بهدوء.
    event.waitUntil(
      fetch(`${API}/analytics/track/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: req.nextUrl.pathname,
          user_agent: ua,
          platform: "web",
          kind: "view",
          referrer: req.headers.get("referer") || "",
        }),
        keepalive: true,
      }).catch(() => {}),
    );
  }
  return NextResponse.next();
}

export const config = {
  // صفحات المحتوى فقط — تُستثنى الأصول الثابتة والصور والـAPI ولوحة الإدارة
  // وملفّات الزحف (robots/sitemap) لتفادي ضجيج لا يعبّر عن فهرسة صفحة فعلية.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest|api/|admin).*)",
  ],
};
