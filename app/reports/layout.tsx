import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/seo";

// بيانات وصفية على مستوى الخادم لقسم «reports» (صفحة القائمة). صفحات التفاصيل
// (`[id]`) تتجاوزها عبر generateMetadata الخاصّة بها.
export const metadata: Metadata = sectionMetadata("reports");

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
