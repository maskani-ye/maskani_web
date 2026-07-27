/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // وسائط الباك اند (صور الإعلانات/الخدمات/الأفاتار) تُخدَم من هذا النطاق.
    remotePatterns: [
      { protocol: "https", hostname: "api.maskani.homes" },
      // وسائط Supabase Storage (المخزن السحابي الافتراضي الجديد).
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
