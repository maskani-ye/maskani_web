import { Suspense } from "react";
import PropertiesListClient from "./PropertiesListClient";
import PropertiesCityLinks from "@/components/properties/PropertiesCityLinks";
import SectionIntro from "@/components/SectionIntro";

// قشرة خادمية رفيعة: كتلة تعريفية فريدة (h1 + وصف) + القائمة التفاعلية (عميل) داخل
// حدّ Suspense (تستخدم useSearchParams) + كتلة روابط المحافظات المُصيَّرة خادميًا.
export default function PropertiesPage() {
  return (
    <>
      <SectionIntro title="عقارات للبيع والإيجار في اليمن">
        تصفّح أحدث العقارات في اليمن على منصّة مسكني: شقق وفلل وأراضٍ ومحلات تجارية للبيع
        والإيجار في صنعاء وعدن وتعز وإب والحديدة وسائر المحافظات، مع الأسعار والصور والموقع
        على الخريطة، وتواصل مباشر مع أصحاب العقارات بلا عمولات.
      </SectionIntro>
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">جارِ التحميل…</div>}>
        <PropertiesListClient />
      </Suspense>
      <PropertiesCityLinks />
    </>
  );
}
