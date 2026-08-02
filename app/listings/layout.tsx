import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/seo";

// بيانات وصفية على مستوى الخادم لقسم «listings» (صفحة القائمة). صفحات التفاصيل
// (`[id]`) تتجاوزها عبر generateMetadata الخاصّة بها.
export const metadata: Metadata = sectionMetadata("listings");

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
