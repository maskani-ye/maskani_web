// تحويل الأرقام العربية/الفارسية إلى إنجليزية — مطابق لمنسّق التطبيقات
// (`ConvertArabicToEnglishNumbersFormatter` في shared_utils) كي يتصرّف السطحان
// بالطريقة نفسها.
//
// لماذا هذا ضروريّ لا تجميليّ: لوحة المفاتيح العربية على الجوّال تُدخل «٥٠٠٠»،
// والخادم يقرأها نصّاً غير رقميّ فيردّ بخطأ تحقّق غامض، أو أسوأ: `parseFloat`
// يُرجع NaN فيُحفظ الحقل صفراً بلا أن ينتبه أحد.

const AR = "٠١٢٣٤٥٦٧٨٩";
const FA = "۰۱۲۳۴۵۶۷۸۹";

/** يحوّل كل رقم عربيّ/فارسيّ إلى نظيره الإنجليزيّ، والفاصلة العربية إلى نقطة. */
export function toEnglishDigits(input: string): string {
  if (!input) return input;
  let out = "";
  for (const ch of input) {
    const ar = AR.indexOf(ch);
    if (ar > -1) { out += String(ar); continue; }
    const fa = FA.indexOf(ch);
    if (fa > -1) { out += String(fa); continue; }
    out += ch === "٫" || ch === "،" ? "." : ch;
  }
  return out;
}

/** مغلّف جاهز لـonChange في أي حقل رقميّ. */
export function withEnglishDigits<T extends { target: { value: string } }>(
  handler: (value: string) => void,
): (e: T) => void {
  return (e) => handler(toEnglishDigits(e.target.value));
}
