/**
 * حارس: لا يجوز أن يفوق عمرُ جلبٍ عمرَ الصفحة التي تُعلن منه `notFound()`.
 *
 * وقعت العلّة مرّتين (مصر ثمّ عُمان، 2026-08): الصفحة تُعاد كل ساعة لكنها تقرأ
 * قائمةً محفوظةً 24 ساعة لا يظهر فيها الكيان الجديد — فتُعلن 404 ويسجّلها جوجل.
 * الـ404 ضررٌ دائم في نتائج البحث، فنمنع الشرط الذي يُنتجه لا العَرَض.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

/**
 * ⚠️ الحارس يشمل `sitemap.ts` أيضاً: العلّة ليست حصراً في `notFound()` — خريطة
 * الموقع تُبنى من جلبٍ كان عمره 86400 داخل صفحة عمرها 3600، فبقيت نتيجةٌ فاشلة
 * محفوظةً يوماً كاملاً وخرجت الخريطة بصفر صفحة دولة. أي ملفٍّ يُصدر
 * `revalidate` ويقرأ من جلبٍ أطول عمراً يقع في المصيدة نفسها.
 */
const files = [
  ...globSync('app/**/page.tsx').filter((f) =>
    readFileSync(f, 'utf8').includes('notFound()'),
  ),
  // يُشترط وجود `fetch`: ملفٌّ ثابت بلا جلب (مثل `robots.ts`) لا يحتاج
  // `revalidate` أصلاً، وإدراجه يُنتج إنذاراً كاذباً.
  ...globSync('app/{sitemap,robots}.ts').filter((f) =>
    readFileSync(f, 'utf8').includes('fetch('),
  ),
];

const bad: string[] = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const pageM = src.match(/^export const revalidate = (\d+)/m);
  if (!pageM) {
    bad.push(`${f}: بلا \`export const revalidate\` — نتيجة محفوظة إلى الأبد`);
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
console.log(`✓ ${files.length} ملفاً (notFound + خريطة/robots) — لا جلب يفوق عمره`);
