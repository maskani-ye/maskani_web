import type { Metadata } from "next";
import { Suspense } from "react";
import { citySlug } from "@/lib/seo";
import PropertiesListClient from "./PropertiesListClient";
import LatestProperties from "@/components/properties/LatestProperties";
import SectionIntro from "@/components/SectionIntro";

// قشرة خادمية رفيعة: كتلة تعريفية فريدة (h1 + وصف) + القائمة التفاعلية (عميل) داخل
// حدّ Suspense (تستخدم useSearchParams) + كتلة روابط المحافظات المُصيَّرة خادميًا.
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

/**
 * قانونيّ ديناميكيّ للقائمة المفلترة.
 *
 * المشكلة التي يحلّها: روابط مثل `/properties?city=5` يصل إليها الزاحف من
 * روابطنا الداخلية، وكانت كلّها تُشير قانونياً إلى `/properties` المجرّدة —
 * فيُصنّفها جوجل «صفحة بديلة» ويهدر عليها زحفاً بلا فائدة. الأصحّ أن تُشير
 * إلى صفحة المحافظة المخصّصة (`/properties/city/ibb`) التي تحمل المحتوى نفسه
 * وأقوى، فتتجمّع إشارات الترتيب عليها بدل أن تتبدّد.
 */
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
): Promise<Metadata> {
  const sp = await searchParams;
  const cityId = Array.isArray(sp.city) ? sp.city[0] : sp.city;
  if (!cityId) return {};
  try {
    const res = await fetch(`${API}/cities/?limit=1000`, { next: { revalidate: 86400 } });
    if (!res.ok) return {};
    const list: { id: number; name_en: string }[] = (await res.json()).results ?? [];
    const city = list.find((c) => String(c.id) === String(cityId));
    const slug = city ? citySlug(city.name_en) : "";
    if (slug) return { alternates: { canonical: `/properties/city/${slug}` } };
  } catch {
    /* الفشل يُبقي القانونيّ الافتراضي من التخطيط — لا يضرّ */
  }
  return {};
}

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
      <LatestProperties />
    </>
  );
}
