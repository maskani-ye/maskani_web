/**
 * الأسواق — مصدر واحد لرموزها في الويب.
 *
 * ⚠️ **الدولة صارت في المسار لا في التخزين المحلّي.** كل سوق موقعٌ قائم بذاته
 * (`/ye/properties`)، فالرمز يُقرأ من العنوان: يُشارَك الرابط فيفتح على السوق
 * الصحيح، ويُفهرس كل سوق بصفحاته، ويختفي «فلتر الدولة» لأن السؤال أُجيب عند
 * الباب. التخزين المحلّي يبقى لتذكّر **آخر سوق** فيُقترح عند الدخول من `/`.
 *
 * ⚠️ القائمة ثابتة هنا عمداً: تُقرأ في الحافة (middleware) حيث لا يجوز نداء
 * الـAPI في كل طلب. فتح سوق سابع = صفٌّ في القاعدة **و**سطرٌ هنا ونشرة.
 */
export const MARKETS = ["ye", "sa", "jo", "eg", "iq", "om"] as const;
export type MarketCode = (typeof MARKETS)[number];

export const DEFAULT_MARKET: MarketCode = "ye";

export function isMarket(code: string | undefined | null): code is MarketCode {
  return !!code && (MARKETS as readonly string[]).includes(code.toLowerCase());
}

/** الأقسام المرتبطة بسوق — وحدها تُنقل تحت البادئة. */
export const MARKET_SECTIONS = ["properties", "services", "requests", "jobs"] as const;

/**
 * يبني مسار القسم داخل سوق. يُستعمل في كل رابط داخليّ يخصّ سوقاً، فلا يتسرّب
 * رابطٌ بلا بادئة يُخرج الزائر من سوقه بلا أن يدري.
 */
export function marketPath(market: string, path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `/${market}/${clean}` : `/${market}`;
}

/**
 * يستخرج السوق من مسار حاليّ ويعيد الباقي — أساس مبدّل الدولة: التبديل يفتح
 * **نفس القسم** في السوق الآخر لا يعيد الزائر إلى البداية.
 */
export function splitMarket(pathname: string): { market: MarketCode | null; rest: string } {
  const m = pathname.match(/^\/([a-z]{2})(\/.*)?$/i);
  if (m && isMarket(m[1])) {
    return { market: m[1].toLowerCase() as MarketCode, rest: m[2] || "" };
  }
  return { market: null, rest: pathname };
}
