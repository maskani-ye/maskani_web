// ─── إعدادات AdSense ────────────────────────────────────────────────────────
// معرّف الناشر عامّ بطبيعته (يُدمج في كل صفحة ويظهر في ads.txt)، فتثبيته هنا
// مقصود لا تسريب، مع إمكانية تجاوزه من البيئة.

export const AD_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2707392048842553";

/** الإعلانات تعمل ما لم تُطفأ صراحةً (`NEXT_PUBLIC_ADS_ENABLED=false`). */
export const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED !== "false";

/** معرّفات الشرائح — تُنشأ في لوحة AdSense وتُضبط في متغيّرات البيئة.
 *  الشريحة الفارغة = لا إعلان في ذلك الموضع (بلا مربّع فارغ). */
export const AD_SLOTS = {
  /** أسفل قوائم المنصّة — الوحدة الوحيدة خارج المدونة (كثافة خفيفة). */
  listBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST || "",
  /** أعلى المقال، تحت العنوان مباشرةً. */
  articleTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_TOP || "",
  /** داخل نصّ المقال (in-article). */
  articleMid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_MID || "",
  /** أسفل المقال بعد المحتوى. */
  articleBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM || "",
  /** قائمة المدونة. */
  blogList: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST || "",
} as const;

/** المسارات **المؤهَّلة** للإعلان — قائمة سماح، وكل ما عداها بلا إعلان.
 *
 *  ⚠️ **قرار 2026‑10‑25 بعد رفض أدسنس الثالث («محتوى منخفض القيمة»).** كانت
 *  قائمةَ منع، فكل صفحةٍ جديدة تُولد مؤهَّلة: صفحات الأسواق والمدن والدول وقوائم
 *  الخدمات والطلبات والبلاغات — وأغلبها شبه فارغ أو مبنيّ على عقاراتٍ منقولة.
 *  والسكربت وحده يُشغّل **الإعلانات التلقائية**، فوجوده في صفحةٍ = إعلانٌ فيها.
 *  الإعلان الآن بجوار محتوانا التحريريّ وحده: الأدوات، والبوّابة (أرقام السوق
 *  المحسوبة)، والمقال المراجَع يدوياً (تقرّره صفحته بـ`force`). */
const AD_ELIGIBLE = [/^\/$/, /^\/tools(\/|$)/, /^\/blog(\/|$)/];

/**
 * مسارات لا يُحمَّل فيها سكربت أدسنس من الجذر — الصفحة نفسها تقرّر من بياناتها.
 * المدوّنة: الإعلان على المقال المراجَع يدوياً وحده (سياسة «المحتوى المُنشأ
 * تلقائياً دون مراجعة»)، وقائمتها خليطٌ من المراجَع وغيره فتبقى بلا إعلان.
 */
export function isManualAdsPath(pathname: string | null): boolean {
  return !!pathname && (pathname === "/blog" || pathname.startsWith("/blog/"));
}

export function isAdFreePath(pathname: string | null): boolean {
  if (!pathname) return true;
  return !AD_ELIGIBLE.some((re) => re.test(pathname));
}
