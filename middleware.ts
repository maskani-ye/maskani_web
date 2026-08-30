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

/**
 * أسواق مسكني — رموز ISO للدول المفعّلة، لكل واحدة **نسخة مبنيّة مسبقاً** من
 * الرئيسية.
 *
 * ⚠️ لماذا إعادة كتابة لا `headers()` داخل الصفحة: استدعاء `headers()` يُخرج
 * المسار من التخزين نهائياً (`no-store`)، فقيس بعده LCP على الجوّال **3,948
 * م.ث** — فوق عتبة جوجل (2,500). هنا نقرأ الدولة على الحافة (رخيصة) ونعيد
 * الكتابة إلى `/market/<code>` المبنيّ مسبقاً، فيُخدَم من التخزين ويبقى نصّه
 * صحيحاً لسوق الزائر. الرابط الظاهر يبقى `/` (إعادة كتابة لا تحويل).
 *
 * القائمة ثابتة عمداً: الحافة لا تنادي الـAPI (تُبطئ كل طلب)، وفتح سوق جديد
 * حدثٌ نادرٌ مقصود يستلزم نشراً على أي حال. رمزٌ غير معروف يقع على الافتراضي.
 */
const MARKETS = ["ye", "sa", "jo", "eg", "iq", "om"] as const;
const DEFAULT_MARKET = "ye";

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
  // ─── مسارات الأسواق العامّة ───────────────────────────────────────────
  //
  // ⚠️ **`/` لم تعد تُعيد الكتابة إلى سوق.** كانت تفعل، فورثت من صفحة السوق
  // وسم `noindex` — فخرجت الصفحة الأولى للعلامة من فهرس جوجل («Excluded by
  // 'noindex' tag»، مُتحقَّق 2026‑08‑30)، ورأى الزاحف (من عناوين أمريكية) سوق
  // السعودية وفيه صفر عقار. صار `/` صفحة هبوط عالمية مفهرسة يختار منها الزائر
  // سوقه، وصار لكل سوق مسارٌ عامّ باسمه.
  const path = req.nextUrl.pathname;

  // `/market/ye` القديم → `/ye` بتحويل دائم: الرابط القديم قد يكون في مفضّلات
  // أو سجلّ زحف، و301 تنقل قوّته للمسار الجديد بدل أن تهدرها على 404.
  const legacy = path.match(/^\/market\/([a-z]{2})\/?$/);
  if (legacy && (MARKETS as readonly string[]).includes(legacy[1])) {
    const url = req.nextUrl.clone();
    url.pathname = `/${legacy[1]}`;
    return NextResponse.redirect(url, 308);
  }

  // `/ye` → يُخدَم من `/market/ye` المبنيّ مسبقاً (إعادة كتابة: الرابط يبقى `/ye`).
  const short = path.match(/^\/([a-z]{2})\/?$/);
  if (short && (MARKETS as readonly string[]).includes(short[1])) {
    const url = req.nextUrl.clone();
    url.pathname = `/market/${short[1]}`;
    return NextResponse.rewrite(url);
  }

  // ─── الروابط القديمة بلا بادئة سوق ────────────────────────────────────
  //
  // ⚠️ **تحويلٌ لا نسخة ثانية**: `/properties` كانت صفحةً واحدة تخدم ستّة
  // أسواق بنصٍّ مكتوب فيه «في اليمن» حرفياً. إبقاؤها إلى جانب `/ye/properties`
  // يعني عنوانين لمحتوى واحد. والوجهة تُقرأ من كعكة سوق الزائر إن وُجدت، وإلا
  // السوق الافتراضي — قاعدةٌ واحدة للبشر والزواحف (والزاحف بلا كعكة يقع دائماً
  // على `/ye` فتتجمّع إشاراته على وجهةٍ ثابتة لا على ستّ).
  const legacySection = path.match(/^\/(properties|services|requests|jobs)\/?$/);
  if (legacySection) {
    const cookieMarket = req.cookies.get("mk_market")?.value?.toLowerCase();
    const target = (MARKETS as readonly string[]).includes(cookieMarket || "")
      ? (cookieMarket as string)
      : DEFAULT_MARKET;
    const url = req.nextUrl.clone();
    url.pathname = `/${target}/${legacySection[1]}`;
    return NextResponse.redirect(url, 308);
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
