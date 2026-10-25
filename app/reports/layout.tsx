import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/seo";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// بيانات وصفية على مستوى الخادم لقسم «reports» (صفحة القائمة). صفحات التفاصيل
// (`[id]`) تتجاوزها عبر generateMetadata الخاصّة بها.
//
// ⚠️ **لا تُفهرَس القائمة ما دامت بلا بلاغ** (2026‑10‑25): صفحةٌ عنوانها «مجتمع»
// ومحتواها صفر هي «شاشة بلا محتوى ناشر» بتعريف سياسة أدسنس. تعود تلقائياً بأوّل بلاغ.
export async function generateMetadata(): Promise<Metadata> {
  const base = sectionMetadata("reports");
  let count = 1; // فشلُ الجلب لا يُخرج الصفحة من الفهرس
  try {
    const res = await fetch(`${API}/reports/?limit=1`, { next: { revalidate: 3600 } });
    if (res.ok) count = (await res.json()).count ?? 1;
  } catch {
    /* يبقى الافتراضي */
  }
  return count > 0 ? base : { ...base, robots: { index: false, follow: true } };
}

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
