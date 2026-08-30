import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900} });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1000);
console.log(await p.evaluate(() => {
  const f = document.querySelector('form[role="search"]');
  return [...f.querySelectorAll("svg")].map(s => {
    const r = s.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
             d: (s.querySelector("path")?.getAttribute("d")||"").slice(0,28),
             parent: s.parentElement.tagName + "." + (s.parentElement.getAttribute("class")||"").slice(0,40) };
  });
}));
await b.close();
