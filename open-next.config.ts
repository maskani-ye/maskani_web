// إعداد OpenNext لـCloudflare.
//
// ⚠️ **ذاكرة ISR ليست تحسيناً هنا — بل مكان سكن الصفحات المولّدة مسبقاً.**
// عطّلتُها أوّل مرّة حين تعثّرت تعبئتها على R2، فبُنيت ٩٨٩ صفحة ولم يبقَ ما
// يخدمها: ردّت **صفحات الأسواق الستّ كلّها 404**.
//
// ⚠️ **ثمّ جرّبتُ مخزناً مركّباً (R2 فوق الأصول) ليحلّ مشكلة الكتابة — فأسقط
// الأسواق ثانيةً.** النمط الذي كشفه العطل: سقط **كل** مسارٍ ديناميكيّ بـ
// `dynamicParams = false` (`/ye/*` · `/tools/area-converter/[unit]` ·
// `/blog/category/[slug]`)، وبقي كل مسارٍ يسمح بالتوليد عند الطلب. أي أنّ
// القراءة المركّبة لم تُرجِع ما خُبز وقت البناء، فما لا بديل له سقط 404.
//
// فالإعداد يعود إلى ما ثبتت صحّته: الخدمة من **حزمة الأصول** وحدها. وثمنه
// معروف ومقبول مؤقّتاً: ما لم يُخبز وقت البناء يُصيَّر عند كل طلب
// (`x-nextjs-cache: MISS`). موقعٌ يعمل ببطء أهون من موقعٍ سريعٍ مكسور،
// ومسألة الكتابة تُعالَج بعد استقرار الإنتاج لا قبله.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
