/**
 * حارس وعد «بلا وسيط» — وعدٌ لا نملك الوفاء به.
 *
 * ⚠️ **لماذا يسقط هذا الوعد وحده**: «بلا عمولة» صحيحة ونُبقيها — لا بوّابة دفع
 * في المنصّة ولا نأخذ نسبة من أحد. أمّا «بلا وسيط» فتَعِد بغياب طرفٍ **قد
 * يكون موجوداً**: من ينشر قد يكون مالكاً وقد يكون مكتباً أو دلّالاً، والمالك
 * نفسه يُبرم صفقات دلالة مع مُعلنين وصلته إعلاناتهم عبر واتساب. الوعد بما لا
 * نضمنه يُكسر أوّل مرّة يتّصل فيها الباحث بدلّال.
 *
 * وهذا امتدادٌ لقرارين سابقين لا اجتهادٌ جديد: هجرة `0011_scrub_broker_phrase`
 * أزالت العبارة من المدوّنة، وقائمة متجر Play مُنعت من إعادتها.
 *
 * البديل المسموح: «تواصل مباشر مع المُعلِن» — صادقٌ في الحالتين.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const PATTERN = /(?:بلا|بدون|ولا)\s*وس(?:يط|طاء)/;

const files = globSync("{app,components,lib}/**/*.{ts,tsx}", {
  exclude: (p) => p.includes("node_modules") || p.endsWith("audit-broker-claim.ts"),
});

const hits: string[] = [];
for (const f of files) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (PATTERN.test(line)) hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 90)}`);
  });
}

if (hits.length) {
  console.error(`✗ وعد «بلا وسيط» عاد في ${hits.length} موضعاً — وهو وعدٌ لا نضمنه:`);
  hits.forEach((h) => console.error("   " + h));
  console.error('   البديل: «تواصل مباشر مع المُعلِن». و«بلا عمولة» تبقى مسموحة.');
  process.exit(1);
}
console.log("✓ لا وعد بـ«بلا وسيط» في نصوص الواجهة");
