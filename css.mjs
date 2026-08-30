import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900} });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1000);
console.log(await p.evaluate(() => {
  const svg = document.querySelector('form[role="search"] svg');
  const path = svg.querySelector("path");
  const cs = getComputedStyle(path);
  const svgCs = getComputedStyle(svg);
  return {
    pathStroke: cs.strokeWidth, linejoin: cs.strokeLinejoin, miter: cs.strokeMiterlimit,
    dasharray: cs.strokeDasharray, transform: cs.transform, fill: cs.fill,
    svgOverflow: svgCs.overflow, svgTransform: svgCs.transform,
    childCount: svg.children.length,
    kids: [...svg.children].map(k => k.tagName),
  };
}));
await b.close();
