import { NextResponse } from "next/server";

/**
 * صيغة نصّية لصفحة العقار — لِما لا يقرأ HTML.
 *
 * ⚠️ **الصفحة الكاملة ٢٠٠ ك.ب من HTML لعشرة أسطرٍ من معلومة.** والمساعد الذي
 * يجلب صفحةً يدفع ذلك كلّه من نافذته ثمّ يستخرج منه سطراً — وكثيرٌ منها يفشل
 * في الاستخراج أصلاً فيهلوس السعر أو المدينة. هذه الصيغة تعطيه ما يحتاجه
 * مباشرةً: حقائق مرتّبة ورابطٌ يحيل إليه.
 *
 * ⚠️ **ولا تُغني عن الصفحة بل تقود إليها.** أوّل سطرٍ وآخره رابط الصفحة
 * الحقيقية — الغرض أن يقتبس المساعد بدقّة **ويرسل المستخدم إلينا**، لا أن
 * يستبدلنا بنصٍّ مجرّد.
 */
export const revalidate = 3600;
export const dynamicParams = true;

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const SITE = "https://maskani.homes";

const OFFER: Record<string, string> = {
  sale: "للبيع", rent_monthly: "للإيجار الشهري", rent_yearly: "للإيجار السنوي",
};
const CUR: Record<string, string> = {
  YER: "ريال يمني", YEA: "ريال يمني (عدن)", SAR: "ريال سعودي", JOD: "دينار أردني",
  EGP: "جنيه مصري", IQD: "دينار عراقي", OMR: "ريال عُماني", USD: "دولار",
};

interface P {
  id: number; title: string; description?: string; price?: string; currency?: string;
  price_usd?: string; area?: string; rooms?: number | null; bathrooms?: number | null;
  offer_type?: string; city_name?: string; neighborhood?: string; address?: string;
  property_type_name?: string; contact_phone?: string; created_at?: string;
  latitude?: string | null; longitude?: string | null; images?: { image: string }[];
  main_image?: string | null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetch(`${API}/properties/${id}/`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return new NextResponse("العقار غير موجود.", { status: 404 });
  }
  const p: P = await res.json();
  const url = `${SITE}/properties/${p.id}`;
  const money = (v?: string, c?: string) =>
    v && Number(v) > 0 ? `${Number(v).toLocaleString("en-US")} ${CUR[c || ""] || c || ""}` : null;

  const rows: [string, string | null][] = [
    ["النوع", p.property_type_name || null],
    ["العرض", OFFER[p.offer_type || ""] || null],
    ["المدينة", p.city_name || null],
    ["الحي", p.neighborhood || null],
    ["العنوان", p.address || null],
    ["السعر", money(p.price, p.currency)],
    ["السعر بالدولار (للمقارنة)", money(p.price_usd, "USD")],
    ["المساحة", p.area && Number(p.area) > 0 ? `${Number(p.area)} م²` : null],
    ["الغرف", p.rooms ? String(p.rooms) : null],
    ["دورات المياه", p.bathrooms ? String(p.bathrooms) : null],
    ["رقم التواصل", p.contact_phone || null],
    ["الإحداثيات", p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : null],
    ["تاريخ النشر", p.created_at ? p.created_at.slice(0, 10) : null],
    ["الصور", String((p.images?.length ?? (p.main_image ? 1 : 0)))],
  ];

  const md = [
    `# ${p.title}`,
    "",
    `المصدر: ${url}`,
    "",
    ...rows.filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${v}`),
    "",
    ...(p.description ? ["## الوصف", "", p.description, ""] : []),
    "---",
    "",
    `للصور والتواصل المباشر مع المُعلِن: ${url}`,
    `المزيد من عقارات ${p.city_name || "المنطقة"}: ${SITE}/properties/city/`,
  ].join("\n");

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
