import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SimilarProperties from "@/components/properties/SimilarProperties";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

const OFFER_LABELS: Record<string, string> = {
  sale: "للبيع", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي",
};

async function getProperty(id: string) {
  try {
    // no_count=1 كي لا نُضاعف عدّ الزيارات عند التصيير الخادمي.
    // no-store: يجعل التصيير ديناميكياً كي يعمل notFound() ويُرجع 404 حقيقي (بدل
    // 200 مع ISR)؛ ضروري لتفادي soft-404 على العقارات المحذوفة/غير الموجودة.
    const res = await fetch(`${API}/properties/${id}/?no_count=1`, { cache: "no-store" });
    if (res.status === 404) return "NOT_FOUND";
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// بيانات SEO/المشاركة الديناميكية للعقار (خادمية) — تستخدم ميتا الـAI إن توفّرت.
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const l = await getProperty(id);
  if (!l || l === "NOT_FOUND") return {};
  const title: string = l.meta_title || (l.city_name ? `${l.title} — ${l.city_name}` : l.title);
  const description: string | undefined =
    l.meta_description || (l.description || "").slice(0, 160) || undefined;
  const keywords: string | undefined = l.meta_keywords || undefined;
  // صورة المشاركة: صورة العقار إن وُجدت، وإلا صورة الهوية الافتراضية — كي لا تظهر
  // البطاقة بلا صورة في السوشيال/فهرسة صور جوجل عند العقارات بلا صور.
  const ogImage = l.main_image || `${BASE}/og.webp`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${BASE}/properties/${id}` },
    openGraph: { title, description, images: [{ url: ogImage }], type: "article", url: `${BASE}/properties/${id}` },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const l = await getProperty(id);
  if (l === "NOT_FOUND") notFound(); // 404 حقيقي بدل soft-404 (عقار محذوف/غير موجود)

  // خصائص العقار القابلة للقياس (غرف/حمّامات/مساحة) — تُعرض كمواصفات في نتائج البحث.
  const additionalProperty = l
    ? [
        l.rooms != null && { "@type": "PropertyValue", name: "غرف", value: l.rooms },
        l.bathrooms != null && { "@type": "PropertyValue", name: "حمّامات", value: l.bathrooms },
        l.area != null && { "@type": "PropertyValue", name: "المساحة", value: l.area, unitText: "متر مربع" },
      ].filter(Boolean)
    : [];

  const jsonLd = l
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: l.title,
        description: (l.meta_description || l.description || "").slice(0, 300),
        image: l.main_image ? [l.main_image] : undefined,
        category: l.property_type,
        ...(additionalProperty.length ? { additionalProperty } : {}),
        offers: {
          "@type": "Offer",
          price: l.price,
          priceCurrency: l.currency || "YER",
          availability: "https://schema.org/InStock",
          url: `${BASE}/properties/${id}`,
          ...(l.offer_type ? { name: OFFER_LABELS[l.offer_type] ?? l.offer_type } : {}),
        },
        brand: { "@type": "Brand", name: "مسكني" },
        ...(l.city_name ? { areaServed: l.city_name } : {}),
      }
    : null;

  // مخطّط عقاري متخصّص (RealEstateProperty) — إشارة أدقّ لمحرّكات البحث من Product وحده.
  const realEstate = l
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateProperty",
        name: l.title,
        url: `${BASE}/properties/${id}`,
        description: (l.meta_description || l.description || "").slice(0, 300),
        image: l.main_image ? [l.main_image] : undefined,
        datePosted: l.created_at || undefined,
        ...(l.city_name || l.address
          ? {
              address: {
                "@type": "PostalAddress",
                addressCountry: "YE",
                ...(l.city_name ? { addressLocality: l.city_name } : {}),
                ...(l.address ? { streetAddress: l.address } : {}),
              },
            }
          : {}),
        ...(l.latitude != null && l.longitude != null
          ? { geo: { "@type": "GeoCoordinates", latitude: l.latitude, longitude: l.longitude } }
          : {}),
        ...(l.rooms != null ? { numberOfRooms: l.rooms } : {}),
        ...(l.area != null
          ? { floorSize: { "@type": "QuantitativeValue", value: l.area, unitCode: "MTK" } }
          : {}),
        offers: {
          "@type": "Offer",
          price: l.price,
          priceCurrency: l.currency || "YER",
          availability: "https://schema.org/InStock",
        },
      }
    : null;

  const breadcrumb = l
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "العقارات", item: `${BASE}/properties` },
          { "@type": "ListItem", position: 3, name: l.title, item: `${BASE}/properties/${id}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {realEstate && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstate) }} />
      )}
      {breadcrumb && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      )}
      {children}
      {/* روابط داخلية خادمية للصفحات العميقة — تُحسّن اكتشاف/فهرسة العقارات. */}
      <SimilarProperties id={id} />
    </>
  );
}
