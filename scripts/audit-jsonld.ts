/**
 * حارس: لا حقنَ لـJSON خاماً داخل `<script>`.
 *
 * ⚠️ الثغرة التي أوجبته (2026-11-21): كانت ١١ وسماً `application/ld+json` في
 * سبعة ملفات تحقن `JSON.stringify(...)` مباشرةً. `JSON.stringify` لا يهرّب `<`،
 * فعنوانُ عقارٍ أو وصفه — وهما نصّ يكتبه أيّ مستخدم — لو حوى `</script><script>…`
 * لأغلق الوسم ونفّذ شيفرته في متصفّح كل زائر للصفحة (XSS مخزّن).
 *
 * القاعدة: كل `__html` يُبنى من JSON يمرّ بـ`jsonLdHtml` (`lib/jsonLd.ts`).
 */
import { readFileSync, globSync } from 'node:fs';
import { jsonLdHtml } from '../lib/jsonLd';

const files = [
  ...globSync('app/**/*.{ts,tsx}'),
  ...globSync('components/**/*.{ts,tsx}'),
  ...globSync('lib/**/*.{ts,tsx}'),
].filter((f) => f !== 'lib/jsonLd.ts');

const RAW = /__html:\s*JSON\.stringify\(/;
const bad: string[] = [];

for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (RAW.test(line)) bad.push(`${f}:${i + 1}`);
  });
}

if (bad.length) {
  console.error(`✗ حقن JSON خام داخل <script> (${bad.length}) — استعمل jsonLdHtml من lib/jsonLd.ts:`);
  for (const b of bad) console.error(`  ${b}`);
  process.exit(1);
}

// تحقّق سلوكيّ: الدالة نفسها لا تُخرج ما يُغلق الوسم، ويبقى الناتج JSON مطابقاً.
const evil = { name: '</script><script>alert(1)</script>', note: 'a & b <!-- \u2028' };
const out = jsonLdHtml(evil);
if (/<\/?script|<!--/i.test(out) || JSON.stringify(JSON.parse(out)) !== JSON.stringify(evil)) {
  console.error('✗ jsonLdHtml لا يهرّب كما يجب:', out);
  process.exit(1);
}

console.log(`✓ JSON-LD مُهرَّب: صفر حقن خام عبر ${files.length} ملفاً`);
