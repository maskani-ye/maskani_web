/**
 * حارس: لا يجوز أن يفوق عمرُ جلبٍ عمرَ الصفحة التي تُعلن منه `notFound()`.
 *
 * وقعت العلّة مرّتين (مصر ثمّ عُمان، 2026-08): الصفحة تُعاد كل ساعة لكنها تقرأ
 * قائمةً محفوظةً 24 ساعة لا يظهر فيها الكيان الجديد — فتُعلن 404 ويسجّلها جوجل.
 * الـ404 ضررٌ دائم في نتائج البحث، فنمنع الشرط الذي يُنتجه لا العَرَض.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('app/**/page.tsx').filter((f) =>
  readFileSync(f, 'utf8').includes('notFound()'),
);

const bad: string[] = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const pageM = src.match(/^export const revalidate = (\d+)/m);
  if (!pageM) {
    bad.push(`${f}: يستدعي notFound() بلا \`export const revalidate\` — 404 دائم`);
    continue;
  }
  const page = Number(pageM[1]);
  for (const m of src.matchAll(/revalidate:\s*(\d+)/g)) {
    if (Number(m[1]) > page) {
      bad.push(`${f}: جلبٌ بعمر ${m[1]} يفوق عمر الصفحة ${page}`);
    }
  }
}

if (bad.length) {
  console.error('✗ تخزينٌ يُنتج 404 زائفاً:\n' + bad.map((b) => '  ' + b).join('\n'));
  process.exit(1);
}
console.log(`✓ ${files.length} صفحة تستدعي notFound() — لا جلب يفوق عمرها`);
