// جرد عميق: أي حقل قد يستقبل رقماً يجب أن يمرّ عبر toEnglishDigits.
//
// لا يكفي فحص `type="number"`: كثير من الحقول الرقمية تُكتب `type="text"`
// (السعر والمساحة والميزانية) كي لا تظهر أسهم المتصفّح، وبعضها يمرّ عبر
// مكوّنات مغلّفة (Input · MoneyInput · NumberField). فنفحص ثلاثة أدلّة:
//   ① وسم صريح: type=number|tel أو inputMode=numeric|decimal|tel
//   ② اسمٌ يدلّ على رقم: price · area · budget · rooms · phone …
//   ③ تنظيفٌ رقميّ في onChange: replace(/\D/) أو [^0-9]
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const roots = ["app", "components"];
//: مكوّنات تُغطّي التحويل داخلها، فما يمرّ عبرها آمنٌ بلا تكرار.
const SAFE_WRAPPERS = ["<Input", "<MoneyInput", "<NumberField", "<PhoneField", "<CustomCityField"];
const NUMERIC_ATTR = /type="(number|tel)"|inputMode="(numeric|decimal|tel)"/;
const NUMERIC_NAME = /(price|amount|budget|area|rooms|bathrooms|phone|qty|quantity|count|limit|offset|year|rate|percent|salary|floor|age|number|سعر|مساحة|ميزانية|هاتف|عدد)/i;
const NUMERIC_CLEAN = /replace\(\/\[\^0-9|replace\(\/\\D/;

const files: string[] = [];
const walk = (d: string) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p)) files.push(p);
  }
};
roots.forEach(walk);

let flagged = 0, checked = 0, safeByWrapper = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/<(input|textarea)\b[\s\S]{0,1200}?\/>/g)) {
    const b = m[0];
    if (!b.includes("onChange") || b.includes("readOnly") || b.includes("disabled")) continue;
    // استثناءات صريحة: ما لا يستقبل رقماً أصلاً.
    // - حقول الملفات/الاختيار لا نصّ فيها.
    // - `textarea` نصٌّ حرّ (وصف/ملاحظة) إلا إن وُسم رقمياً صراحةً.
    // - حقول البحث نصّية بطبعها؛ يُستثنى ما كان بحثاً برقم هاتف (يُحوَّل).
    if (/type="(file|checkbox|radio|color|date|datetime-local|time|email|password|url)"/.test(b)) continue;
    if (b.startsWith("<textarea") && !NUMERIC_ATTR.test(b)) continue;
    const isNumeric = NUMERIC_ATTR.test(b) || NUMERIC_CLEAN.test(b) ||
      (NUMERIC_NAME.test(b) && !b.includes('type="email"') && !b.includes('type="password"'));
    if (!isNumeric) continue;
    checked++;
    if (b.includes("toEnglishDigits")) continue;
    flagged++;
    const line = src.slice(0, m.index).split("\n").length;
    console.log(`✗ ${f}:${line} — حقل رقميّ بلا تحويل`);
  }
  // المكوّنات المغلّفة: نعدّها للإحصاء فقط (التحويل داخلها)
  for (const w of SAFE_WRAPPERS) {
    safeByWrapper += src.split(w).length - 1;
  }
}
console.log(
  flagged === 0
    ? `✅ ${checked} حقلاً رقمياً مباشراً — كلّها تحوّل · و${safeByWrapper} استدعاءً لمكوّنات مغلّفة تحوّل داخلياً · (${files.length} ملفاً)`
    : `❌ ${flagged} حقلاً بلا تحويل من أصل ${checked}`,
);
process.exit(flagged === 0 ? 0 : 1);
