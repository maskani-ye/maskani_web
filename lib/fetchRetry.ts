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
/** أقصى طلباتٍ متزامنة نحو خادمنا — سقفٌ عالميّ لكل مستدعٍ. */
const MAX_INFLIGHT = 6;
/** مهلة الطلب الواحد. */
const REQUEST_TIMEOUT_MS = 20_000;

let inflight = 0;
const queue: (() => void)[] = [];

async function acquire(): Promise<void> {
  if (inflight < MAX_INFLIGHT) {
    inflight++;
    return;
  }
  await new Promise<void>((resolve) => queue.push(resolve));
  inflight++;
}

function release(): void {
  inflight--;
  queue.shift()?.();
}

/**
 * ⚠️ **بناءٌ جمد ستّاً وعشرين دقيقة بلا صفحةٍ واحدة (2026-09-21).** جمع بيانات
 * ٩٧٣ صفحة يُطلق مئات الطلبات معاً: عُدَّ **٧٥ اتصالاً لكل عامل** — نحو ٦٧٥
 * اتصالاً متزامناً على `t3.micro`. فارتفع زمن الردّ من ١٫٣ إلى ٥٫٤ ثانية، ثمّ
 * بقيت الطلبات **معلّقة بلا مهلة**: لا تنجح ولا تفشل، فلا تتقدّم إعادة المحاولة
 * ولا يتقدّم البناء. ووقت المعالج يبقى مجمّداً فيبدو تعطّلاً وهو انتظار.
 *
 * فالعلاج طبقتان: **سقفُ تزامنٍ** يمنع إغراق الخادم، و**مهلةٌ** تحوّل الانتظار
 * الأبديّ إلى فشلٍ قابلٍ لإعادة المحاولة. وتقليل عمّال البناء وحده لا يكفي —
 * التوازي يأتي من كودنا لا من عددهم.
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
    await acquire();
    try {
      const res = await fetch(url, {
        ...signed,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // ٤٢٩ وأخطاء الخادم عابرة — نتراجع ونعيد. أمّا ٤٠٤ فجواب نهائيّ.
      if (res.status === 429 || res.status >= 500) {
        if (i === tries - 1) return res;
        release();
        inflight++;            // يُوازن `finally` التالي
        await new Promise((r) => setTimeout(r, wait));
        wait *= 2;
        continue;
      }
      return res;
    } catch (err) {
      // ⚠️ **الابتلاع الصامت أضاع ساعةً في تشخيص بناءٍ فاشل.** كان `catch {}`
      // يُخفي السبب، فتصل الرسالة إلى الحارس بكلمة «شبكة» وحدها — ولا يُعرف
      // أمهلةٌ انتهت أم رفضٌ من الخادم أم خطأ برمجيّ. السبب يُطبع الآن مرّة.
      if (i === 0) {
        const e = err as { name?: string; message?: string; cause?: unknown };
        console.warn(
          `   ↻ فشل جلب ${url.slice(0, 80)} — ${e?.name ?? "?"}: ${e?.message ?? err}` +
            (e?.cause ? ` · السبب: ${String(e.cause).slice(0, 120)}` : ""),
        );
      }
      if (i === tries - 1) return null;
      await new Promise((r) => setTimeout(r, wait));
      wait *= 2;
    } finally {
      release();
    }
  }
  return null;
}
