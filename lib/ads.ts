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

/** مسارات لا تُعرض فيها إعلانات إطلاقاً.
 *
 *  لوحة الإدارة والمحادثات والحساب والنماذج ليست محتوى للقراءة: الإعلان فيها
 *  يفسد أداة يستخدمها الناس، وبعضها (الشات/الحساب) قد يخالف سياسة أدسنس أصلاً
 *  لأنها صفحات خاصة خلف تسجيل دخول. */
const AD_FREE_PREFIXES = [
  "/admin",
  "/chat",
  "/profile",
  "/account",
  "/auth",
  "/notifications",
  "/favorites",
  "/saved-searches",
  "/help",
];

export function isAdFreePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (AD_FREE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // صفحات النشر والتعديل — المستخدم في منتصف مهمّة، لا يُقاطَع.
  return /\/(create|edit|my)(\/|$)/.test(pathname);
}
