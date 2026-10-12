import type { Metadata } from "next";
import { AssistantChat } from "@/components/ai/AssistantChat";

/**
 * «مساعد مسكني» — صفحة محادثة لا محتوى ثابتاً فيها.
 *
 * ⚠️ **noindex مع السماح بالزحف:** ما يُصيَّر للزاحف شاشةُ إدخالٍ فارغة، ولا
 * قيمة لها في نتائج البحث — وأدسنس يعدّ الشاشات بلا محتوى ناشرٍ «منخفضة
 * القيمة». والحظر في robots يمنع جوجل من قراءة noindex نفسه.
 */
export const metadata: Metadata = {
  title: "مساعد مسكني — ابحث بكلامك",
  description: "اكتب ما تبحث عنه من عقارٍ أو خدمة بكلامك، ويعرض لك مساعد مسكني ما يناسبك من الإعلانات.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/assistant" },
};

export default function AssistantPage() {
  return <AssistantChat />;
}
