import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const c = await b.newContext({ viewport:{width:1600,height:900} });
await c.addInitScript(() => localStorage.setItem("maskani_selected_country", JSON.stringify({id:1,code:"YE",name_ar:"اليمن"})));
const p = await c.newPage();
for (const u of ["/ye/jobs","/ye/requests","/ye/properties"]) {
  await p.goto("https://maskani.homes"+u, { waitUntil:"domcontentloaded", timeout:60000 });
  await p.waitForTimeout(3000);
  console.log(u.padEnd(16), await p.evaluate(() => {
    const nav = document.querySelector("header nav") || document.querySelector("nav");
    const active = [...(nav?.querySelectorAll("a") ?? [])].filter(a => /bg-primary|text-primary|bg-ink|font-bold/.test(a.className)).map(a => a.textContent.trim());
    const header = document.querySelector("header > div");
    const order = [...document.querySelectorAll('button[aria-label]')].map(b => b.getAttribute("aria-label")).filter(l => /الدولة|المدينة/.test(l));
    return { معلَّم: active, ترتيب: order, عرضالشريط: header ? Math.round(header.getBoundingClientRect().width) : 0 };
  }));
}
await b.close();
