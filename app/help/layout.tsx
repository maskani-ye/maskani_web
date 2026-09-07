import type { Metadata } from "next";

/**
 * ⚠️ **`/help` صفحة عميل (`"use client"`) فلا تصدّر `metadata`.** فورثت
 * القانونيّة من الغلاف الجذر — الذي كان يقول `canonical: "/"` — فأعلنت أنّها
 * نسخةٌ من الصفحة الرئيسية، ولم تُفهرَس قطّ. الغلاف هنا يعطيها هويّتها.
 */
export const metadata: Metadata = {
  title: "مركز المساعدة — مسكني",
  description:
    "إجابات فورية عن استخدام مسكني: نشر العقارات، الطلبات، الخدمات، "
    + "التواصل مع الملّاك، والإبلاغ عن الاحتيال العقاري.",
  alternates: { canonical: "/help" },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
