import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  async headers() {
    return [
      {
        // apple-app-site-association بلا امتداد → نضبط نوعه JSON صراحةً.
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
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
