import { withSentryConfig } from "@sentry/nextjs";
// يُشغّل محاكي Cloudflare في `next dev` فتعمل الارتباطات (R2 وغيرها) محلياً
// كما تعمل في الإنتاج — بلا هذا السطر يفشل ما يعتمد عليها عند التطوير.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// ⚠️ **للتطوير وحده.** استدعاؤها بلا شرط يُشغّل محاكي Workers أثناء بناء
// الإنتاج أيضاً (ظهر في السجلّ: «Using secrets defined in .dev.vars»)،
// فعلِق البناء عند «جمع بيانات الصفحات» أربعاً وثلاثين دقيقة بوقت معالجٍ
// مجمَّد عند خمسين ثانية — أي جمودٌ لا بطء.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️ **توازي البناء يخنق خادمنا.** التسعة عمّال الافتراضيون فتحوا نحو ٦٧٥
  // اتصالاً متزامناً على t3.micro، فارتفع زمن ردّ الـAPI من ١٫٣ إلى ٥٫٤ ثانية
  // ووقف البناء ستّاً وعشرين دقيقة بلا توليد صفحةٍ واحدة — اختناقٌ لا تعطّل.
  // ثلاثة عمّال أبطأ نظرياً وأسرع فعلياً، لأنّ الخادم يلحق بها.
  experimental: {
    cpus: 3,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // وسائط الباك اند (صور العقارات/الخدمات/الأفاتار) تُخدَم من هذا النطاق.
    remotePatterns: [
      { protocol: "https", hostname: "api.maskani.homes" },
      // وسائط Cloudflare R2 (المخزن السحابي الافتراضي).
      { protocol: "https", hostname: "**.r2.dev" },
      // نطاق الموقع نفسه — تُخدَم منه الصورة الافتراضية (placeholder.webp).
      { protocol: "https", hostname: "maskani.homes" },
    ],
    formats: ["image/avif", "image/webp"],
    // ⚠️ **تحسين الصور مُعطَّل عمداً.** صور العقارات تصل **WebP ومحجَّمة
    // 750px** من خطّ الاستيراد نفسه، وتُخدَم من R2 خلف شبكة Cloudflare —
    // فطبقة تحسينٍ إضافية تُعيد تشفير ما هو مشفَّر سلفاً وتُضيف عنق زجاجة بلا
    // مقابل مرئيّ (وقد عطّلت الصور فعلاً حين نفدت حصّتها). و`fill`/`sizes`
    // في المكوّنات تبقى عاملةً كما هي.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // apple-app-site-association بلا امتداد → نضبط نوعه JSON صراحةً.
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        // ⚠️ **خريطة الموقع تُبنى عند كل طلب — ١١٫٣ ثانية و٢٧٠ ك.ب.**
        // `force-dynamic` ضروريّ (البناء يسقط دونه مع نموّ العقارات)، لكنّه
        // يعني إعادة بناء الملفّ نفسه لكل زاحفٍ يطلبه — وهو أكثر من يطلبه.
        // هذه الترويسة تجعل الحافّة تخدم النسخة المخزّنة وتُجدّدها في الخلفية:
        // التوليد يبقى عند الطلب، والكلفة تُدفع مرّةً في الساعة لا مع كل زائر.
        source: "/sitemap.xml",
        headers: [{
          key: "Cache-Control",
          value: "public, s-maxage=3600, stale-while-revalidate=86400",
        }],
      },
    ];
  },
  async redirects() {
    // بعد إعادة تسمية الكيان listing → property، نحوّل المسارات القديمة (روابط
    // محفوظة/مفهرسة في Google) إلى الجديدة تحويلاً دائماً (301) حفاظاً على SEO.
    return [
      // توحيد النطاق: www → apex (301) — يمنع ازدواج المحتوى («صفحة بديلة canonical»)
      // ويُوحّد إشارات الفهرسة على https://maskani.homes.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.maskani.homes" }],
        destination: "https://maskani.homes/:path*",
        permanent: true,
      },
      // صفحة /download أُلغيت — أزرار التحميل صارت في الفوتر. نحوّل الرابط القديم للرئيسية.
      { source: "/download", destination: "/", permanent: true },
      { source: "/listings", destination: "/properties", permanent: true },
      { source: "/listings/:path*", destination: "/properties/:path*", permanent: true },
      { source: "/admin/listings", destination: "/admin/properties", permanent: true },
      { source: "/admin/listings/:path*", destination: "/admin/properties/:path*", permanent: true },
    ];
  },
};

// Sentry يغلّف الإعداد ليرفع خرائط المصدر (بلا SENTRY_AUTH_TOKEN يتخطّاها بهدوء).
// لا نستخدم tunnelRoute: مسار النفق لا يتولّد مع Turbopack في هذا الإصدار، فتركه
// يوهم بحماية من حاجبات الإعلانات غير قائمة فعلاً.
export default withSentryConfig(nextConfig, {
  org: "maskani-61",
  project: "maskani-web",
  silent: true,
});
