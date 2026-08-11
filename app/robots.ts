import type { MetadataRoute } from "next";

// توجيهات الزحف — نمنع أرشفة الصفحات الخاصّة/المصادَق عليها.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/chat",
          "/profile",
          "/favorites",
          "/notifications",
          "/services/my",
          "/properties/create",
          "/requests/create",
          "/jobs/create",
          "/reports/create",
        ],
      },
    ],
    sitemap: "https://maskani.homes/sitemap.xml",
    host: "https://maskani.homes",
  };
}
