import { COUNTRIES, LOCAL_UNITS, GLOBAL_UNITS, ALL_UNITS } from "../lib/areaUnits";
let fail = 0;
const check = (ok: boolean, msg: string) => { if (!ok) { fail++; console.log("✗ " + msg); } };
const near = (a: number, b: number, tol = 0.0001) => Math.abs(a - b) <= tol;
const u = (k: string) => ALL_UNITS.find((x) => x.key === k)!;

console.log(`الوحدات: ${ALL_UNITS.length} (محلّية ${LOCAL_UNITS.length} · معياريّة ${GLOBAL_UNITS.length}) · الدول: ${COUNTRIES.length}\n── تدقيق الدول ──`);
for (const c of COUNTRIES) {
  const units = LOCAL_UNITS.filter((x) => x.country === c.code);
  const ok = units.length > 0 || !!c.hint;
  check(ok, `${c.name}: بلا وحدات محلّية وبلا تفسير`);
  console.log(`  ${ok ? "✓" : "✗"} ${c.flag} ${c.name.padEnd(9)} وحدات محلّية: ${String(units.length).padStart(2)}  ${c.hint ? "· شرح ✓" : "· بلا شرح"}`);
}

console.log("\n── سلامة البيانات ──");
const slugs = ALL_UNITS.map((x) => x.slug), keys = ALL_UNITS.map((x) => x.key);
check(new Set(slugs).size === slugs.length, "مسارات مكرّرة: " + slugs.filter((s, i) => slugs.indexOf(s) !== i));
check(new Set(keys).size === keys.length, "مفاتيح مكرّرة");
for (const x of ALL_UNITS) {
  check(x.m2 > 0 && isFinite(x.m2), `${x.name}: قيمة غير صالحة`);
  check(!!x.name && !!x.short && !!x.slug, `${x.name}: حقل ناقص`);
  check(x.country === "*" || COUNTRIES.some((c) => c.code === x.country), `${x.name}: دولة غير معرّفة`);
}
console.log(`  ✓ ${ALL_UNITS.length} وحدة: مسارات ومفاتيح فريدة · قيم موجبة · حقول كاملة · دول معروفة`);

console.log("\n── العلاقات الحسابية ──");
const rel: [string, number, number, number?][] = [
  ["الفدان = 24 قيراط", u("feddan").m2, u("qirat").m2 * 24],
  ["القيراط = 24 سهم", u("qirat").m2, u("sahm").m2 * 24],
  ["الفدان = 576 سهم", u("feddan").m2, u("sahm").m2 * 576],
  ["الفدان ≈ 333.3 قصبة", u("feddan").m2 / u("qasabah_eg").m2, 333.33, 0.05],
  ["القصبة المصرية = 3.55²", u("qasabah_eg").m2, 3.55 ** 2],
  ["الفدان السوداني = المصري", u("feddan_sd").m2, u("feddan").m2],
  ["الدونم العراقي = 100 أولك", u("dunam_iq").m2, u("ulk").m2 * 100],
  ["الدونم العراقي = 2.5 متري", u("dunam_iq").m2, u("dunam_jo").m2 * 2.5],
  ["المعاد = 100 لبنة صنعاني", u("maad_sanaani").m2, u("libnah_sanaani").m2 * 100],
  ["المعاد التهامي = 98 لبنة", u("maad_tihami").m2, u("libnah_sanaani").m2 * 98],
  ["المعاد الجيزاني = 60×60", u("maad_jizani").m2, 3600],
  ["القصبة العشاري = 4.5²", u("qasabah_ashari").m2, 4.5 ** 2],
  ["القصبة الهدوي = 5.4²", u("qasabah_hadawi").m2, 5.4 ** 2],
  ["القصبة الإبي = 7.5²", u("qasabah_ibbi").m2, 7.5 ** 2],
  ["الهكتار = 10 دونم", u("hectare").m2, u("dunam_jo").m2 * 10],
  ["الهكتار = 100 آر", u("hectare").m2, u("are").m2 * 100],
  ["كم² = 100 هكتار", u("km2").m2, u("hectare").m2 * 100],
  ["الياردة² = 9 قدم²", u("sqyd").m2, u("sqft").m2 * 9],
  ["القدم² = 0.3048²", u("sqft").m2, 0.3048 ** 2],
  ["فرق acre عن الفدان", Math.abs(u("acre").m2 - u("feddan").m2), 153.98, 0.01],
];
for (const [name, a, b, tol] of rel) {
  const ok = near(a, b, tol ?? 0.0001);
  check(ok, name);
  console.log(`  ${ok ? "✓" : "✗"} ${name.padEnd(26)} ${a.toFixed(4)}`);
}

console.log("\n── ذهاب وعودة (كل وحدة) ──");
let rt = 0;
for (const x of ALL_UNITS) {
  const m2 = 7.5 * x.m2;
  if (Math.abs(m2 / x.m2 - 7.5) < 1e-9) rt++; else { fail++; console.log("✗ " + x.name); }
}
console.log(`  ✓ ${rt}/${ALL_UNITS.length} وحدة تعود لقيمتها بلا انحراف`);
console.log(fail === 0 ? "\n✅ التدقيق نظيف — صفر خلل" : `\n❌ ${fail} خلل`);
process.exit(fail === 0 ? 0 : 1);
