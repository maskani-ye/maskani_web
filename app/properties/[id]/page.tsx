import { notFound } from "next/navigation";
import type { Property } from "@/types";
import PropertyDetailClient from "./PropertyDetailClient";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// خادمي — يجلب العقار ويُصيّره فورًا (المحتوى في HTML الخام: العنوان/السعر/الوصف/
// المواصفات) ثم يسلّمه للجزيرة التفاعلية. no_count=1: التصيير الخادمي لا يزيد عدّاد
// الزيارات (العميل يعدّها عبر تحميله). no-store: تصيير ديناميكي كي يعمل 404 الحقيقي.
async function getProperty(id: string): Promise<Property | "NOT_FOUND" | null> {
  try {
    const res = await fetch(`${API}/properties/${id}/?no_count=1`, { cache: "no-store" });
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
