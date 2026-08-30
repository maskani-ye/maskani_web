import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900} });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1500);
const form = p.locator('form[role="search"]').first();
await form.screenshot({ path:"/tmp/searchbar.png" });
console.log(await p.evaluate(() => {
  const f = document.querySelector('form[role="search"]');
  return [...f.querySelectorAll("svg")].map(s => ({
    cls: s.getAttribute("class")?.slice(0,60),
    paths: [...s.querySelectorAll("path,circle,line")].map(x => (x.getAttribute("d")||`circle/${x.getAttribute("r")}`).slice(0,45)),
  }));
}));
await b.close();
