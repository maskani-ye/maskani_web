/**
 * حارس: صفحةٌ عامّة تدّعي سوقاً واحداً.
 *
 * ⚠️ **قياس 2026-09-01**: عنوان الموقع كلّه كان «مسكني — عقارات اليمن»، ومدوّنةٌ
 * فيها ١١٥ مقالاً سعودياً و١١١ عراقياً عنوانها «العقارات في اليمن»، وصفحة
 * **الرياض** تحمل الكلمة المفتاحية «عقارات اليمن». المنصّة وُلدت يمنيّة ثم صارت
 * ستّة أسواق، والنصوص لم تتبعها — وهذا انحرافٌ يعود مع كل سوقٍ جديد ما لم
 * يُقاس.
 *
 * القاعدة: الملفّات **العامّة** (تخدم كل الأسواق) لا تذكر سوقاً بعينه في
 * بياناتها الوصفية. أمّا صفحات السوق (`app/[market]`, `app/market/*`) وصفحات
 * الهبوط القُطرية فتذكر سوقها بالطبع — وهي مستثناة.
 */
import { readFileSync } from "node:fs";

/** ملفّات تُخدَم لكل الأسواق — بياناتها الوصفية يجب أن تكون محايدة. */
const GLOBAL_FILES = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/manifest.ts",
  "app/blog/page.tsx",
  "app/tools/page.tsx",
  "app/about/page.tsx",
  "app/properties/city/[slug]/page.tsx",
  "app/properties/neighborhood/[slug]/page.tsx",
];

/** أسماء الأسواق — ذِكرُ واحدٍ منها **منفرداً** في نصٍّ وصفيّ هو الادّعاء. */
const MARKETS = ["اليمن", "السعودية", "الأردن", "مصر", "العراق", "عُمان"];

/** ثلاثة أسواق فأكثر = تغطية لا ادّعاء. */
const COVERAGE_MIN = 3;
/** نافذة الأسطر المجاورة — مصفوفة كلماتٍ مفتاحية تُلفّ على أسطر عدّة. */
const WINDOW = 2;

let failed = false;
for (const file of GLOBAL_FILES) {
  let src: string;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    console.log(`⚠️  ${file}: غير موجود — حدّث قائمة الحارس`);
    continue;
  }

  const lines = src.split("\n");
  lines.forEach((line, i) => {
    const t = line.trim();
    // التعليقات تشرح العطل وتذكر الأسواق بالضرورة.
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    // رابط هبوطٍ قُطريّ (`/properties/country/<slug>`) سوقيٌّ بطبيعته: سطرٌ
    // لكل سوق داخل قائمةٍ تعدّدها كلّها. الادّعاء نصٌّ وصفيّ لا رابط.
    if (line.includes("/properties/country/")) return;
    const hits = MARKETS.filter((m) => line.includes(m));
    if (hits.length === 0) return;
    // ⚠️ **القياس على النافذة لا على السطر**: مصفوفة الكلمات المفتاحية تُلفّ
    // على أربعة أسطر، فيبدو كلٌّ منها ادّعاءً وهي مجتمعةً تغطية.
    const around = lines
      .slice(Math.max(0, i - WINDOW), i + WINDOW + 1)
      .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
      .join(" ");
    if (MARKETS.filter((m) => around.includes(m)).length >= COVERAGE_MIN) return;
    failed = true;
    console.log(`✗ ${file}:${i + 1} يذكر «${hits.join("، ")}» وحده\n    ${t.slice(0, 100)}`);
  });
}

console.log(
  failed
    ? "\n❌ صفحةٌ عامّة تدّعي سوقاً واحداً — عمّم النصّ أو اجعل الصفحة سوقيّة"
    : `\n✅ ${GLOBAL_FILES.length} ملفّاً عامّاً محايدة تجاه الأسواق`,
);
process.exit(failed ? 1 : 0);
