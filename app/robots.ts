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

/**
 * مسارات لا يُسمح بزحفها إطلاقاً — **قائمةٌ قصيرة عمداً**.
 *
 * ⚠️ **المنع لا يمنع الفهرسة، بل يمنع معرفة أنّك لا تريدها.** كانت هنا أحد عشر
 * مساراً، وصفحاتنا العامّة تربط إليها كلّها (عشرة روابط إلى `/properties/create`،
 * أربعة عشر إلى `/chat`). فيصل جوجل من الرابط، ولا يستطيع القراءة، فيفهرس
 * العنوان بلا محتوى — وهو ما نبّه إليه Search Console (2026-09-17)، وأكّده فحص
 * العناوين: `/properties/create` و`/requests/create` و`/reports/create` معروفةٌ
 * لجوجل وحالتها «محظورة بـrobots.txt». وصفحةٌ ممنوعة من الزحف **لا يُقرأ منها
 * `noindex`** أبداً، فيبقى العنوان في الفهرس بلا طريقة لإخراجه.
 *
 * الصواب: تُترك قابلة للزحف وتُعلن `noindex` بنفسها (في `layout.tsx` لكل مسار،
 * لأنّ صفحاتها عميلة `"use client"` فلا تُصدِّر `metadata`). ويبقى هنا ما لا
 * يربط إليه شيءٌ عامّ ولا يعرفه جوجل أصلاً: لوحة الإدارة.
 */
const PRIVATE_PATHS = [
  "/admin",
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
