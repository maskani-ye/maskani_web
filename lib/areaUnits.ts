// وحدات قياس المساحة في العالم العربيّ — مصدر واحد للأرقام.
//
// قاعدة التحرير: كل وحدة إمّا **دقيقة** (`exact: true`) بقيمة رسمية أو معياريّة
// لا تختلف، أو **تقديرية** (`exact: false`) لأن قيمتها عرفية تختلف بين منطقة
// وأخرى. الوحدات التقديرية تُعرض موسومةً وقابلة للتعديل — لأن رقماً واحداً
// ثابتاً لوحدة عرفية يُخسِر أحدَهم صفقة.

export interface AreaUnit {
  key: string;
  name: string;
  m2: number;        // كم متراً مربّعاً في الوحدة الواحدة
  exact: boolean;
  note?: string;
}

/** وحدات معياريّة تُعرض مع كل دولة — قيمها دولية دقيقة بالتعريف. */
export const GLOBAL_UNITS: AreaUnit[] = [
  { key: "m2", name: "متر مربّع", m2: 1, exact: true },
  { key: "km2", name: "كيلومتر مربّع", m2: 1_000_000, exact: true },
  { key: "hectare", name: "هكتار", m2: 10_000, exact: true, note: "10,000 م² — 100×100 متر" },
  { key: "are", name: "آر", m2: 100, exact: true, note: "1/100 هكتار" },
  { key: "sqft", name: "قدم مربّع", m2: 0.09290304, exact: true, note: "القدم = 0.3048 متر بالتعريف" },
  { key: "sqyd", name: "ياردة مربّعة", m2: 0.83612736, exact: true },
  { key: "acre", name: "فدّان إنجليزي (acre)", m2: 4046.8564224, exact: true, note: "ليس الفدان المصريّ" },
];

/** وحدات محلّية لكل دولة. */
export interface Country {
  code: string;
  name: string;
  flag: string;
  units: AreaUnit[];
  hint?: string;
}

const FEDDAN = 4200 + 5 / 6;          // 4200.8333… م² — التعريف الرسميّ المصريّ
const QIRAT = FEDDAN / 24;            // 175.0347… م²
const SAHM = QIRAT / 24;              // 7.2931… م²

export const COUNTRIES: Country[] = [
  {
    code: "YE", name: "اليمن", flag: "🇾🇪",
    hint: "وحدات اليمن عرفيّة وتختلف بين محافظة وأخرى بل بين مديريّة وجارتها — القيم أدناه شائعة لا رسمية، عدّلها بقيمة منطقتك.",
    units: [
      { key: "libnah", name: "لبنة", m2: 44.44, exact: false, note: "شائعة في صنعاء وما حولها" },
      { key: "qasabah", name: "قصبة", m2: 400, exact: false, note: "≈ 9 لبنات في كثير من المناطق" },
      { key: "maad", name: "معاد", m2: 1000, exact: false, note: "تختلف كثيراً بين المناطق" },
    ],
  },
  {
    code: "EG", name: "مصر", flag: "🇪🇬",
    hint: "وحدات مصر رسمية ودقيقة: الفدان 24 قيراطاً، والقيراط 24 سهماً.",
    units: [
      { key: "feddan", name: "فدان", m2: FEDDAN, exact: true, note: "4200.83 م² — 24 قيراطاً" },
      { key: "qirat", name: "قيراط", m2: QIRAT, exact: true, note: "1/24 فدان" },
      { key: "sahm", name: "سهم", m2: SAHM, exact: true, note: "1/24 قيراط" },
    ],
  },
  {
    code: "SD", name: "السودان", flag: "🇸🇩",
    hint: "يُستعمل الفدان المصريّ نفسه، والمخطّطات السكنية تُقاس بالمتر المربّع.",
    units: [
      { key: "feddan", name: "فدان", m2: FEDDAN, exact: true, note: "كالفدان المصريّ" },
      { key: "qirat", name: "قيراط", m2: QIRAT, exact: true },
    ],
  },
  {
    code: "SA", name: "السعودية", flag: "🇸🇦",
    hint: "القياس رسميّاً بالمتر المربّع؛ الأراضي الزراعية تُذكر بالهكتار والدونم.",
    units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true, note: "الدونم المتريّ" }],
  },
  {
    code: "JO", name: "الأردن", flag: "🇯🇴",
    hint: "الدونم المتريّ (1000 م²) هو المعتمد؛ وقد تصادف الدونم العثمانيّ في وثائق قديمة.",
    units: [
      { key: "dunam", name: "دونم", m2: 1000, exact: true },
      { key: "ottoman", name: "دونم عثماني", m2: 919.3, exact: false, note: "وثائق ما قبل التوحيد المتريّ" },
    ],
  },
  {
    code: "PS", name: "فلسطين", flag: "🇵🇸",
    units: [
      { key: "dunam", name: "دونم", m2: 1000, exact: true },
      { key: "ottoman", name: "دونم عثماني", m2: 919.3, exact: false, note: "شائع في الطابو القديم" },
    ],
  },
  {
    code: "SY", name: "سوريا", flag: "🇸🇾",
    units: [
      { key: "dunam", name: "دونم", m2: 1000, exact: true },
      { key: "ottoman", name: "دونم عثماني", m2: 919.3, exact: false },
    ],
  },
  {
    code: "IQ", name: "العراق", flag: "🇮🇶",
    hint: "انتبه: الدونم العراقيّ 2500 م² — أي ضعفَي الدونم الأردنيّ ونصف.",
    units: [
      { key: "iq_dunam", name: "دونم عراقي", m2: 2500, exact: true, note: "≠ الدونم المتريّ" },
      { key: "ulk", name: "أولك", m2: 25, exact: false, note: "≈ 1/100 دونم عراقي" },
      { key: "mishara", name: "مشارة", m2: 2500, exact: false, note: "تُستعمل بمعنى الدونم في الشمال" },
    ],
  },
  {
    code: "AE", name: "الإمارات", flag: "🇦🇪",
    hint: "سوق العقار يتعامل بالقدم المربّع غالباً — والقدم = 0.09290304 م² بالتعريف.",
    units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true }],
  },
  { code: "KW", name: "الكويت", flag: "🇰🇼", units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true }] },
  { code: "QA", name: "قطر", flag: "🇶🇦", units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true }] },
  { code: "OM", name: "عُمان", flag: "🇴🇲", units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true }] },
  { code: "BH", name: "البحرين", flag: "🇧🇭", units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true }] },
  {
    code: "LB", name: "لبنان", flag: "🇱🇧",
    units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true }],
  },
  {
    code: "LY", name: "ليبيا", flag: "🇱🇾",
    units: [{ key: "dunam", name: "دونم", m2: 1000, exact: true }],
  },
  {
    code: "MA", name: "المغرب", flag: "🇲🇦",
    hint: "القياس بالهكتار والآر والمتر المربّع (النظام المتريّ الفرنسيّ).",
    units: [],
  },
  { code: "DZ", name: "الجزائر", flag: "🇩🇿", units: [] },
  { code: "TN", name: "تونس", flag: "🇹🇳", units: [] },
];

export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code);
