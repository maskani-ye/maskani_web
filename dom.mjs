import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const c = await b.newContext({ viewport:{width:1440,height:900} });
const p = await c.newPage();
await p.goto("https://maskani.homes/", { waitUntil:"networkidle" });
await p.waitForTimeout(2500);
const shot = (await p.screenshot()).toString("base64");

const res = await p.evaluate(async (b64) => {
  const img = new Image();
  await new Promise(r => { img.onload = r; img.src = "data:image/png;base64," + b64; });
  const cv = document.createElement("canvas");
  cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const hist = new Map();
  // تكميم إلى مكعّبات ١٦ لتجميع التدرّجات المتقاربة
  for (let i = 0; i < d.length; i += 4) {
    const k = `${d[i] >> 4},${d[i+1] >> 4},${d[i+2] >> 4}`;
    hist.set(k, (hist.get(k) || 0) + 1);
  }
  const total = d.length / 4;
  const top = [...hist.entries()].sort((a, z) => z[1] - a[1]).slice(0, 6);
  // المتوسّط الدقيق داخل المكعّب الأكثر تكراراً
  const [bk] = top[0][0].split(",").map(Number).length ? [top[0][0]] : [];
  let sr = 0, sg = 0, sb = 0, n = 0;
  const [R, G, B] = top[0][0].split(",").map(Number);
  for (let i = 0; i < d.length; i += 4) {
    if ((d[i] >> 4) === R && (d[i+1] >> 4) === G && (d[i+2] >> 4) === B) {
      sr += d[i]; sg += d[i+1]; sb += d[i+2]; n++;
    }
  }
  const hex = (x) => Math.round(x).toString(16).padStart(2, "0");
  return {
    dominant: `#${hex(sr/n)}${hex(sg/n)}${hex(sb/n)}`,
    share: (top[0][1] / total * 100).toFixed(1) + "%",
    top: top.map(([k, v]) => {
      const [r, g, bb] = k.split(",").map(Number);
      return `#${hex(r*16+8)}${hex(g*16+8)}${hex(bb*16+8)} ${(v/total*100).toFixed(1)}%`;
    }),
  };
}, shot);
console.log(JSON.stringify(res, null, 1));
await b.close();
