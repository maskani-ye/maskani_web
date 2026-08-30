import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const c = await b.newContext({ viewport:{width:1400,height:900}, deviceScaleFactor:2 });
const p = await c.newPage();
for (const [name, url] of [["landing","https://maskani.homes/"],["ye","https://maskani.homes/ye"]]) {
  await p.goto(url, { waitUntil:"networkidle" });
  await p.waitForTimeout(2200);
  await p.screenshot({ path:`/tmp/P-${name}.png` });
  console.log(name, await p.evaluate(() => ({
    hero: [...document.images].filter(i=>getComputedStyle(i).opacity==="1" && i.naturalWidth>800)
      .map(i=>decodeURIComponent(i.currentSrc).match(/countries\/([a-z]{2})|cities\//)?.[0]).slice(0,2),
    countryFilterInSearch: !!document.querySelector('form[role="search"] select option[value="EG"]'),
  })));
}
await b.close();
