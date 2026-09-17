import type { Metadata } from "next";

/**
 * صفحة خاصّة: تُزحف ولا تُفهرس.
 *
 * ⚠️ **كانت محظورة في `robots.txt`، وهذا ما أوقعنا في العطل.** صفحاتنا العامّة
 * تربط إلى هذا المسار، فيصل جوجل من الرابط ولا يستطيع قراءة الصفحة، فيفهرس
 * عنوانها بلا محتوى («تمت فهرسة الصفحة رغم حظرها بـrobots.txt» — 2026-09-17).
 * والممنوع من الزحف لا يُقرأ منه `noindex` أبداً، فلا سبيل لإخراجه من الفهرس.
 * الآن: الزحف مسموح، والإعلان هنا صريح. الصفحة عميلة (`"use client"`) فلا
 * تُصدِّر `metadata`، ولذلك يقع الإعلان في التخطيط.
 */
export const metadata: Metadata = {
  title: "طلب عقار",
  robots: { index: false, follow: false },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
