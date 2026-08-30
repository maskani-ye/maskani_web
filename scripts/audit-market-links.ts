/**
 * حارس روابط الأقسام — لا رابط قسم بـ`next/link` المجرّد في صفحات المستخدم.
 *
 * ⚠️ **سبب وجوده**: صار لكل سوق مسارُه، فأيّ رابط إلى `/properties` يُخرج
 * الزائر من سوقه إلى تحويلٍ من الحافة يُعيده إلى سوق الكعكة — أو إلى السوق
 * الافتراضي إن غابت. أصلحنا ثلاثين موضعاً بـ`MarketLink`، وهذا الحارس يمنع
 * الموضع الحادي والثلاثين: الإصلاح بلا حارس يعمّر أسبوعاً.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const SECTION = /href="\/(properties|services|requests|jobs)"/;
const SKIP = [
  "app/admin/", "app/auth/", "app/[market]/", "app/market/",
  "app/page.tsx", "app/LandingClient.tsx", "app/location/",
  "components/nav/MarketLink.tsx",
];

const files = globSync("{app,components}/**/*.tsx", {
  exclude: (p) => p.includes("node_modules") || SKIP.some((s) => p.includes(s)),
});

const bad: string[] = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (!SECTION.test(src)) continue;
  // الملفّ يحوي رابط قسم — فيجب أن يستورد `MarketLink` لا `next/link`.
  if (/import\s+Link\s+from\s+"next\/link"/.test(src)) {
    bad.push(f);
  }
}

if (bad.length) {
  console.error(`✗ ${bad.length} ملفاً يربط إلى قسم بـ«next/link» المجرّد:`);
  bad.forEach((b) => console.error("   " + b));
  console.error('   البديل: import Link from "@/components/nav/MarketLink";');
  process.exit(1);
}
console.log("✓ كل روابط الأقسام تحمل سوقها");
