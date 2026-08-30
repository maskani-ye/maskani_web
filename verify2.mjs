import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
// ① الأيقونة بعد إلغاء خلفية القوائم
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const box = await p.evaluate(() => {
  const r = document.querySelector('form[role="search"] svg').getBoundingClientRect();
  return { x: r.x-12, y: r.y-12, width: r.width+24, height: r.height+24 };
});
await p.screenshot({ path:"/tmp/V-icon.png", clip: box });
console.log("خلفية القائمة:", await p.evaluate(() =>
  getComputedStyle(document.querySelector('form[role="search"] select')).backgroundImage));
// ② العقارات: عمودان
await p.goto("https://maskani.homes/ye/properties", { waitUntil:"networkidle" });
await p.waitForTimeout(3000);
await p.screenshot({ path:"/tmp/V-props.png" });
console.log("خريطة بجانب القائمة:", await p.evaluate(() => !!document.querySelector("aside .leaflet-container, aside canvas, aside iframe, aside > div")));
await b.close();
