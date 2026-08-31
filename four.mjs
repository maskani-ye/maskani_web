import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const c = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:2 });
await c.addInitScript(() => {
  localStorage.setItem("maskani_selected_country", JSON.stringify({id:1,code:"YE",name_ar:"اليمن"}));
  localStorage.setItem("maskani_selected_city", JSON.stringify({id:"5",name:"إب",country:"YE"}));
});
const p = await c.newPage();
for (const s of ["properties","services","requests","jobs"]) {
  await p.goto(`https://maskani.homes/ye/${s}`, { waitUntil:"networkidle" });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const grid = [...document.querySelectorAll("div")].find(d => getComputedStyle(d).display === "grid" && d.children.length > 1 && getComputedStyle(d).gridTemplateColumns.split(" ").length >= 1 && d.querySelector("a"));
    return {
      h1: document.querySelector("h1")?.textContent?.trim().slice(0,28),
      شريط: !!document.querySelector('input[placeholder*="ابحث"]'),
      كلالفلاتر: [...document.querySelectorAll("button")].some(b=>b.textContent.trim().startsWith("كل الفلاتر")),
      أعمدة: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,
      خريطة: !!document.querySelector("aside .leaflet-container"),
    };
  });
  console.log(s.padEnd(11), JSON.stringify(r, null, 0));
}
await b.close();
