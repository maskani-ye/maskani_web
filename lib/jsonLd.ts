/**
 * تسلسل آمن لبيانات JSON-LD قبل حقنها في `<script>` بـ`dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` وحده لا يهرّب `<`، فعنوانُ عقارٍ يكتبه مستخدمٌ مثل
 * `</script><script>…` يُغلق الوسم ويُنفِّذ شيفرته عند كل زائر (XSS مخزّن).
 * نُهرّب `<` و`>` و`&` وفاصلَي السطر U+2028/U+2029 إلى `\uXXXX` — يبقى JSON
 * صالحاً ومطابقاً حرفياً لما يقرؤه Googlebot، ولا يمكن أن يُغلق الوسم.
 *
 * ⛔ كل حقنٍ لـJSON داخل `<script>` يمرّ من هنا — الحارس `scripts/audit-jsonld.ts`
 * يُسقط البناء إن وجد `__html: JSON.stringify(` خاماً.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
