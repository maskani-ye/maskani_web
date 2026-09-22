import { notFound } from "next/navigation";
import type { Property } from "@/types";
import PropertyDetailClient from "./PropertyDetailClient";

/**
 * ⚠️ درسٌ من عطل حيّ (2026-08-23): بُني الويب بينما كانت القاعدة ساقطة، فثُبِّتت
 * صفحاتٌ على **404 دائم** وزارها جوجل فسجّلها «غير موجودة». بلا `revalidate` لا
 * تُعيد الصفحة المحاولة أبداً مهما تعافى الخادم — فيتحوّل عطلٌ عابر إلى ضرر
 * دائم في نتائج البحث.
 */
export const revalidate = 3600;


const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// خادمي — يجلب العقار ويُصيّره فورًا (المحتوى في HTML الخام: العنوان/السعر/الوصف/
// المواصفات) ثم يسلّمه للجزيرة التفاعلية. no_count=1: التصيير الخادمي لا يزيد عدّاد
// الزيارات (العميل يعدّها عبر تحميله).
//
// ⚠️ **كانت `cache: "no-store"` — وثمنها أنّ كل زيارةٍ لأيّ عقار تُصيَّر من
// الصفر.** كُتبت كي يعمل ٤٠٤ الحقيقيّ، وهي نيّةٌ سليمة بثمنٍ باهظ: الجلب بلا
// تخزين يُحوّل الصفحة كلّها إلى ديناميكية ويُلغي `revalidate` المعلنة أعلاه.
// والقياس الحيّ (2026-09-22): ٤٫٧ ثانية للطلب الواحد، و**٨٠٩ طلباً يومياً
// تُقتل لتجاوزها سقف المعالجة** — أي زائرٌ لا تُفتح له الصفحة. وصفحة العقار
// أكثر صفحات الموقع زيارةً (٦٬٨٠٧ عقاراً).
//
// والتخزين لساعة يحفظ الهدفين: ٤٠٤ يبقى ٤٠٤ حقيقياً، لكنّه **يُعاد فحصه بعد
// ساعة** — فعطلٌ عابر في الخادم لا يتحوّل إلى ضرر دائم كما وقع في 2026-08-23،
// وهو الخوف الذي كُتبت `no-store` من أجله أصلاً.
async function getProperty(id: string): Promise<Property | "NOT_FOUND" | null> {
  try {
    const res = await fetch(`${API}/properties/${id}/?no_count=1`,
                            { next: { revalidate: 3600 } });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return (await res.json()) as Property;
  } catch {
    return null;
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (property === "NOT_FOUND") notFound(); // 404 حقيقي (عقار محذوف/غير موجود)
  // بعد notFound()، النوع هنا Property | null — خطأ شبكة عابر يمرّر null وتتكفّل
  // الجزيرة بإعادة المحاولة عميلًا.
  return <PropertyDetailClient id={id} initialProperty={property} />;
}
