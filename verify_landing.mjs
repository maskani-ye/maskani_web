import { chromium } from "playwright";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = process.argv[2] || "https://maskani.homes";
const b = await chromium.launch({ executablePath: CHROME });

for (const [name, w, h, mobile] of [["desktop",1440,900,false],["mobile",390,844,true]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mobile, deviceScaleFactor:2 });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil:"networkidle", timeout:60000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path:`/tmp/landing-${name}.png` });

  const m = await p.evaluate(() => {
    const de = document.documentElement;
    const h1 = document.querySelector("h1");
    return {
      overflow: de.scrollWidth - de.clientWidth,
      h1: h1?.textContent?.trim(),
      h1px: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : 0,
      markets: [...document.querySelectorAll('a[href^="/"][href$=""]')].filter(a=>/^\/(ye|sa|jo|eg|iq|om)$/.test(a.getAttribute("href"))).map(a=>a.getAttribute("href")),
      words: (document.body.innerText.match(/\S+/g)||[]).length,
      hasAd: !!document.querySelector("ins.adsbygoogle"),
      bg: [...document.images].filter(i=>i.naturalWidth>1000).length,
    };
  });
  console.log(name, JSON.stringify(m, null, 1));
  await ctx.close();
}
// تفاعل: تمرير المؤشّر على سوق يبدّل الخلفية
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto(base, { waitUntil:"networkidle" });
const links = p.locator('a[href="/sa"]');
if (await links.count()) {
  await links.first().hover();
  await p.waitForTimeout(1200);
  await p.screenshot({ path:"/tmp/landing-hover-sa.png" });
  console.log("hover: التقطت لقطة تمرير السعودية");
}
await b.close();
