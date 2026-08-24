/**
 * حارس سياسة الإعلانات — يمنع رجوع مخالفةٍ عوقب بها موقعٌ في حسابنا فعلاً.
 *
 * سياسات ناشري جوجل تمنع الإعلان على «شاشات بلا محتوى ناشر أو بمحتوى قليل
 * القيمة». وكنّا نعرض وحدةً أسفل قائمة العقارات حتى حين لا نتيجة فيها.
 *
 * القاعدة المفروضة هنا: **كل `<AdSlot` في صفحة قائمة يجب أن يمرّر `hasContent`**.
 * يُستثنى ما كان في صفحة محتواها مضمون (مقال/تفاصيل تستدعي `notFound` بلا بيانات).
 *
 *     npx tsx scripts/audit-ads.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** صفحات محتواها مضمون: تستدعي notFound() إن غاب المحتوى. */
const GUARANTEED = [/app\/blog\/\[slug\]\/page\.tsx$/];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(p)) out.push(p);
  }
  return out;
}

const offenders: string[] = [];
for (const file of walk("app").concat(walk("components"))) {
  if (file.includes("components/ads/")) continue;
  const src = readFileSync(file, "utf8");
  if (!src.includes("<AdSlot")) continue;
  if (GUARANTEED.some((re) => re.test(file))) continue;

  // كل استدعاء على حدة: نلتقط الوسم كاملاً حتى الإغلاق.
  const calls = src.match(/<AdSlot[\s\S]*?\/>/g) ?? [];
  for (const call of calls) {
    if (!call.includes("hasContent")) {
      offenders.push(`${file}: ${call.replace(/\s+/g, " ").slice(0, 80)}`);
    }
  }
}

if (offenders.length) {
  console.error("✗ وحدات إعلانية بلا شرط محتوى (مخالفة سياسة محتملة):");
  for (const o of offenders) console.error("   " + o);
  process.exit(1);
}
console.log("✅ كل الوحدات الإعلانية مشروطة بوجود محتوى");
