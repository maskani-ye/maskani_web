import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage();
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
console.log(await p.evaluate(() => {
  const svg = document.querySelector('form[role="search"] svg');
  return { outer: svg.outerHTML.slice(0, 600) };
}));
await b.close();
