import type { Metadata } from "next";
import { Suspense } from "react";
import LocationClient from "./LocationClient";

/**
 * شاشة تحديد الموقع — بوّابة الشاشات المعتمدة على السوق.
 *
 * ⚠️ **`noindex` إلزاميّ**: هذه شاشة إعداد لا محتوى، وفهرستها تُنافس الصفحات
 * الحقيقية على استعلامات العلامة. و`follow` تبقى كي تمرّ قوّة الروابط.
 */
export const metadata: Metadata = {
  title: "اختر موقعك",
  description: "حدّد دولتك ومدينتك لعرض العقارات والخدمات المتاحة حولك.",
  robots: { index: false, follow: true },
};

export default function LocationPage() {
  // ⚠️ `Suspense` لازمة: المكوّن يقرأ `?next=` بـ`useSearchParams`، وبلا حدٍّ
  // فاصل يفشل البناء (`missing-suspense-with-csr-bailout`) لأن Next لا يستطيع
  // توليد الصفحة ساكنةً وهي تعتمد على استعلامٍ لا يُعرف إلا وقت الطلب.
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LocationClient />
    </Suspense>
  );
}
