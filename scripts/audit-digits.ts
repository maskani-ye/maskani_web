// حارس: كل حقل رقميّ في الويب يجب أن يمرّر مدخلاته عبر toEnglishDigits.
// سببه أن الثغرة تعود بصمت: يكتب أحدنا حقلاً جديداً بـinputMode="decimal"،
// فيُدخل المستخدم «٥٠٠٠» بلوحته العربية، ويصل الخادمَ نصٌّ غير رقميّ.
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const roots = ["app", "components"];
const NUMERIC = ['inputMode="decimal"', 'inputMode="numeric"', 'type="number"'];
const files: string[] = [];
const walk = (d: string) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p)) files.push(p);
  }
};
roots.forEach(walk);

let bad = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/<input\b[\s\S]{0,900}?\/>/g)) {
    const b = m[0];
    if (!NUMERIC.some((k) => b.includes(k))) continue;
    if (!b.includes("onChange") || b.includes("readOnly")) continue;
    if (b.includes("toEnglishDigits")) continue;
    bad++;
    console.log(`✗ ${f}: حقل رقميّ بلا toEnglishDigits`);
  }
}
console.log(bad === 0
  ? `✅ كل الحقول الرقمية تحوّل الأرقام العربية (${files.length} ملفاً مفحوصاً)`
  : `❌ ${bad} حقلاً بلا تحويل`);
process.exit(bad === 0 ? 0 : 1);
