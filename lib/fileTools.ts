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
      { path: "pdf/compress-pdf", title: "ضغط PDF", desc: "صكٌّ ممسوح ضوئياً بحجمٍ يقبله واتساب والبريد." },
      { path: "pdf/split-pdf", title: "تقسيم PDF", desc: "استخرج صفحةً واحدة من عقدٍ طويل." },
      { path: "pdf/word-to-pdf", title: "Word إلى PDF", desc: "عقد إيجار كتبته في Word بصيغةٍ لا تتغيّر عند الطرف الآخر." },
      { path: "pdf/pdf-to-jpg", title: "PDF إلى صورة", desc: "مخطّط العقار من ملف PDF إلى صورةٍ تُرفق بالإعلان." },
    ],
  },
];
