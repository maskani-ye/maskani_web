import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:6 });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const svg = p.locator('form[role="search"] svg').first();
console.log("box:", await svg.boundingBox());
console.log("styles:", await svg.evaluate(el => {
  const c = getComputedStyle(el);
  return { w: c.width, h: c.height, transform: c.transform, overflow: c.overflow, strokeWidth: c.strokeWidth };
}));
await svg.screenshot({ path:"/tmp/icon-only.png" });
await b.close();
