import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:6 });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const box = await p.locator('form[role="search"] svg').first().boundingBox();
console.log("pin box:", box);
// كل ما يقع في نفس المنطقة
console.log(await p.evaluate((b) => {
  const cx = b.x + b.width/2, cy = b.y + b.height/2;
  return document.elementsFromPoint(cx, cy).slice(0,6).map(e =>
    e.tagName + "." + (e.getAttribute("class")||"").slice(0,50));
}, box));
await p.screenshot({ path:"/tmp/region.png", clip:{ x: box.x-14, y: box.y-14, width: box.width+28, height: box.height+28 } });
await b.close();
