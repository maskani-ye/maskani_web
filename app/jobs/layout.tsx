import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/seo";

// بيانات وصفية على مستوى الخادم لقسم «jobs» (صفحة القائمة). صفحات التفاصيل
// (`[id]`) تتجاوزها عبر generateMetadata الخاصّة بها.
export const metadata: Metadata = sectionMetadata("jobs");

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
