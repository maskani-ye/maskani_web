/**
 * أزرارٌ ينكسر نصّها إلى سطرين — قياسٌ على المرسوم لا تخمين.
 *
 * ⚠️ **الزرّ لا يُقاس بطوله بل بعدد أسطره.** زرٌّ عريض بسطرٍ واحد متّزن، وزرٌّ
 * ضيّق بسطرين مشوّه مهما بلغت أبعاده. فالقياس: ارتفاع المحتوى ÷ ارتفاع السطر.
 * والعلاج ليس تصغير الخطّ — بل ضبط ما **بجانبه**: العمود الذي يحبسه، أو الفجوة،
 * أو جارٌ يأخذ عرضاً أكثر من حاجته.
 */
import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE || "http://localhost:3000";
const PAGES = (process.env.AUDIT_PAGES || [
  "/", "/tools", "/blog", "/reports", "/help", "/about", "/download", "/location",
  "/ye", "/ye/properties", "/ye/services", "/ye/requests", "/ye/jobs",
  "/properties/create", "/sa", "/sa/properties",
].join(",")).split(",");

const probe = () => {
  // ⚠️ **لا يُقاس الكسر بارتفاع الزرّ.** زرٌّ فيه أيقونة 20px بجانب نصٍّ
  // ارتفاع سطره 14px يبدو «سطرين» في حساب الارتفاع، وهو سطرٌ واحد بالعين.
  // القياس الصحيح: `Range` على العقدة النصّية نفسها — نصٌّ مكسور يُنتج
  // مستطيلين، وسطرٌ واحد يُنتج واحداً. لا تخمين.
  const lineCount = (el) => {
    let max = 1;
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      const rects = [...r.getClientRects()].filter((x) => x.width > 1 && x.height > 1);
      // مستطيلات على نفس السطر تُدمج بتقارب الأعلى
      const tops = [...new Set(rects.map((x) => Math.round(x.top)))];
      max = Math.max(max, tops.length);
    }
    return max;
  };
  const out = [];
  for (const el of document.querySelectorAll("button, a[class*='rounded'], [role='button']")) {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 16) continue;
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
    if (!txt || txt.length > 40) continue;
    if (s.flexDirection === "column") continue;      // أيقونة فوق نصّ — بالتصميم
    const lines = lineCount(el);
    if (lines < 2) continue;
    out.push(`${lines} سطر · ${Math.round(r.width)}×${Math.round(r.height)}px · «${txt.slice(0, 30)}»`);
  }
  return [...new Set(out)];
};

const b = await chromium.launch();
let total = 0;
for (const [name, w, h] of [["ضيّق", 320, 780], ["جوال", 390, 844], ["كبير", 430, 932], ["لوحيّ", 768, 1024], ["سطح مكتب", 1440, 900]]) {
  const page = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  for (const p of PAGES) {
    try {
      await page.goto(BASE + p, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(2500);
      const hits = await page.evaluate(probe);
      if (hits.length) {
        total += hits.length;
        console.log(`✗ ${name} ${p} — ${hits.length}`);
        hits.slice(0, 6).forEach((x) => console.log("   " + x));
      }
    } catch { /* صفحة تعذّرت */ }
  }
}
console.log(total ? `\n❌ ${total} زرّاً نصّه أكثر من سطر` : "\n✅ كل زرّ في سطرٍ واحد");
await b.close();
