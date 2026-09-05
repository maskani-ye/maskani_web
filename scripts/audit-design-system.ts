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
    budget: 0,
    why: "مقاس يُختار بالذوق كل مرّة بدل دورٍ معرّف",
  },
  {
    name: "رماديّ Tailwind بدل رمادي الهوية (muted/ink)",
    find: (s) => s.match(/\bgray-[0-9]{2,3}\b/g) ?? [],
    budget: 0,
    why: "نصّ العنوان يجب أن يحمل لون العلامة (ink) لا رماديّ القالب",
  },
  {
    name: "تنسيق أرقام بلغة مكتوبة يدوياً",
    // كل رقم يمرّ عبر NUMERIC_LOCALE من lib/utils — لا سلسلة لغة حرفية.
    find: (s) => s.match(/toLocaleString\(\s*"ar[^"]*"/g) ?? [],
    budget: 0,
    why: 'toLocaleString("ar") يعطي أرقاماً غربية في Node وهندية في Chrome — عدم تطابق ترطيب',
  },
  {
    // ⚠️ **٣٩١ استعمالاً للوحة Tailwind الخام** (أحمر وأخضر وكهرماني وأزرق)
    // في ٦٦ ملفّاً، بجانب رموزٍ دلالية معرَّفة لها. فالخطأ يظهر أحمر بأربع
    // درجات مختلفة، والنجاح أخضرَين مختلفين — والحالة الواحدة يجب أن تُعرَف
    // بلونها لا أن تُخمَّن. `danger` و`success` و`warning` و`info` هي المرجع.
    name: "لوحة Tailwind الخام بدل الرموز الدلالية",
    find: (s) =>
      s.match(
        /\b[a-z-]+-(red|rose|pink|green|emerald|lime|teal|amber|yellow|orange|blue|sky|indigo|cyan|slate|zinc|neutral|stone|purple|violet|fuchsia)-[0-9]{2,3}\b/g,
      ) ?? [],
    budget: 0,
    why: "أربع درجات حمراء للخطأ الواحد — الحالة تُخمَّن لا تُعرَف",
  },
  {
    // ⚠️ درجة الشارات كانت مكتوبة باليد ٦٢ مرّة بثلاث قيم (11 و10 و9 بكسل)
    // لدورٍ واحد. والعربية عند تسعة بكسل لا تُقرأ. `text-micro` هو الدور.
    name: "مقاس نصّ مكتوب باليد",
    find: (s) => s.match(/\btext-\[\d+px\]/g) ?? [],
    budget: 0,
    why: "ثلاث قيم لدورٍ واحد، وأصغرها دون حدّ القراءة",
  },
  {
    // ⚠️ `shadow-card` و`shadow-card-hover` مرادفان لـ`e2`/`e3` بالقيمة نفسها —
    // اسمان لارتفاعٍ واحد يعنيان سُلَّمين متوازيين، فيُختار الظلّ بالاسم لا
    // بالمرتبة. السُلَّم `e1..e5` هو المرجع الوحيد.
    name: "ظلّ خارج سُلَّم الارتفاع",
    find: (s) => s.match(/\bshadow-card(-hover)?\b/g) ?? [],
    budget: 0,
    why: "اسمان لظلٍّ واحد = سُلَّمان متوازيان، فيُختار الارتفاع بالذوق",
  },
  {
    name: "أرقام سحرية (مقاسات مكتوبة يدوياً)",
    find: (s) => s.match(/\[(\d+)px\]/g) ?? [],
    budget: 26,
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
