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
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
