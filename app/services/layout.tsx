import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/seo";

// بيانات وصفية على مستوى الخادم لقسم «services» (صفحة القائمة). صفحات التفاصيل
// (`[id]`) تتجاوزها عبر generateMetadata الخاصّة بها.
export const metadata: Metadata = sectionMetadata("services");

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
