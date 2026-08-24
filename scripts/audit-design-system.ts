/**
 * حارس نظام التصميم — يمنع الانحدار الذي أنتج «الشكل البدائي».
 *
 * قياس 2026-08-24 قبل الإصلاح: ظلٌّ بلون علامةٍ ميّتة يتجاور مع ظلّ العلامة
 * الحالية، و93% من النصوص رماديّ Tailwind افتراضيّ بدل كحليّ الهوية، وسُلّم
 * طباعيّ بلا منطقة وسطى، وثمانية أرقام سحرية في صفحةٍ واحدة.
 *
 * لا شيء من ذلك خطأٌ برمجيّ يكشفه المترجم — كلّه انحرافٌ تراكميّ يُقرأ في
 * النهاية كـ«غير مضبوط». فالحارس هنا يقيس الانضباط لا الصحّة.
 *
 * الحدود عتباتٌ **تنازلية**: تُخفَّض كلّما نُظِّف جزء، ولا تُرفع أبداً.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const FILES = globSync("{app,components}/**/*.tsx");

interface Rule {
  name: string;
  /** يُرجع مواضع المخالفة في ملف */
  find: (src: string) => string[];
  /** أقصى عدد مسموح — تنازليّ فقط */
  budget: number;
  why: string;
}

/**
 * العتبات مضبوطة على القياس بعد تنظيف الرئيسية وبطاقة العقار (2026-08-24).
 * الدَّين المتبقّي مركّز في صفحات الإدارة (`app/admin/*`) وصفحات التفاصيل —
 * وهي أقلّ أثراً في الانطباع العام من الرئيسية والبطاقة. تُخفَّض العتبة مع كل
 * تنظيف لاحق، ولا تُرفع.
 */
const RULES: Rule[] = [
  {
    name: "ظلّ بلون العلامة الميّتة (أخضر زيتوني)",
    find: (s) => s.match(/rgba\(\s*45\s*,\s*106\s*,\s*79/g) ?? [],
    budget: 0,
    why: "هوية ما قبل Gathern — ظلال بحرارتين على صفحة واحدة",
  },
  {
    name: "مقاسات نصّ خارج السُلّم",
    // السُلّم: display h1 h2 h3 body-lg body caption price price-sm
    find: (s) =>
      s.match(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/g) ?? [],
    budget: 1084,
    why: "مقاس يُختار بالذوق كل مرّة بدل دورٍ معرّف",
  },
  {
    name: "رمادي Tailwind بدل كحليّ الهوية",
    find: (s) => s.match(/\btext-gray-(700|800|900)\b/g) ?? [],
    budget: 351,
    why: "نصّ العنوان يجب أن يحمل لون العلامة (ink) لا رماديّ القالب",
  },
  {
    name: "أرقام سحرية (مقاسات مكتوبة يدوياً)",
    find: (s) => s.match(/\[(\d+)px\]/g) ?? [],
    budget: 109,
    why: "ثلاثة عروض بطاقات مختلفة في صفحة واحدة = صفوف غير متحاذية",
  },
];

let failed = false;
for (const rule of RULES) {
  let count = 0;
  const worst: Array<[string, number]> = [];
  for (const f of FILES) {
    const n = rule.find(readFileSync(f, "utf8")).length;
    if (n > 0) {
      count += n;
      worst.push([f, n]);
    }
  }
  const ok = count <= rule.budget;
  if (!ok) failed = true;
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${rule.name}: ${count} (السقف ${rule.budget})`);
  if (!ok) {
    console.log(`    السبب: ${rule.why}`);
    worst
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([f, n]) => console.log(`    ${n.toString().padStart(4)} × ${f}`));
  }
}

if (failed) {
  console.error(
    "\n✗ نظام التصميم انحدر. العتبات تنازلية — نظّف بدل أن ترفع السقف.",
  );
  process.exit(1);
}
console.log(`\n✅ نظام التصميم منضبط عبر ${FILES.length} ملفاً`);
