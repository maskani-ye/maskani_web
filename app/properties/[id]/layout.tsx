import type { Metadata } from "next";

import { NUMERIC_LOCALE } from "@/lib/utils";
import { notFound } from "next/navigation";
import SimilarProperties from "@/components/properties/SimilarProperties";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

/** معرّف فيديو يوتيوب — نسخة خادمية خفيفة من منطق المشغّل. */
function videoIdOf(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?[^ ]*\bv=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/** صورة العقار الرئيسية. تفصيل مهم: استجابة **التفاصيل** لا تحمل `main_image`
 *  (هو حقل استجابة القائمة فقط) بل `images[]` — فكانت كل صفحة عقار تُصدّر صورة
 *  الهوية الافتراضية بدل صورة العقار في المشاركة وفي البيانات المنظَّمة. */
function imageOf(l: any): string | null {
  if (l?.main_image) return l.main_image;
  const imgs = Array.isArray(l?.images) ? l.images : [];
  const main = imgs.find((i: any) => i?.is_main) || imgs[0];
  return main?.image || null;
}

/** اسم نوع العقار نصّاً — الحقل `category` يقبل نصّاً فقط، وواجهة الـAPI
 *  تُرجعه كائناً `{id, name_ar, icon}`؛ تمريره كما هو كان يُنتج
 *  «نوع الكائن غير صالح في الحقل category». */
function propertyTypeName(l: any): string | undefined {
  const t = l?.property_type;
  if (!t) return undefined;
  return typeof t === "string" ? t : (t.name_ar || t.name || undefined);
}

/** وصفٌ لا يكون فارغاً أبداً: نصّ صاحب العقار إن وُجد، وإلا جملة مُركَّبة من
 *  خصائصه الفعلية (نوع · مدينة · غرف · مساحة) — أفضل من حقل ناقص. */
function descriptionOf(l: any): string {
  const written = (l?.meta_description || l?.description || "").trim();
  if (written) return written.slice(0, 300);
  const parts = [
    propertyTypeName(l),
    l?.city_name ? `في ${l.city_name}` : null,
    l?.rooms != null ? `${l.rooms} غرف` : null,
    l?.bathrooms != null ? `${l.bathrooms} حمّامات` : null,
    l?.area != null ? `مساحة ${l.area} م²` : null,
  ].filter(Boolean);
  return (parts.length ? `${l?.title} — ${parts.join(" · ")}` : String(l?.title || "عقار")).slice(0, 300);
}

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
  // ⚠️ **عناوين متطابقة على صفحاتٍ مختلفة.**
  //
  // قياس 2026-09-01: **226 عقاراً** تتشارك عنواناً وحرفياً مع عقارٍ آخر في
  // المدينة نفسها — «شقة للبيع في شارع ناردين» خمس مرّات. وهي وحداتٌ مختلفة
  // فعلاً (أسعارها ومساحاتها تختلف)، لكنّ جوجل يرى خمس صفحات بعنوان `<title>`
  // واحد فيقيسها تكراراً ويطوي أربعاً منها.
  //
  // التمييز يأتي ممّا **يفرّقها حقاً**: المساحة والسعر — وهما ما يبحث عنه
  // القارئ أصلاً، فالعنوان يصير أنفع لا أطول فحسب.
  const marks = [
    l.area ? `${Number(l.area).toLocaleString(NUMERIC_LOCALE)} م²` : "",
    l.city_name || "",
  ].filter(Boolean);
  const title: string =
    l.meta_title || [l.title, ...marks].join(" — ");
  const description: string | undefined =
    l.meta_description || (l.description || "").slice(0, 160) || undefined;
  const keywords: string | undefined = l.meta_keywords || undefined;
  // صورة المشاركة: صورة العقار إن وُجدت، وإلا صورة الهوية الافتراضية — كي لا تظهر
  // البطاقة بلا صورة في السوشيال/فهرسة صور جوجل عند العقارات بلا صور.
  const ogImage = imageOf(l) || `${BASE}/og.webp`;
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

  // ملاحظة: لا مخطّط `Product` هنا عمداً. العقار ليس سلعة تُشحن، ومخطّط
  // «بيانات التاجر» يطالبه بـ shippingDetails و hasMerchantReturnPolicy ولا
  // يؤهّله لأي نتيجة ثرية — فكان يولّد تحذيرات Search Console بلا مقابل.
  // البديل الصحيح: RealEstateProperty أدناه، وهو التمثيل الدلالي الدقيق.

  // مخطّط عقاري متخصّص (RealEstateProperty) — إشارة أدقّ لمحرّكات البحث من Product وحده.
  const realEstate = l
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateProperty",
        name: l.title,
        url: `${BASE}/properties/${id}`,
        // وصف لا يكون فارغاً أبداً: يُركَّب من خصائص العقار حين لا يكتب صاحبه شيئاً.
        description: descriptionOf(l),
        // صورة إلزامية: صورة العقار، وإلا صورة الهوية — «الحقل image غير مضمَّن»
        // كان أخطر تحذير لأنه يمنع ظهور الصفحة أصلاً.
        image: [imageOf(l) || `${BASE}/og.webp`],
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
        // عرضٌ بلا سعر مخطّطٌ غير صالح — نُسقطه كاملاً عند غياب السعر
        // (كثير من العقارات تُنشر بسعر «عند التواصل»).
        ...(l.price != null && l.price !== ''
          ? {
              offers: {
                "@type": "Offer",
                price: String(l.price),
                priceCurrency: l.currency || "YER",
                availability: "https://schema.org/InStock",
                url: `${BASE}/properties/${id}`,
                ...(l.offer_type ? { name: OFFER_LABELS[l.offer_type] ?? l.offer_type } : {}),
              },
            }
          : {}),
        ...(additionalProperty.length ? { additionalProperty } : {}),
        ...(propertyTypeName(l) ? { category: propertyTypeName(l) } : {}),
      }
    : null;

  // VideoObject — يجعل الفيديو مؤهّلاً لظهور مصغّرة مقطع في نتائج جوجل، وهو
  // أبرز ما يميّز إعلاناً عن آخر في صفحة النتائج.
  const videoId = videoIdOf(l?.video_url);
  const videoLd = videoId
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: `جولة مصوّرة — ${l.title}`,
        description: (l.meta_description || l.description || l.title || "").slice(0, 300),
        thumbnailUrl: [`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`],
        uploadDate: l.created_at || undefined,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        contentUrl: l.video_url,
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
      {realEstate && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstate) }} />
      )}
      {videoLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} />
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
