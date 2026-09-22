// إعداد OpenNext لـCloudflare.
//
// ⚠️ **ذاكرة ISR ليست تحسيناً هنا — بل مكان سكن الصفحات المولّدة مسبقاً.**
// عطّلتُها أوّل مرّة حين تعثّرت تعبئتها على R2، فبُنيت ٩٨٩ صفحة ولم يبقَ ما
// يخدمها: ردّت **صفحات الأسواق الستّ كلّها 404** (و`dynamicParams=false`
// يرفض أيّ مسار غير مُولَّد، فلا رجوع إلى التصيير عند الطلب).
//
// ⚠️ **ثمّ تبيّن أنّ خدمتها من الأصول وحدها لا تكفي: ذلك المخزن للقراءة فقط.**
// `StaticAssetsIncrementalCache.set()` يسجّل خطأً ولا يكتب شيئاً — فصفحةٌ لم
// تُخبز وقت البناء (كل عقارٍ وخدمةٍ وطلب) تُصيَّر **من الصفر في كل زيارة**:
// `x-nextjs-cache: MISS` دائماً، وأربع ثوانٍ وتجاوزٌ لسقف المعالج (١٠ م.ث).
//
// فالمخزن أدناه **يجمع الاثنين**: يقرأ من R2 أوّلاً (فيه ما كُتب عند الطلب،
// وهو الأحدث لصفحةٍ أُعيد تصييرها بعد البناء)، ويسقط إلى أصول البناء لما
// خُبز مسبقاً، ويكتب إلى R2 وحده. وبهذا لا سطلَ يُعبَّأ بآلاف الملفّات عند
// النشر (سبب العطل الأوّل)، ولا صفحةَ تُصيَّر مرّتين.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import type { IncrementalCache } from "@opennextjs/aws/types/overrides.js";

const layeredIncrementalCache: IncrementalCache = {
  name: "maskani-r2-over-static-assets",

  async get(key, cacheType) {
    const fromR2 = await r2IncrementalCache.get(key, cacheType);
    if (fromR2) return fromR2;
    // ⚠️ `composable` غير مدعوم في مخزن الأصول — يرمي لا يُرجِع `null`.
    if (cacheType === "composable") return null;
    try {
      return await staticAssetsIncrementalCache.get(key, cacheType);
    } catch {
      return null;
    }
  },

  // الكتابة إلى R2 وحده: الأصول ثابتةٌ بعد البناء بطبيعتها.
  set: (key, value, cacheType) => r2IncrementalCache.set(key, value, cacheType),
  delete: (key) => r2IncrementalCache.delete(key),
};

export default defineCloudflareConfig({
  incrementalCache: layeredIncrementalCache,
});
