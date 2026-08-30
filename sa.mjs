import { chromium } from "playwright";
const b = await chromium.launch({ executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
// متصفّح يحفظ «الأردن» مسبقاً — بالضبط الحالة التي أبلغ عنها
const c = await b.newContext({ viewport:{width:1400,height:900} });
await c.addInitScript(() => {
  localStorage.setItem("maskani_selected_country", JSON.stringify({ id: 3, code: "JO", name_ar: "الأردن", flag_emoji: "🇯🇴" }));
  localStorage.setItem("maskani_selected_city", JSON.stringify({ id: 999, name: "عمّان" }));
});
const p = await c.newPage();
const calls = [];
p.on("request", r => { const u = r.url(); if (u.includes("/api/v1/properties")) calls.push(u.split("/api/v1")[1] || u); });
await p.goto("https://maskani.homes/sa/properties", { waitUntil:"networkidle" });
await p.waitForTimeout(2500);
console.log("العنوان:", await p.title());
console.log("نداءات العقارات:");
calls.slice(0,4).forEach(u => console.log("   ", String(u).slice(0,120)));
console.log("مبدّل الدولة يعرض:", await p.locator('button[aria-label="تغيير الدولة"] span').nth(1).textContent().catch(()=>"?"));
await b.close();
