import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1600,height:1000}, deviceScaleFactor:2 });
await p.goto("https://maskani.homes/ye/properties", { waitUntil:"networkidle" });
await p.waitForTimeout(3500);
console.log(await p.evaluate(() => ({
  أزرارالعرض: [...document.querySelectorAll("button")].filter(b=>/^(قائمة|خريطة|قائمة وخريطة)$/.test(b.textContent.trim())).length,
  خريطةجانبية: !!document.querySelector("aside.hidden.lg\\:block .leaflet-container"),
  علاماتسعر: document.querySelectorAll(".maskani-price-marker").length,
  ترقيمصفحي: !!document.body.innerText.match(/صفحة \S+ من/),
})));
await p.screenshot({ path:"/tmp/FINAL.png" });
await b.close();
