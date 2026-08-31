import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const c = await b.newContext({ viewport:{width:1500,height:900}, deviceScaleFactor:2 });
await c.addInitScript(() => {
  localStorage.setItem("maskani_selected_country", JSON.stringify({id:1,code:"YE",name_ar:"اليمن"}));
  localStorage.setItem("maskani_selected_city", JSON.stringify({id:"5",name:"إب",country:"YE"}));
});
const p = await c.newPage();
await p.goto("https://maskani.homes/ye/services", { waitUntil:"domcontentloaded", timeout:60000 });
await p.waitForTimeout(3500);
const f = p.locator("footer");
await f.scrollIntoViewIfNeeded();
await p.waitForTimeout(800);
await f.screenshot({ path:"/tmp/FOOTER.png" });
console.log(await p.evaluate(() => {
  const t = document.querySelector("footer").innerText;
  return {
    آلافالعقارات: t.includes("آلاف العقارات"),
    موثوقةوآمنة: t.includes("موثوقة وآمنة"),
    واتساب: t.includes("واتساب"),
    أسواق: (t.match(/اليمن|السعودية|الأردن|مصر|العراق|عُمان/g) || []).length,
  };
}));
await b.close();
