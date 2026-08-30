import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
for (const [n,w,h,m] of [["desktop",1440,900,false],["mobile",390,844,true]]) {
  const c = await b.newContext({ viewport:{width:w,height:h}, isMobile:m, deviceScaleFactor:2 });
  const p = await c.newPage();
  await p.goto("https://maskani.homes/", { waitUntil:"networkidle" });
  await p.waitForTimeout(3000);
  await p.screenshot({ path:`/tmp/L-${n}.png` });
  console.log(n, await p.evaluate(() => ({
    scrollY: document.documentElement.scrollHeight - window.innerHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    words: (document.body.innerText.match(/\S+/g)||[]).length,
    canvas: !!document.querySelector("canvas"),
    bgVisible: [...document.images].filter(i=>i.naturalWidth>800 && getComputedStyle(i).opacity==="1").length,
  })));
  await c.close();
}
await b.close();
