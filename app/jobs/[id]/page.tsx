import { notFound } from "next/navigation";
import JobDetailClient, { type ServiceRequest } from "./JobDetailClient";

/**
 * ⚠️ درسٌ من عطل حيّ (2026-08-23): بُني الويب بينما كانت القاعدة ساقطة، فثُبِّتت
 * صفحاتٌ على **404 دائم** وزارها جوجل فسجّلها «غير موجودة». بلا `revalidate` لا
 * تُعيد الصفحة المحاولة أبداً مهما تعافى الخادم — فيتحوّل عطلٌ عابر إلى ضرر
 * دائم في نتائج البحث.
 */
export const revalidate = 3600;


const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

// خادمي — يجلب طلب الخدمة ويُصيّره فورًا (محتوى في HTML الخام) ثم يُسلّمه للجزيرة.
async function getJob(id: string): Promise<ServiceRequest | "NOT_FOUND" | null> {
  try {
    const res = await fetch(`${API}/jobs/${id}/`, { cache: "no-store" });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return (await res.json()) as ServiceRequest;
  } catch {
    return null;
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getJob(id);
  if (request === "NOT_FOUND") notFound();
  return <JobDetailClient id={id} initialRequest={request} />;
}
