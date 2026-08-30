import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:4 });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const label = p.locator('form[role="search"] label').first();
await label.screenshot({ path:"/tmp/citysel.png" });
// وحالة التركيز — كما في لقطة المستخدم
await p.locator('form[role="search"] select').first().focus();
await p.waitForTimeout(300);
await label.screenshot({ path:"/tmp/citysel-focus.png" });
await b.close();
