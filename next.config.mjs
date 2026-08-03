/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // وسائط الباك اند (صور الإعلانات/الخدمات/الأفاتار) تُخدَم من هذا النطاق.
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
};

export default nextConfig;
