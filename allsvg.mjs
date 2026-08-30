import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900} });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
console.log(await p.evaluate(() => {
  const T = { x: 1276, y: 484, w: 20, h: 20 };
  const hit = [];
  for (const s of document.querySelectorAll("svg")) {
    const r = s.getBoundingClientRect();
    if (r.x < T.x + T.w + 6 && r.x + r.width > T.x - 6 && r.y < T.y + T.h + 6 && r.y + r.height > T.y - 6) {
      hit.push({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
                 d: (s.querySelector("path")?.getAttribute("d")||"").slice(0,30),
                 cls: (s.getAttribute("class")||"").slice(0,55),
                 parent: s.parentElement.tagName + "." + (s.parentElement.getAttribute("class")||"").slice(0,45) });
    }
  }
  return hit;
}));
await b.close();
