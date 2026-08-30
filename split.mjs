import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1600,height:1000}, deviceScaleFactor:2 });
for (const [name, url] of [["default","https://maskani.homes/ye/properties"],["map","https://maskani.homes/ye/properties?view=map"]]) {
  await p.goto(url, { waitUntil:"networkidle" });
  await p.waitForTimeout(3000);
  console.log(name, await p.evaluate(() => ({
    وضع: [...document.querySelectorAll("button")].filter(b=>/قائمة|خريطة/.test(b.textContent)).map(b=>
      b.textContent.trim()+(b.className.includes("bg-primary")?" ✅":"")).join(" | "),
    خريطةبجانبالقائمة: !!document.querySelector("aside .leaflet-container"),
    بطاقات: document.querySelectorAll('a[href*="/properties/"]').length,
  })));
  if (name==="default") await p.screenshot({ path:"/tmp/SPLIT.png" });
}
await b.close();
