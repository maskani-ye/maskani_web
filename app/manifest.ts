import type { MetadataRoute } from "next";

// بيان تطبيق الويب (PWA) — يجعل الموقع قابلاً للتثبيت على الهواتف ويُحسّن إشارات
// الجوّال في محرّكات البحث. الألوان من هوية مسكني.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مسكني — المنصة العقارية الاجتماعية",
    short_name: "مسكني",
    description:
      "منصة عقارية اجتماعية في اليمن — بيع وإيجار العقارات، خدمات، طلبات، ومجتمع لمكافحة الاحتيال العقاري.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F6F0",
    theme_color: "#2D6A4F",
    lang: "ar",
    dir: "rtl",
    categories: ["business", "shopping", "lifestyle"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
