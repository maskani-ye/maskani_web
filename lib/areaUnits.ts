// وحدات قياس المساحة في العالم العربيّ — مصدر واحد لكل الأرقام والاشتقاقات.
//
// المبدأ الذي يحكم هذا الملف: **الوحدة الواحدة ليست واحدة**. «القصبة» في تعز
// غيرها في إب، و«اللبنة» في صنعاء غيرها في ذمار، و«الدونم» في بغداد ضعفا
// نظيره في عمّان ونصف. فكل اشتقاق يُعامَل وحدةً مستقلّة باسمها ورقمها ومنطقتها،
// لا خياراً يدويّاً يُترك للمستخدم أن يخمّنه.
//
// `basis` يقول للقارئ من أين جاء الرقم، وهو أصدق من وسمٍ ثنائيّ «دقيق/تقديريّ»:
//   official   — قيمة رسمية أو معياريّة بالتعريف (لا تختلف: المتر، الهكتار، الفدان المصريّ).
//   documented — قيمة إقليمية موثّقة ومنشورة ومتّفق عليها عملياً (اشتقاقات اليمن والعراق).
//   local      — عرفية تتغيّر من قرية لأخرى؛ تُستعمل استئناساً ويُسأل عنها المسّاح.

export type Basis = "official" | "documented" | "local";

export interface AreaUnit {
  key: string;
  slug: string;          // مسار صفحة الوحدة (SEO)
  name: string;          // الاسم الكامل كما يُنطق محلّياً
  short: string;         // اسم مختصر للجداول
  m2: number;
  basis: Basis;
  country: string;       // رمز الدولة صاحبة الاشتقاق ("*" للمعياريّة)
  region?: string;       // المنطقة داخل الدولة
  note?: string;
  aliases?: string[];    // تسميات أخرى يبحث بها الناس
}

const FEDDAN = 4200 + 5 / 6;   // التعريف الرسميّ: 4200.8333… م²
const QIRAT = FEDDAN / 24;     // 175.0347… م²
const SAHM = QIRAT / 24;       // 7.2931… م²
const LIBNAH_SANAANI = 44.44;  // أساسٌ تُشتقّ منه وحدات يمنية أخرى

/** وحدات معياريّة دولية — تُعرض مع كل دولة. */
export const GLOBAL_UNITS: AreaUnit[] = [
  { key: "m2", slug: "meter-murabba", name: "متر مربّع", short: "م²", m2: 1, basis: "official", country: "*" },
  { key: "km2", slug: "kilometer-murabba", name: "كيلومتر مربّع", short: "كم²", m2: 1_000_000, basis: "official", country: "*" },
  { key: "hectare", slug: "hectare", name: "هكتار", short: "هكتار", m2: 10_000, basis: "official", country: "*", note: "100 × 100 متراً", aliases: ["هكتار كم متر"] },
  { key: "are", slug: "are", name: "آر", short: "آر", m2: 100, basis: "official", country: "*", note: "1/100 هكتار" },
  { key: "sqft", slug: "qadam-murabba", name: "قدم مربّع", short: "قدم²", m2: 0.09290304, basis: "official", country: "*", note: "القدم = 0.3048 متر بالتعريف", aliases: ["سكوير فيت", "square feet"] },
  { key: "sqyd", slug: "yard-murabba", name: "ياردة مربّعة", short: "ياردة²", m2: 0.83612736, basis: "official", country: "*", note: "9 أقدام مربّعة" },
  { key: "acre", slug: "acre", name: "فدّان إنجليزي (acre)", short: "acre", m2: 4046.8564224, basis: "official", country: "*", note: "ليس الفدان المصريّ — الفارق 154 م²" },
];

/** وحدات محلّية بكل اشتقاقاتها. */
export const LOCAL_UNITS: AreaUnit[] = [
  // ── اليمن: أشهر بلد تتعدّد فيه الاشتقاقات، ولهذا نفصّلها كلّها ──
  { key: "libnah_sanaani", slug: "libnah-sanaani", name: "اللبنة الصنعاني", short: "لبنة صنعاني", m2: 44.44, basis: "documented", country: "YE", region: "صنعاء وما حولها", aliases: ["اللبنة كم متر", "لبنة صنعاء"] },
  { key: "libnah_dhamari", slug: "libnah-dhamari", name: "اللبنة الذماري", short: "لبنة ذماري", m2: 114.49, basis: "documented", country: "YE", region: "ذمار" },
  { key: "libnah_amrani", slug: "libnah-amrani", name: "اللبنة العمراني", short: "لبنة عمراني", m2: 64, basis: "documented", country: "YE", region: "عمران" },
  { key: "libnah_saadi", slug: "libnah-saadi", name: "اللبنة الصعدي (الحبلة)", short: "لبنة صعدي", m2: 28.09, basis: "documented", country: "YE", region: "صعدة", aliases: ["الحبلة كم متر"] },
  { key: "qasabah_ashari", slug: "qasabah-ashari-taizi", name: "القصبة العشاري (التعزي)", short: "قصبة عشاري", m2: 20.25, basis: "documented", country: "YE", region: "تعز", note: "ضلعها 4.5 متر", aliases: ["القصبة العشارية", "قصبة تعز"] },
  { key: "qasabah_hadawi", slug: "qasabah-hadawi-taizi", name: "القصبة الهدوي (الاثنا عشري)", short: "قصبة هدوي", m2: 29.16, basis: "documented", country: "YE", region: "تعز", note: "ضلعها 5.4 متر", aliases: ["القصبة الاثنا عشرية"] },
  { key: "qasabah_ibbi", slug: "qasabah-ibbi", name: "القصبة الإبي", short: "قصبة إبي", m2: 56.25, basis: "documented", country: "YE", region: "إب", note: "ضلعها 7.5 متر", aliases: ["قصبة إب كم متر"] },
  { key: "maad_sanaani", slug: "maad", name: "المعاد (100 لبنة صنعاني)", short: "معاد", m2: LIBNAH_SANAANI * 100, basis: "documented", country: "YE", note: "محسوب: 100 × اللبنة الصنعاني" },
  { key: "maad_tihami", slug: "maad-tihami", name: "المعاد التهامي", short: "معاد تهامي", m2: LIBNAH_SANAANI * 98, basis: "documented", country: "YE", region: "تهامة والساحل الغربيّ", note: "98 لبنة صنعاني" },
  { key: "maad_jizani", slug: "maad-jizani", name: "المعاد الجيزاني", short: "معاد جيزاني", m2: 3600, basis: "documented", country: "YE", note: "60 × 60 متراً" },

  // ── مصر والسودان ──
  { key: "feddan", slug: "feddan", name: "الفدان", short: "فدان", m2: FEDDAN, basis: "official", country: "EG", note: "24 قيراطاً = 4200.83 م²", aliases: ["الفدان كم متر مربع", "تحويل الفدان"] },
  { key: "qirat", slug: "qirat", name: "القيراط", short: "قيراط", m2: QIRAT, basis: "official", country: "EG", note: "1/24 فدان = 24 سهماً", aliases: ["كم متر في القيراط"] },
  { key: "sahm", slug: "sahm", name: "السهم", short: "سهم", m2: SAHM, basis: "official", country: "EG", note: "1/24 قيراط" },
  { key: "feddan_sd", slug: "feddan-sudani", name: "الفدان السوداني", short: "فدان", m2: FEDDAN, basis: "official", country: "SD", note: "مطابق للفدان المصريّ" },
  { key: "qirat_sd", slug: "qirat-sudani", name: "القيراط السوداني", short: "قيراط", m2: QIRAT, basis: "official", country: "SD" },

  // ── العراق ──
  { key: "dunam_iq", slug: "dunam-iraqi", name: "الدونم العراقي", short: "دونم عراقي", m2: 2500, basis: "official", country: "IQ", note: "≠ الدونم المتريّ (1000 م²)", aliases: ["الدونم كم متر في العراق"] },
  { key: "ulk", slug: "ulk", name: "الأولك", short: "أولك", m2: 25, basis: "documented", country: "IQ", note: "1/100 دونم عراقي" },
  { key: "mishara", slug: "mishara", name: "المشارة", short: "مشارة", m2: 2500, basis: "local", country: "IQ", note: "تُستعمل بمعنى الدونم في الشمال" },

  // ── بلاد الشام ──
  { key: "dunam_jo", slug: "dunam", name: "الدونم المتري", short: "دونم", m2: 1000, basis: "official", country: "JO", note: "المعتمد رسمياً في الأردن وسوريا وفلسطين", aliases: ["الدونم كم متر مربع"] },
  { key: "dunam_ottoman", slug: "dunam-othmani", name: "الدونم العثماني", short: "دونم عثماني", m2: 919.3, basis: "documented", country: "JO", note: "وثائق الطابو قبل التوحيد المتريّ" },
  { key: "dunam_ps", slug: "dunam-falastini", name: "الدونم الفلسطيني", short: "دونم", m2: 1000, basis: "official", country: "PS", note: "المتريّ؛ والعثمانيّ 919.3 م² في الطابو القديم" },
  { key: "dunam_sy", slug: "dunam-souri", name: "الدونم السوري", short: "دونم", m2: 1000, basis: "official", country: "SY" },
  { key: "dunam_lb", slug: "dunam-lubnani", name: "الدونم اللبناني", short: "دونم", m2: 1000, basis: "official", country: "LB" },

  // ── الخليج والمغرب العربي: النظام المتريّ هو المعتمد ──
  { key: "dunam_sa", slug: "dunam-saudi", name: "الدونم", short: "دونم", m2: 1000, basis: "official", country: "SA", note: "الأراضي الزراعية؛ والسكنيّة بالمتر المربّع" },
  { key: "dunam_ae", slug: "dunam-emarati", name: "الدونم", short: "دونم", m2: 1000, basis: "official", country: "AE", note: "وسوق العقار يتعامل بالقدم المربّع" },
  { key: "dunam_kw", slug: "dunam-kuwaiti", name: "الدونم", short: "دونم", m2: 1000, basis: "official", country: "KW" },
  { key: "dunam_qa", slug: "dunam-qatari", name: "الدونم", short: "دونم", m2: 1000, basis: "official", country: "QA" },
  { key: "dunam_om", slug: "dunam-omani", name: "الدونم", short: "دونم", m2: 1000, basis: "official", country: "OM" },
  { key: "dunam_bh", slug: "dunam-bahraini", name: "الدونم", short: "دونم", m2: 1000, basis: "official", country: "BH" },
  { key: "dunam_ly", slug: "dunam-libi", name: "الدونم", short: "دونم", m2: 1000, basis: "official", country: "LY" },
];

export interface Country { code: string; name: string; flag: string; hint?: string }

export const COUNTRIES: Country[] = [
  { code: "YE", name: "اليمن", flag: "🇾🇪", hint: "اليمن أكثر البلاد تعدّداً في الوحدات: لكل إقليم لبنته وقصبته بقيمة مختلفة — اختر اشتقاق منطقتك بالاسم، ولا تعتمد رقماً عامّاً." },
  { code: "EG", name: "مصر", flag: "🇪🇬", hint: "وحدات رسمية دقيقة: الفدان 24 قيراطاً، والقيراط 24 سهماً." },
  { code: "SD", name: "السودان", flag: "🇸🇩", hint: "الفدان السوداني مطابق للمصريّ (4200.83 م²)." },
  { code: "SA", name: "السعودية", flag: "🇸🇦", hint: "القياس رسمياً بالمتر المربّع، والزراعيّ بالهكتار والدونم." },
  { code: "IQ", name: "العراق", flag: "🇮🇶", hint: "انتبه: الدونم العراقي 2500 م² — ضعفَا الدونم المتريّ ونصف." },
  { code: "JO", name: "الأردن", flag: "🇯🇴", hint: "الدونم المتريّ (1000 م²) هو المعتمد؛ والعثمانيّ يظهر في الوثائق القديمة." },
  { code: "PS", name: "فلسطين", flag: "🇵🇸" },
  { code: "SY", name: "سوريا", flag: "🇸🇾" },
  { code: "LB", name: "لبنان", flag: "🇱🇧" },
  { code: "AE", name: "الإمارات", flag: "🇦🇪", hint: "سوق العقار يتعامل بالقدم المربّع = 0.09290304 م² بالتعريف." },
  { code: "KW", name: "الكويت", flag: "🇰🇼" },
  { code: "QA", name: "قطر", flag: "🇶🇦" },
  { code: "OM", name: "عُمان", flag: "🇴🇲" },
  { code: "BH", name: "البحرين", flag: "🇧🇭" },
  { code: "LY", name: "ليبيا", flag: "🇱🇾" },
  { code: "MA", name: "المغرب", flag: "🇲🇦", hint: "النظام المتريّ: الهكتار والآر والمتر المربّع." },
  { code: "DZ", name: "الجزائر", flag: "🇩🇿" },
  { code: "TN", name: "تونس", flag: "🇹🇳" },
];

export const ALL_UNITS: AreaUnit[] = [...LOCAL_UNITS, ...GLOBAL_UNITS];
export const unitsOfCountry = (code: string) => LOCAL_UNITS.filter((u) => u.country === code);
export const unitBySlug = (slug: string) => ALL_UNITS.find((u) => u.slug === slug);
export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code);

export const BASIS_LABEL: Record<Basis, string> = {
  official: "رسمية",
  documented: "موثّقة إقليمياً",
  local: "عرفية — تأكّد محلياً",
};
