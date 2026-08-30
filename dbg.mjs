import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1440,height:900} });
const failed = [];
p.on("requestfailed", r => failed.push(r.url().slice(0,90)));
await p.goto("https://maskani.homes/", { waitUntil:"networkidle" });
console.log(await p.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  return {
    imgCount: imgs.length,
    details: imgs.slice(0,3).map(i => ({
      src: (i.currentSrc||i.src).slice(-60),
      w: i.naturalWidth, h: i.naturalHeight,
      opacity: getComputedStyle(i).opacity,
      cls: i.className.slice(0,60),
      parentZ: getComputedStyle(i.parentElement).zIndex,
    })),
  };
}));
if (failed.length) console.log("فشل تحميل:", failed);
await b.close();
