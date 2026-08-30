import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const c = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
const p = await c.newPage();
await p.goto("https://maskani.homes/", { waitUntil:"networkidle" });
console.log("عدد صور الخلفية:", await p.locator("img").count());
console.log("حالة التحميل:", await p.evaluate(() => [...document.images].map(i => ({
  m: decodeURIComponent(i.currentSrc||"").match(/countries\/([a-z]{2})/)?.[1] || "?",
  complete: i.complete, w: i.naturalWidth, loading: i.loading,
}))));
// وسّع «أسواق أخرى»
const more = p.locator('button:has-text("أسواق أخرى")');
if (await more.count()) { await more.click(); await p.waitForTimeout(400); }
const om = p.locator('a[href="/om"]');
console.log("رابط عُمان موجود:", await om.count());
if (await om.count()) {
  await om.first().hover();
  await p.waitForTimeout(2000);
  console.log("الظاهر بعد التمرير على عُمان:", await p.evaluate(() =>
    [...document.images].filter(i => getComputedStyle(i).opacity === "1")
      .map(i => decodeURIComponent(i.currentSrc).match(/countries\/([a-z]{2})/)?.[1])));
  await p.screenshot({ path:"/tmp/om.png" });
}
await b.close();
