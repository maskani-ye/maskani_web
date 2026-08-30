/**
 * حارس صفحات الأسواق — يفحص **الموقع الحيّ** بعد النشر.
 *
 * ⚠️ **سبب وجوده**: نشرةٌ خرجت و**عشرون صفحة سوق من أربع وعشرين تُرجع 404**،
 * ولم يكشفها البناء ولا المترجم ولا حارسٌ ساكن — لأن السبب كان جلبةً متعثّرة
 * وقت البناء خُبزت في صفحات ساكنة. العطل من هذا النوع لا يُرى إلا بطلب حقيقي.
 *
 * التشغيل بعد كل نشر يمسّ الأسواق:
 *     npx tsx scripts/audit-market-pages.ts [https://maskani.homes]
 */
const BASE = process.argv[2] || "https://maskani.homes";
const MARKETS = ["ye", "sa", "jo", "eg", "iq", "om"];
const SECTIONS = ["properties", "services", "requests", "jobs"];

const bad: string[] = [];

for (const m of MARKETS) {
  // واجهة السوق
  const home = await fetch(`${BASE}/${m}`);
  const homeHtml = await home.text();
  if (!home.ok || !/<title>[^<]*مسكني/.test(homeHtml)) bad.push(`/${m} — ${home.status}`);

  for (const s of SECTIONS) {
    const res = await fetch(`${BASE}/${m}/${s}`);
    const html = await res.text();
    // الصفحة الصحيحة تحمل عنواناً فيه «في <اسم الدولة>»؛ صفحة 404 لا تحمله.
    const ok = res.ok && /<title>[^<]*في [^<|]+\|/.test(html);
    if (!ok) bad.push(`/${m}/${s} — ${res.status}${res.ok ? " (عنوان صفحة غير موجودة)" : ""}`);
  }
}

if (bad.length) {
  console.error(`✗ ${bad.length} صفحة سوق معطوبة من ${MARKETS.length * (SECTIONS.length + 1)}:`);
  bad.forEach((b) => console.error("   " + b));
  process.exit(1);
}
console.log(`✓ ${MARKETS.length * (SECTIONS.length + 1)} صفحة سوق تعمل`);
