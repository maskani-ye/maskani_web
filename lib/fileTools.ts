// أدوات الملفات — روابط إلى OxFile (موقعٌ شقيق لمسكني، الحساب الإعلانيّ نفسه).
// ⚠️ **مختارةٌ لما يحتاجه المعلن العقاريّ لا القائمة كاملة.** كل بطاقة تقول
// لماذا تنفعه في عقاره؛ قائمةُ روابط بلا سياق تبدو تبادلَ روابط لا خدمة.
// `utm_source=maskani` يُظهر الزيارات القادمة من هنا في تحليلات OxFile.

const BASE = "https://oxfile.org/ar/tools";

export function oxfileUrl(path: string, medium: string): string {
  return `${BASE}/${path}?utm_source=maskani&utm_medium=${medium}`;
}

export interface FileTool {
  path: string;
  title: string;
  desc: string;
}

export const FILE_TOOL_GROUPS: { title: string; tools: FileTool[] }[] = [
  {
    title: "صور العقار",
    tools: [
      { path: "image/crop-image", title: "قصّ الصورة", desc: "أخفِ ما لا يلزم من اللقطة — لوحة سيارة أو وجه أو رقمٌ مكتوب." },
      { path: "image/image-watermark", title: "علامة مائية", desc: "ضع اسمك على صور عقارك قبل نشرها في أكثر من مكان." },
      { path: "image/remove-background", title: "إزالة الخلفية", desc: "صورة مخطّط أو قطعة أثاث بخلفيةٍ نظيفة." },
      { path: "image/resize-image", title: "تغيير المقاس", desc: "مقاسٌ واحد لكل الصور فيبدو معرض العقار مرتّباً." },
      { path: "image/compress-image", title: "ضغط الصور", desc: "صورٌ أخفّ للإرسال عبر واتساب أو البريد." },
      { path: "image/convert-image", title: "تحويل صيغة الصورة", desc: "صور الآيفون (HEIC) وغيرها إلى JPG أو PNG." },
    ],
  },
  {
    title: "العقود والمستندات",
    tools: [
      { path: "pdf/merge-pdf", title: "دمج ملفات PDF", desc: "العقد والصكّ والهوية في ملفٍّ واحد للمشتري أو المستأجر." },
      { path: "pdf/split-pdf", title: "تقسيم PDF", desc: "استخرج صفحةً واحدة من عقدٍ طويل." },
      { path: "pdf/word-to-pdf", title: "Word إلى PDF", desc: "عقد إيجار كتبته في Word بصيغةٍ لا تتغيّر عند الطرف الآخر." },
      { path: "pdf/pdf-to-jpg", title: "PDF إلى صورة", desc: "مخطّط العقار من ملف PDF إلى صورةٍ تُرفق بالإعلان." },
    ],
  },
];

// ─── بانر OxFile — الأداة الأنسب لموضوع الصفحة ──────────────────────────────
// الكلمات تُطابَق في العنوان والوسوم: مقالٌ عن العقود يقترح أدوات PDF، وعن الصور
// أدوات الصور. وما لا يطابق شيئاً يأخذ «دمج PDF» — أكثر ما يحتاجه من يبيع أو يؤجّر.
// ⚠️ **لا تُروَّج أداةٌ قبل قياس أنّها تعمل.** «ضغط PDF» في OxFile يعيد حفظ الملفّ
// فقط: ملفٌّ بأربعة ميغابايت خرج أصغر بـ0.02% (قيس 2026-10-18)، فأُخرج من هنا.

export interface BannerTool {
  path: string;
  headline: string;
  pitch: string;
}

const BANNER_RULES: { words: RegExp; tool: BannerTool }[] = [
  {
    words: /صور|تصوير|لقطة|معرض|كاميرا/,
    tool: { path: "image/image-watermark", headline: "احمِ صور عقارك بعلامة مائية", pitch: "ضع اسمك على الصور قبل نشرها — مجاناً ومن متصفّحك." },
  },
  {
    words: /مخطط|مخطّط|خريطة|رسم هندسي|كروكي/,
    tool: { path: "pdf/pdf-to-jpg", headline: "حوّل مخطّط PDF إلى صورة", pitch: "أرفق مخطّط عقارك بالإعلان صورةً واضحة — في ثوانٍ." },
  },
  {
    words: /عقد|إيجار|ايجار|صك|صكّ|طابو|سند|توثيق|ملكية|نقل|وكالة|شهر عقاري|تسجيل/,
    tool: { path: "pdf/merge-pdf", headline: "اجمع العقد والصكّ والهوية في ملف واحد", pitch: "ادمج مستنداتك في PDF واحد يُرسل بسهولة — مجاناً." },
  },
];

const DEFAULT_BANNER: BannerTool = {
  path: "pdf/merge-pdf",
  headline: "أوراق عقارك في ملفٍّ واحد",
  pitch: "ادمج العقد والصكّ والمخطّط في PDF واحد يُرسل بسهولة — مجاناً ومن متصفّحك.",
};

export function pickBannerTool(...texts: (string | undefined | null)[]): BannerTool {
  const hay = texts.filter(Boolean).join(" ");
  return BANNER_RULES.find((r) => r.words.test(hay))?.tool ?? DEFAULT_BANNER;
}
