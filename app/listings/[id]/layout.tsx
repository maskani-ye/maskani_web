import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

const OFFER_LABELS: Record<string, string> = {
  sale: "للبيع", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي",
};

async function getListing(id: string) {
  try {
    // no_count=1 كي لا نُضاعف عدّ الزيارات عند التصيير الخادمي.
    const res = await fetch(`${API}/listings/${id}/?no_count=1`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// بيانات SEO/المشاركة الديناميكية للإعلان (خادمية) — تستخدم ميتا الـAI إن توفّرت.
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const l = await getListing(id);
  if (!l) return {};
  const title: string = l.meta_title || (l.city_name ? `${l.title} — ${l.city_name}` : l.title);
  const description: string | undefined =
    l.meta_description || (l.description || "").slice(0, 160) || undefined;
  const keywords: string | undefined = l.meta_keywords || undefined;
  const images = l.main_image ? [{ url: l.main_image }] : undefined;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${BASE}/listings/${id}` },
    openGraph: { title, description, images, type: "article", url: `${BASE}/listings/${id}` },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: l.main_image ? [l.main_image] : undefined,
    },
  };
}

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const l = await getListing(id);

  const jsonLd = l
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: l.title,
        description: (l.meta_description || l.description || "").slice(0, 300),
        image: l.main_image ? [l.main_image] : undefined,
        category: l.property_type,
        offers: {
          "@type": "Offer",
          price: l.price,
          priceCurrency: l.currency || "YER",
          availability: "https://schema.org/InStock",
          url: `${BASE}/listings/${id}`,
          ...(l.offer_type ? { name: OFFER_LABELS[l.offer_type] ?? l.offer_type } : {}),
        },
        brand: { "@type": "Brand", name: "مسكني" },
        ...(l.city_name ? { areaServed: l.city_name } : {}),
      }
    : null;

  const breadcrumb = l
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الإعلانات", item: `${BASE}/listings` },
          { "@type": "ListItem", position: 2, name: l.title, item: `${BASE}/listings/${id}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {breadcrumb && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      )}
      {children}
    </>
  );
}
