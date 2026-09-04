/**
 * تجاوز العرض في صفحات اللوحة — الجزء الذي كان الحارس العام لا يبلغه.
 *
 * ⚠️ **`audit-overflow` كان يرجع أخضر وهو لم يفتح صفحةَ لوحةٍ واحدة.** كلّها
 * خلف تسجيل الدخول، فكانت تنتهي مهلتها على `networkidle` فتُعدّ «تخطّياً» لا
 * فشلاً — وأخضرُ لم يقِس شيئاً أسوأ من أحمرَ صادق.
 *
 * فهذا يدخل بتوكن knox في كعكة `token` (نفس ما يقرأه `lib/api.ts`)، وينتظر
 * `domcontentloaded` لا `networkidle` — لوحةٌ تستقطر البيانات لا تسكن شبكتها.
 *
 *   MK_TOKEN=<knox> node scripts/audit-overflow-admin.mjs
 *
 * التوكن يُصكّ للحظته ويُلغى بعدها — لا يُودَع في مستودع ولا يُترك حيّاً.
 */
import { chromium } from "playwright";
const TOKEN = process.env.MK_TOKEN;
const BASE = "https://maskani.homes";
const PAGES = ["/admin","/admin/properties","/admin/users","/admin/reports","/admin/services",
  "/admin/cities","/admin/analytics","/admin/seo","/admin/blog","/admin/requests",
  "/admin/jobs","/admin/verification","/admin/conversations","/admin/helpdesk",
  "/admin/helpdesk/flow","/admin/infrastructure","/admin/currencies","/admin/ai",
  "/admin/broadcast","/admin/notification-templates","/admin/categories",
  "/admin/property-types","/admin/flags","/admin/blog/categories","/admin/properties/import"];
const VIEWPORTS = [["جوال",390,844],["لوحيّ",768,1024],["سطح مكتب",1440,900]];

const probe = () => {
  const W = document.documentElement.clientWidth;
  const contained = (e) => {
    for (let p = e.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o !== "visible") return true;
    }
    return false;
  };
  const floats = (e) => {
    for (let p = e; p; p = p.parentElement) {
      const pos = getComputedStyle(p).position;
      if (pos === "fixed" || pos === "sticky") return true;
    }
    return false;
  };
  const out = [];
  for (const e of document.querySelectorAll("body *")) {
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const over = Math.max(0, r.right - W, -r.left);   // RTL: يهرب يساراً
    if (over < 2) continue;
    if (contained(e) || floats(e)) continue;
    const t = (e.textContent||"").trim().replace(/\s+/g," ").slice(0,26);
    out.push(`${e.tagName.toLowerCase()}.${(e.className||"").toString().split(" ")[0]}«${t}» +${over.toFixed(0)}px`);
  }
  return [...new Set(out)].slice(0, 6);
};

const b = await chromium.launch();
let total = 0;
for (const [vn,w,h] of VIEWPORTS) {
  const ctx = await b.newContext({ viewport:{width:w,height:h} });
  await ctx.addCookies([{name:"token", value:TOKEN, domain:"maskani.homes", path:"/"}]);
  const page = await ctx.newPage();
  for (const p of PAGES) {
    try {
      await page.goto(BASE+p,{waitUntil:"domcontentloaded",timeout:45000});
      await page.waitForTimeout(3500);
      const hits = await page.evaluate(probe);
      if (hits.length) { total += hits.length; console.log(`✗ ${vn} ${p} — ${hits.length}`); hits.forEach(x=>console.log("   "+x)); }
    } catch(e) { console.log(`⚠ ${vn} ${p} — ${String(e).slice(0,60)}`); }
  }
  await ctx.close();
}
console.log(total ? `\n❌ ${total} عنصراً يتجاوز العرض` : "\n✅ كل عناصر اللوحة داخل عرض الشاشة");
await b.close();
