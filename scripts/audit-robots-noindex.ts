/**
 * حارس: لا مسارَ محظورٍ في robots.txt يُربَط إليه من صفحة عامّة، ولا صفحةَ
 * خاصّةٍ بلا `noindex`.
 *
 * ⚠️ العطل الذي أوجبه (2026-09-17): كانت أحد عشر مساراً محظورة في `robots.ts`،
 * وصفحاتنا العامّة تربط إليها (عشرة روابط إلى `/properties/create`، أربعة عشر
 * إلى `/chat`). جوجل يصل من الرابط، ولا يقرأ الصفحة، فيفهرس العنوان بلا محتوى:
 * «تمت فهرسة الصفحة رغم حظرها بواسطة robots.txt». والمنع يمنع قراءة `noindex`
 * نفسه، فلا مخرج من الفهرس.
 *
 * القاعدتان:
 *   ١) ما حُظر في robots.txt يجب ألّا يُربَط إليه من صفحة عامّة.
 *   ٢) ما لا نريد فهرسته يُترك للزحف ويُعلن `noindex` (في page أو layout).
 */
import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';

const robotsSrc = readFileSync('app/robots.ts', 'utf8');
const blocked = [...robotsSrc.matchAll(/^\s*"(\/[^"]*)",/gm)].map((m) => m[1]);

/** مسارات خاصّة يجب أن تُعلن `noindex` صراحةً (تُزحف ولا تُفهرس). */
const PRIVATE_ROUTES = [
  'properties/create', 'requests/create', 'jobs/create', 'reports/create',
  'services/my', 'favorites', 'notifications', 'profile', 'chat', 'location',
];

const bad: string[] = [];

// ١) هل يُربَط إلى محظور من صفحة عامّة؟
//
// ⚠️ **الروابط وحدها لا كل ذكرٍ للمسار.** النسخة الأولى من الحارس رصدت
// `pathname.startsWith("/admin")` (فحص مسار لا رابط) وسطرَ الإعلان في
// `robots.ts` نفسه، فأنذرت على ما لا يراه زاحف. المقياس: `href=` أو
// `router.push(` أو `redirect(` — أي ما يُنتج رابطاً يمشي خلفه جوجل.
//
// وواجهة الإدارة مستثناة: صفحاتها نفسها محظورة وخلف تسجيل دخول، فلا يصلها
// زاحف. وما يُعرَض للمشرفين وحدهم داخل مكوّن عامّ يُعلَّم بـ`robots-ok` في
// السطر نفسه مع سببه — استثناءٌ مكتوبٌ يُقرأ، لا صمتٌ في الحارس.
const publicFiles = [
  ...globSync('app/**/*.tsx'),
  ...globSync('components/**/*.tsx'),
].filter((f) => !f.startsWith('app/admin/') && !f.startsWith('components/admin/'));

for (const path of blocked) {
  const linkers: string[] = [];
  for (const f of publicFiles) {
    if (f.startsWith(`app${path}`)) continue;               // الصفحة نفسها
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (line.includes('robots-ok')) continue;             // استثناءٌ مُبرَّر في مكانه
      const link = new RegExp(`(href=|router\\.push\\(|redirect\\()\\s*["'\`]${path}(["'\`/?])`);
      if (link.test(line)) { linkers.push(f); break; }
    }
  }
  if (linkers.length) {
    bad.push(`${path}: محظورٌ في robots.txt ويُربَط إليه من ${linkers.length} ملفاً (${linkers[0]}…)`);
  }
}

// ٢) هل تُعلن كل صفحة خاصّة noindex؟
let declared = 0;
for (const route of PRIVATE_ROUTES) {
  const files = [`app/${route}/page.tsx`, `app/${route}/layout.tsx`].filter(existsSync);
  if (!files.length) continue;
  const ok = files.some((f) => /index:\s*false/.test(readFileSync(f, 'utf8')));
  if (ok) declared += 1;
  else bad.push(`${route}: صفحة خاصّة بلا \`robots: { index: false }\` في page أو layout`);
}

// ضابط: لو لم يجد الحارس أيّ إعلان فهو معطوب لا الكود سليم.
if (declared === 0) {
  console.error('✗ الحارس معطوب: لم يجد أيّ إعلان `noindex` — تحقّق من الأنماط.');
  process.exit(1);
}

if (bad.length) {
  console.error('✗ تعارض بين الحظر والفهرسة:\n' + bad.map((b) => '  ' + b).join('\n'));
  console.error('  القاعدة: ما يُربَط إليه لا يُحظر — يُترك للزحف ويُعلن noindex.');
  process.exit(1);
}
console.log(`✓ robots ↔ noindex متّسقان (محظور: ${blocked.join(' ') || 'لا شيء'} · خاصّة معلنة: ${declared})`);
