// إعداد OpenNext لـCloudflare.
//
// ⚠️ **ذاكرة ISR ليست تحسيناً هنا — بل مكان سكن الصفحات المولّدة مسبقاً.**
// عطّلتُها أوّل مرّة حين تعثّرت تعبئتها على R2، فبُنيت ٩٨٩ صفحة ولم يبقَ ما
// يخدمها: ردّت **صفحات الأسواق الستّ كلّها 404** (و`dynamicParams=false`
// يرفض أيّ مسار غير مُولَّد، فلا رجوع إلى التصيير عند الطلب).
//
// والبديل المختار يخدمها من **حزمة الأصول نفسها**: لا سطل R2 يُعبَّأ بآلاف
// الملفّات الصغيرة فتنتهي مهلته، ولا KV بحدّ ألف كتابةٍ يومياً لا يكفي صفحاتنا.
// مجانيّ بالكامل ويقع ضمن حدود الأصول (٢٠ ألف ملفّ).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
