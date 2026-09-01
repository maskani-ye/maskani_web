import { chromium } from 'playwright';
const TOKEN = process.env.MK_TOKEN;
const PAGES = (process.env.PAGES||'').split(',');
const WIDTHS = [320, 390, 768];
const probe = () => {
  const de=document.documentElement, over=de.scrollWidth-de.clientWidth;
  if (over<=1) return {over:0, culprits:[]};
  const lim=de.clientWidth+1, outside=r=>r.right>lim||r.left<-1, c=[];
  for (const e of document.querySelectorAll('body *')) {
    const r=e.getBoundingClientRect();
    if (r.width===0||!outside(r)) continue;
    if ([...e.children].some(x=>outside(x.getBoundingClientRect()))) continue;
    const cls=(e.className||'').toString().split(' ').slice(0,3).join('.');
    c.push(`${e.tagName.toLowerCase()}${cls?'.'+cls:''} — ${Math.round(Math.max(r.right-lim,-r.left))}px «${(e.textContent||'').trim().slice(0,24)}»`);
  }
  return {over, culprits:[...new Set(c)].slice(0,4)};
};
const b = await chromium.launch();
let bad=0;
for (const w of WIDTHS) {
  const ctx = await b.newContext({ viewport:{width:w,height:800} });
  await ctx.addCookies([{name:'token', value:TOKEN, domain:'maskani.homes', path:'/', secure:true, sameSite:'Strict'}]);
  const p = await ctx.newPage();
  for (const path of PAGES) {
    try {
      await p.goto('https://maskani.homes'+path,{waitUntil:'domcontentloaded',timeout:45000});
      await p.waitForTimeout(4000);
      const {over,culprits} = await p.evaluate(probe);
      if (over>1){bad++;console.log(`\n✗ ${w}px ${path} — فائض ${over}px`);culprits.forEach(x=>console.log('   '+x));}
    } catch(e){ console.log(`⚠️  ${w}px ${path}: ${String(e).slice(0,45)}`); }
  }
  await ctx.close();
}
await b.close();
console.log(bad?`\n❌ ${bad} انزلاقاً`:'\n✅ لا انزلاق');
