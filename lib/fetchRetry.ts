/**
 * جلبٌ يصمد أمام الخنق — لا يبتلع الفشل ولا يبني عليه صفحةً ناقصة.
 *
 * ⚠️ **درسٌ من بناء ٢٠٢٦-٠٩-١٠.** البناء يولّد مئات صفحات الأحياء والمدن،
 * وكل صفحة تسأل الواجهة أكثر من سؤال، فيتجاوز المجموع سقف ٣٠٠ طلب/دقيقة
 * فيردّ الخادم ٤٢٩. والصفحات كانت تفسّر ذلك «لا بيانات» فتُخبَز فارغةً أو
 * ٤٠٤ — عطلٌ صامت لا يظهر في أيّ سجلّ، ويُنشر كما هو.
 *
 * الانتظار هنا **متعمَّد**: بناءٌ أبطأ بدقيقة خيرٌ من موقعٍ ينقصه نصف صفحاته.
 */
export async function fetchRetry(
  url: string,
  init?: RequestInit & { next?: { revalidate?: number } },
  tries = 4,
): Promise<Response | null> {
  // ⚠️ **الطلب يُوقَّع بمفتاح خادمنا — وهذا هو الإصلاح لا الإعادة.**
  // الخادم يُعفي من حدّ الزائر المجهول (٣٠٠/دقيقة) كلَّ طلبٍ يحمل
  // `X-Maskani-Internal` مطابقاً لـ`INTERNAL_API_TOKEN`
  // (`core/throttling.py`). خريطة الموقع كانت توقّع طلباتها منذ زمن،
  // والصفحات لم تفعل — فخُنقت هي وحدها وخُبز منها ٥١٩ حيّاً و٦٥ مقالاً 404.
  // المتغيّر بلا `NEXT_PUBLIC_` فلا يبلغ المتصفّح، وهذه الدالّة للخادم فقط.
  const token = process.env.INTERNAL_API_TOKEN;
  const signed: typeof init = token
    ? { ...init, headers: { ...(init?.headers as Record<string, string>), "X-Maskani-Internal": token } }
    : init;

  let wait = 1500;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, signed);
      // ٤٢٩ وأخطاء الخادم عابرة — نتراجع ونعيد. أمّا ٤٠٤ فجواب نهائيّ.
      if (res.status === 429 || res.status >= 500) {
        if (i === tries - 1) return res;
        await new Promise((r) => setTimeout(r, wait));
        wait *= 2;
        continue;
      }
      return res;
    } catch {
      if (i === tries - 1) return null;
      await new Promise((r) => setTimeout(r, wait));
      wait *= 2;
    }
  }
  return null;
}
