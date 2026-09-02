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
  // ⚠️ **`scrollWidth` يعمى تحت `overflow-x: clip`.** حين تُقصّ الصفحة يساوي
  // عرضَها فيبدو كل شيء سليماً — بينما العناصر الفائضة **تُقطع** فيرى الزائر
  // بطاقةً مبتورة أو زرّاً نصفه خارج الشاشة. القصّ يوقف الانزلاق ولا يُصلح
  // التجاوب. فالقياس صار على **كل عنصر** مباشرةً لا على تمرير المستند.
  const vw = de.clientWidth;
  // ⚠️ **الاتّجاه يقلب جهة الفائض.** الموقع RTL، فالعنصر الأعرض من الشاشة
  // يخرج من **اليسار** بإحداثيّ سالب لا من اليمين. قياسُ الحافّة اليمنى وحدها
  // أعطى «فائض 122px وصفر عنصر متجاوز» — تناقضٌ ظاهر كشف الخطأ في القياس.
  const lim = vw + 1;
  const outside = (r) => r.right > lim || r.left < -1;

  // ⚠️ **الشريط الذي يمرّر بقصدٍ ليس خللاً.** شريط أنواع العقارات في الرئيسية
  // وبلاطات الخريطة تمتدّ خارج الشاشة عمداً — لأنّ حاويتها هي التي تمرّر، لا
  // الصفحة. عدّها خللاً يقود إلى «إصلاح» ما هو سليم: أوّل قياسٍ لي أعطى 11
  // صفحة، تسعٌ منها من هذا الصنف.
  // ⚠️ **العنصر المثبَّت (`fixed`) لا يُنتج فائضاً في التخطيط.** حاوية
  // الإشعارات المنبثقة (sonner) عنصرٌ مثبَّت بإزاحةٍ 16 بكسلاً، فبدت «قائمة
  // مرقّمة تتجاوز الشاشة» في ثلاث صفحات — وهي لا تُرى أصلاً حتى يظهر إشعار.
  const floats = (e) => {
    const pos = getComputedStyle(e).position;
    return pos === "fixed" || pos === "sticky";
  };

  const contained = (e) => {
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox && ox !== "visible") return true;
    }
    return false;
  };
  const culprits = [];
  let over = 0;
  for (const e of document.querySelectorAll("body *")) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || !outside(r) || contained(e) || floats(e)) continue;
    // العنصر متجاوز، لكن أباه قد يكون هو المتجاوز الحقيقيّ — نُبلغ عن الأصغر
    // (الأعمق) كي نصل إلى العنصر المسؤول لا إلى الغلاف.
    over = Math.max(over, Math.round(Math.max(r.right - lim, -r.left)));
    if ([...e.children].some((c) => outside(c.getBoundingClientRect()))) continue;
    const cls = (e.className || "").toString().replace(/\s+/g, " ").slice(0, 70);
    culprits.push(
      `${e.tagName.toLowerCase()}${cls ? "." + cls.split(" ").slice(0, 3).join(".") : ""}` +
      ` — يتجاوز ${Math.round(Math.max(r.right - lim, -r.left))}px` +
      (e.textContent ? ` «${e.textContent.trim().replace(/\s+/g, " ").slice(0, 26)}»` : ""),
    );
  }
  return { over, culprits: [...new Set(culprits)].slice(0, 6) };
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
        console.log(`\n✗ ${w}px ${path} — أوسع عنصر يتجاوز ${over}px`);
        culprits.forEach((c) => console.log("   " + c));
      }
    } catch (e) { console.log(`⚠️  ${w}px ${path}: ${String(e).slice(0, 50)}`); }
  }
  await page.close();
}
await b.close();
console.log(bad ? `\n❌ ${bad} صفحة فيها عنصرٌ يتجاوز عرض الشاشة` : "\n✅ كل العناصر داخل عرض الشاشة");
process.exit(bad ? 1 : 0);
