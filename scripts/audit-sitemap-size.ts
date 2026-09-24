/**
 * حارس حجم خريطة الموقع — يفحص **الخريطة الحيّة** بعد النشر.
 *
 * ⚠️ **سبب وجوده**: هبطت الخريطة من ٨٬٢٥٣ رابطاً إلى ٩٣٨ بلا أيّ إشارة —
 * لا خطأ بناء ولا سطر سجلّ. سقفُ Workers (٥٠ طلباً فرعياً) أسقط جلب
 * العقارات، و`catch { return [] }` ابتلع الفشل، فخرجت خريطةٌ **صحيحة الشكل
 * ناقصة المضمون**. وهذا أسوأ من خريطةٍ ساقطة: الساقطة تُرى.
 *
 * المعيار: عدد الروابط لا يقلّ عن عدد العقارات النشِطة في الـAPI.
 *
 *     npx tsx scripts/audit-sitemap-size.ts [https://maskani.homes]
 */
const BASE = process.argv[2] || "https://maskani.homes";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

async function main() {
  const [xml, countRes] = await Promise.all([
    fetch(`${BASE}/sitemap.xml`).then((r) => r.text()),
    fetch(`${API}/properties/?limit=1`).then((r) => r.json()),
  ]);
  const urls = (xml.match(/<loc>/g) ?? []).length;
  const props = Number(countRes?.count ?? 0);
  const listed = (xml.match(/\/properties\/\d+</g) ?? []).length;

  console.log(`روابط الخريطة: ${urls} · عقارات في الـAPI: ${props} · مُدرَجة: ${listed}`);

  // عتبة متساهلة عمداً: العقار قد يُحذف بين النداءين، والمطلوب كشف الانهيار
  // لا مطابقةٌ إلى الرقم. سقوطٌ دون التسعين بالمئة يعني عطلاً لا تقلّباً.
  if (props > 0 && listed < props * 0.9) {
    console.error(
      `⛔ الخريطة تُدرج ${listed} عقاراً فقط من ${props} — جلبٌ فاشل مبتلَع.`,
    );
    process.exit(1);
  }
  console.log("■ الخريطة مكتملة.");
}

main().catch((e) => {
  console.error("⛔ تعذّر فحص الخريطة:", e);
  process.exit(1);
});
