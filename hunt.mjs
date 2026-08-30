import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:8 });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const box = await p.evaluate(() => {
  const r = document.querySelector('form[role="search"] svg').getBoundingClientRect();
  return { x: r.x - 12, y: r.y - 12, width: r.width + 24, height: r.height + 24 };
});
await p.screenshot({ path:"/tmp/H-all.png", clip: box });
// أخفِ كل الـsvg
await p.evaluate(() => document.querySelectorAll("svg").forEach(s => s.style.visibility = "hidden"));
await p.screenshot({ path:"/tmp/H-nosvg.png", clip: box });
await b.close();
