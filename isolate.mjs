import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:8 });
await p.goto("https://maskani.homes/ye", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const box = await p.evaluate(() => {
  const svg = document.querySelector('form[role="search"] svg');
  // نخفي كل شيء إلا هذه الأيقونة — ما يبقى مرسوماً هو الأيقونة وحدها قطعاً
  document.querySelectorAll("*").forEach(e => { e.style.visibility = "hidden"; });
  let n = svg;
  while (n) { n.style.visibility = "visible"; n = n.parentElement; }
  svg.querySelectorAll("*").forEach(e => e.style.visibility = "visible");
  const r = svg.getBoundingClientRect();
  return { x: r.x - 10, y: r.y - 10, width: r.width + 20, height: r.height + 20 };
});
await p.screenshot({ path: "/tmp/isolated.png", clip: box });
await b.close();
