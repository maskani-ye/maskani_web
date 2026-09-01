/**
 * كاشف التمرير الأفقيّ — الشاشة تتحرّك يميناً ويساراً على الجوّال.
 *
 * ⚠️ **العرض الزائد لا يُرى في التصميم بل يُحسّ في اليد.** عنصرٌ واحد أعرض من
 * الشاشة يجعل **الصفحة كلّها** تنزلق أفقياً، فيتحرّك كل شيء تحت الإصبع ويبدو
 * الموقع مكسوراً. والسبب دائماً عنصرٌ بعينه — لا «التصميم».
 *
 * يقيس `scrollWidth` مقابل عرض الإطار، ثم **يسمّي العناصر المتجاوزة**.
 *
 *   node scripts/audit-overflow.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE || "https://maskani.homes";
const PAGES = (process.env.AUDIT_PAGES || [
  "/", "/ye", "/ye/properties", "/ye/services", "/ye/requests", "/ye/jobs",
  "/properties/17", "/requests/1", "/services/1", "/jobs/1",
  "/blog", "/blog/land-price-calculation", "/tools", "/tools/construction-cost",
  "/tools/area-converter/qirat", "/offices", "/contact", "/help", "/reports",
  "/about", "/privacy", "/terms", "/location", "/properties/city/ibb",
].join(",")).split(",");
/** أضيق شاشة شائعة، ثم الشائعة، ثم اللوح. */
const WIDTHS = [320, 360, 390, 768];

const probe = () => {
  const de = document.documentElement;
  const over = de.scrollWidth - de.clientWidth;
  if (over <= 1) return { over: 0, culprits: [] };
  // ⚠️ **الاتّجاه يقلب جهة الفائض.** الموقع RTL، فالعنصر الأعرض من الشاشة
  // يخرج من **اليسار** بإحداثيّ سالب لا من اليمين. قياسُ الحافّة اليمنى وحدها
  // أعطى «فائض 122px وصفر عنصر متجاوز» — تناقضٌ ظاهر كشف الخطأ في القياس.
  const lim = de.clientWidth + 1;
  const outside = (r) => r.right > lim || r.left < -1;
  const culprits = [];
  for (const e of document.querySelectorAll("body *")) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || !outside(r)) continue;
    // العنصر متجاوز، لكن أباه قد يكون هو المتجاوز الحقيقيّ — نُبلغ عن الأصغر
    // (الأعمق) كي نصل إلى العنصر المسؤول لا إلى الغلاف.
    if ([...e.children].some((c) => outside(c.getBoundingClientRect()))) continue;
    const cls = (e.className || "").toString().replace(/\s+/g, " ").slice(0, 70);
    culprits.push(
      `${e.tagName.toLowerCase()}${cls ? "." + cls.split(" ").slice(0, 3).join(".") : ""}` +
      ` — يتجاوز ${Math.round(Math.max(r.right - lim, -r.left))}px` +
      (e.textContent ? ` «${e.textContent.trim().replace(/\s+/g, " ").slice(0, 26)}»` : ""),
    );
  }
  return { over, culprits: [...new Set(culprits)].slice(0, 5) };
};

const b = await chromium.launch();
let bad = 0;
for (const w of WIDTHS) {
  const page = await b.newPage({ viewport: { width: w, height: 800 } });
  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(900);
      const { over, culprits } = await page.evaluate(probe);
      if (over > 1) {
        bad++;
        console.log(`\n✗ ${w}px ${path} — فائض ${over}px`);
        culprits.forEach((c) => console.log("   " + c));
      }
    } catch (e) { console.log(`⚠️  ${w}px ${path}: ${String(e).slice(0, 50)}`); }
  }
  await page.close();
}
await b.close();
console.log(bad ? `\n❌ ${bad} صفحة تنزلق أفقياً` : "\n✅ لا تمرير أفقيّ في أي عرض");
process.exit(bad ? 1 : 0);
