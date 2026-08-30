import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
for (const [n,w,h] of [["desk",1600,1000],["mob",390,844]]) {
  const c = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:2, isMobile:n==="mob" });
  await c.addInitScript(() => {
    localStorage.setItem("maskani_selected_country", JSON.stringify({id:1,code:"YE",name_ar:"اليمن"}));
    localStorage.setItem("maskani_selected_city", JSON.stringify({id:"5",name:"إب",country:"YE"}));
  });
  const p = await c.newPage();
  await p.goto("https://maskani.homes/ye/properties", { waitUntil:"networkidle" });
  await p.waitForTimeout(3500);
  await p.screenshot({ path:`/tmp/R-${n}.png` });
  await c.close();
}
await b.close();
