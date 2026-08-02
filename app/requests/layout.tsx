import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/seo";

// بيانات وصفية على مستوى الخادم لقسم «requests» (صفحة القائمة). صفحات التفاصيل
// (`[id]`) تتجاوزها عبر generateMetadata الخاصّة بها.
export const metadata: Metadata = sectionMetadata("requests");

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
