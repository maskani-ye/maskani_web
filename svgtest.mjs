import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport:{width:400,height:200}, deviceScaleFactor:3 });
await p.setContent(`<body style="margin:0;display:flex;gap:24px;align-items:center;justify-content:center;height:200px;background:#fff">
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" fill="none" viewBox="0 0 24 24" color="#374151">
<path d="M4 10.1433C4 5.64588 7.58172 2 12 2C16.4183 2 20 5.64588 20 10.1433C20 14.6055 17.4467 19.8124 13.4629 21.6744C12.5343 22.1085 11.4657 22.1085 10.5371 21.6744C6.55332 19.8124 4 14.6055 4 10.1433Z" stroke="currentColor" stroke-width="1.5"></path>
<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"></circle></svg>
</body>`);
await p.screenshot({ path:"/tmp/svgraw.png" });
await b.close();
