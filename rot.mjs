import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const c = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
const p = await c.newPage();
await p.goto("https://maskani.homes/", { waitUntil:"networkidle" });
const shown = async () => p.evaluate(() =>
  [...document.images].filter(i => getComputedStyle(i).opacity === "1")
    .map(i => decodeURIComponent(i.currentSrc).match(/countries\/([a-z]{2})/)?.[1]).filter(Boolean));
console.log("t=0s   ", await shown());
await p.waitForTimeout(7000);  console.log("t=7s   ", await shown());
await p.screenshot({ path:"/tmp/rot2.png" });
await p.waitForTimeout(6500);  console.log("t=13.5s", await shown());
// تمرير المؤشّر على السعودية
await p.locator('a[href="/sa"]').first().hover();
await p.waitForTimeout(1600);
console.log("hover sa", await shown());
await p.screenshot({ path:"/tmp/rot-hover.png" });
await b.close();
