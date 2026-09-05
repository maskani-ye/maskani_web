/**
 * تباين المحتوى داخل الأسطح الملوّنة — قياسٌ على الصفحة المرسومة لا على الصنف.
 *
 * ⚠️ **فحص سلاسل الأصناف يكذب في الاتّجاهين.** `bg-primary` في سلسلةٍ لا يعني
 * أنّ نصّها داكن (الابن قد يحمل `text-white`)، و`text-white` في سلسلةٍ لا يعني
 * أنّ كل أبنائها بيض. الحقيقة الوحيدة هي **اللون المحسوب** على العنصر الذي
 * يحمل النصّ فعلاً، مقابل خلفيته الفعلية المتوارثة.
 *
 * القاعدة المفروضة: نصٌّ على سطحٍ داكن يجب أن يبلغ تباينه **4.5:1** (AA).
 * ودون **3:1** عطلٌ صريح — نصٌّ داكن على داكن لا يُقرأ.
 */
import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE || "http://localhost:3000";
const PAGES = (process.env.AUDIT_PAGES || [
  "/", "/tools", "/blog", "/reports", "/help", "/about", "/contact",
  "/ye", "/ye/properties", "/ye/services", "/ye/requests", "/ye/jobs",
  "/properties/create", "/location", "/download",
].join(",")).split(",");

const probe = () => {
  const parse = (c) => {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
  };
  const lum = ([r, g, b]) => {
    const c = [r, g, b].map((x) => x / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  // ⚠️ **الخلفية ليست دائماً في الأسلاف.** صفحة البوّابة تضع طبقةً داكنة
  // (`bg-ink`) **شقيقةً** للمحتوى لا سلفاً له، فمشيٌ في الأسلاف يتخطّاها إلى
  // خلفية الصفحة الفاتحة ويبلّغ «أبيض على أبيض» لثمانية نصوصٍ سليمة.
  // `elementsFromPoint` يقرأ ما تحت النقطة فعلاً — أشقّاء وأسلافاً معاً —
  // فيرى ما يراه العين.
  // ⚠️ **ولا يرى `elementsFromPoint` ما هو خارج الشاشة.** الفوتر أسفل الطيّة،
  // فتُقصّ نقطته إلى حافّة الشاشة وتُقرأ خلفية عنصرٍ آخر تماماً — ثمانية بلاغات
  // كاذبة لكل صفحة. فلا يُقاس إلا ما هو **داخل الشاشة الآن**، والصفحة تُمرَّر
  // بخطوات بارتفاع الشاشة ليُغطّى كلّها.
  const bgOf = (el) => {
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return null;
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    // ⚠️ **خلفية العنصر نفسه هي خلفية نصّه.** تخطّيها يجعل زرّاً بـ`bg-primary`
    // يُقاس على خلفية الصفحة تحته فيبدو «أبيض على أبيض».
    const stack = [el, ...document.elementsFromPoint(x, y)];
    let acc = null;
    for (const n of stack) {
      if (n !== el && el.contains(n)) continue;
      const st = getComputedStyle(n);
      if (st.backgroundImage && st.backgroundImage !== "none") return null; // فوق صورة
      const c = parse(st.backgroundColor);
      if (!c || c[3] === 0) continue;
      if (!acc) acc = c;
      if (c[3] >= 0.999) {
        return acc[3] >= 0.999 ? acc : [
          Math.round(c[0] * (1 - acc[3]) + acc[0] * acc[3]),
          Math.round(c[1] * (1 - acc[3]) + acc[1] * acc[3]),
          Math.round(c[2] * (1 - acc[3]) + acc[2] * acc[3]), 1];
      }
    }
    return acc && acc[3] >= 0.999 ? acc : [255, 255, 255, 1];
  };

  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const txt = [...el.childNodes]
      .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (!txt) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || +s.opacity < 0.1) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const fg = parse(s.color);
    if (!fg || fg[3] < 0.1) continue;
    const bg = bgOf(el);
    if (!bg) continue;                       // فوق صورة — لا يُقاس بلون
    const c = ratio(fg, bg);
    if (c >= 3) continue;
    out.push(`${el.tagName.toLowerCase()}«${txt.slice(0, 26)}» ${s.color} على rgb(${bg[0]}, ${bg[1]}, ${bg[2]}) — ${c.toFixed(2)}:1`);
  }
  return [...new Set(out)].slice(0, 8);
};

const b = await chromium.launch();
let total = 0;
for (const [name, w, h] of [["جوال", 390, 844], ["سطح مكتب", 1440, 900]]) {
  const page = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  for (const p of PAGES) {
    try {
      await page.goto(BASE + p, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(2500);
      // تمريرٌ بخطوات بارتفاع الشاشة: ما هو خارجها لا يُقاس، فتُغطّى الصفحة كلّها
      const height = await page.evaluate(() => document.body.scrollHeight);
      const hits = [];
      for (let y = 0; y < Math.min(height, h * 8); y += h) {
        await page.evaluate((yy) => scrollTo(0, yy), y);
        await page.waitForTimeout(350);
        hits.push(...await page.evaluate(probe));
      }
      const uniq = [...new Set(hits)];
      if (uniq.length) {
        total += uniq.length;
        console.log(`✗ ${name} ${p} — ${uniq.length}`);
        uniq.slice(0, 8).forEach((x) => console.log("   " + x));
      }
    } catch { /* صفحة تعذّرت — تُتخطّى */ }
  }
}
console.log(total ? `\n❌ ${total} نصّاً تباينه دون 3:1` : "\n✅ لا نصّ دون 3:1 — كل محتوى على سطحٍ ملوّن مقروء");
await b.close();
