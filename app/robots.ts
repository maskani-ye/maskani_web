import type { MetadataRoute } from "next";

/**
 * توجيهات الزحف — للبحث التقليديّ **ولمحرّكات الذكاء الاصطناعي**.
 *
 * صار جزءٌ متزايد من الاكتشاف يمرّ عبر المساعدات (ChatGPT · Claude · Gemini ·
 * Perplexity) لا عبر صفحة نتائج. وهذه المحرّكات تحترم `robots.txt` وتستخدم
 * وكلاء منفصلين لكل غرض: **تدريب** و**فهرسة للإجابة** و**جلب بطلب المستخدم**.
 * السكوت يعني ترك القرار لافتراضاتها؛ والسماح الصريح يجعل المنصّة مصدراً
 * يُستشهد به حين يسأل أحدهم «أين أجد شقة في صنعاء؟».
 *
 * ⚠️ **قرار مقصود: نسمح للجميع بما في ذلك وكلاء التدريب.** محتوانا عامّ أصلاً
 * (إعلانات ينشرها أصحابها ليُروا)، ومنعُ التدريب يقلّل احتمال معرفة النموذج
 * بالمنصّة دون أن يحمي شيئاً. أمّا الصفحات الخاصّة (الشات · الحساب · اللوحة)
 * فممنوعة على الجميع بلا استثناء.
 *
 * المصادر: توثيق روبوتات OpenAI · مركز مساعدة Anthropic · إرشادات جوجل.
 */

/** مسارات خاصّة لا تُزحف إطلاقاً — لا لمحرّك بحث ولا لمساعد ذكاء اصطناعي. */
const PRIVATE_PATHS = [
  "/admin",
  "/chat",
  "/profile",
  "/favorites",
  "/notifications",
  "/services/my",
  "/properties/create",
  "/requests/create",
  "/jobs/create",
  "/reports/create",
  // نسخ الرئيسية لكل سوق — تُخدَم على `/` بإعادة كتابة من الحافة. الزاحف يصل
  // عبر `/` فيقع على نسخته تلقائياً؛ ومنعُها هنا يقطع تكرار المحتوى (ستّ صفحات
  // شبه متطابقة) قبل أن يحدث. وكلّها تحمل canonical إلى `/` أيضاً.
  "/market/",
  // شاشة إعداد لا محتوى — تُنافس الصفحات الحقيقية على استعلامات العلامة.
  "/location",
];

/** وكلاء الذكاء الاصطناعي المسموح لهم صراحةً (أسماؤهم من توثيق أصحابها). */
const AI_AGENTS = [
  // OpenAI: تدريب · فهرسة بحث ChatGPT · جلب بطلب المستخدم
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic: تدريب · جلب بطلب المستخدم · فهرسة بحث
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  // Google: طبقة الذكاء الاصطناعي (Gemini والملخّصات) — منفصلة عن Googlebot
  "Google-Extended",
  // أخرى شائعة
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "Bingbot",
  "Amazonbot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: "https://maskani.homes/sitemap.xml",
    host: "https://maskani.homes",
  };
}
