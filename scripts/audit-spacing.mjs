/**
 * كاشف التلاصق — عناصر تفاعلية بلا فراغ بينها.
 *
 * ⚠️ **الفراغ ليس تجميلاً بل هدفُ إصبع.** زرّان متلاصقان على الجوّال يعنيان
 * نقرةً خاطئة، والمسافة تحت 8 بكسل تُقرأ عنصراً واحداً ملتصقاً لا عنصرين.
 *
 * الكشف على أزواج **الأشقّاء** المتجاورة فقط: عناصرٌ من أبٍ واحد، متحاذية
 * أفقياً أو عمودياً، والفجوة بينها أقلّ من الحدّ. غير الأشقّاء قد تتجاور
 * بحكم التخطيط بلا أن يكون ذلك خللاً.
 *
 *   node scripts/audit-spacing.mjs [--gap 8]
 */
import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE || "https://maskani.homes";
const MIN_GAP = Number(process.argv.includes("--gap") ? process.argv[process.argv.indexOf("--gap") + 1] : 8);
const PAGES = (process.env.AUDIT_PAGES || [
  "/", "/ye", "/ye/properties", "/ye/services", "/ye/requests", "/ye/jobs",
  "/properties/17", "/requests/1", "/services/1", "/jobs/1",
  "/blog", "/blog/land-price-calculation", "/tools", "/tools/construction-cost",
  "/offices", "/contact", "/help", "/reports", "/about",
].join(",")).split(",");
const VIEWPORTS = [["جوال", 390, 844], ["سطح مكتب", 1440, 900]];

const probe = (minGap) => {
  const sel = 'button, a, input, select, textarea, [role="button"], [role="tab"]';
  const box = (e) => e.getBoundingClientRect();
  const vis = (e) => {
    const r = box(e);
    const s = getComputedStyle(e);
    return r.width > 8 && r.height > 8 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
  };
  const name = (e) => {
    const t = (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 22);
    return `${e.tagName.toLowerCase()}${t ? `«${t}»` : ""}`;
  };
  const out = [];
  const els = [...document.querySelectorAll(sel)].filter(vis);
  const byParent = new Map();
  for (const e of els) {
    const p = e.parentElement;
    if (!p) continue;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(e);
  }
  for (const [, group] of byParent) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = box(group[i]), b = box(group[j]);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        let gap = null, axis = "";
        if (overlapY > 4) { gap = Math.max(a.left, b.left) - Math.min(a.right, b.right); axis = "أفقياً"; }
        else if (overlapX > 4) { gap = Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom); axis = "عمودياً"; }
        if (gap === null || gap < -1) continue;
        // ⚠️ **الفجوة المرئية لا فجوة الصناديق.** رابطٌ بحشوٍ داخليّ صندوقه
        // يلامس جاره بينما نصّه بعيدٌ عنه بمقدار الحشوين — فقياس الصناديق
        // وحده يُنتج بلاغات كاذبة (خرج منها 85 زوجاً كلّها سليمة بالنظر).
        // فالحشو يُضاف إلى الفجوة إلّا حين يكون للعنصر **سطحٌ مرئيّ**
        // (خلفية أو حدّ أو ظلّ): عندئذٍ حافّة الصندوق هي الحافّة المرسومة.
        const painted = (e) => {
          const s = getComputedStyle(e);
          const bg = s.backgroundColor;
          const hasBg = bg && bg !== "transparent" && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(bg);
          const hasBorder = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
          const hasShadow = s.boxShadow && s.boxShadow !== "none";
          return hasBg || hasBorder || hasShadow;
        };
        const inset = (e, sides) => {
          if (painted(e)) return 0;
          const s = getComputedStyle(e);
          return Math.min(...sides.map((k) => parseFloat(s[k]) || 0));
        };
        const pad = axis === "أفقياً"
          ? inset(group[i], ["paddingLeft", "paddingRight"]) + inset(group[j], ["paddingLeft", "paddingRight"])
          : inset(group[i], ["paddingTop", "paddingBottom"]) + inset(group[j], ["paddingTop", "paddingBottom"]);
        const visual = gap + pad;
        if (visual >= minGap) continue;
        out.push(`${name(group[i])} ↔ ${name(group[j])} — ${axis} ${visual.toFixed(1)}px${pad ? ` (صندوق ${gap.toFixed(1)})` : ""}`);
      }
    }
  }
  return [...new Set(out)];
};

const b = await chromium.launch();
let total = 0;
for (const [vn, w, h] of VIEWPORTS) {
  const page = await b.newPage({ viewport: { width: w, height: h } });
  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(1200);
      const hits = await page.evaluate(probe, MIN_GAP);
      if (hits.length) {
        total += hits.length;
        console.log(`\n✗ ${vn} ${path} — ${hits.length}`);
        hits.slice(0, 6).forEach((x) => console.log("   " + x));
      }
    } catch (e) { console.log(`⚠️  ${vn} ${path}: ${String(e).slice(0, 60)}`); }
  }
  await page.close();
}
await b.close();
console.log(total ? `\n❌ ${total} زوجاً متلاصقاً (الحدّ ${MIN_GAP}px)` : `\n✅ لا تلاصق تحت ${MIN_GAP}px`);
process.exit(total ? 1 : 0);
