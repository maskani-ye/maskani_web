import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const BASE = "https://maskani.homes";

async function getService(id: string) {
  try {
    const res = await fetch(`${API}/services/${id}/`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const s = await getService(id);
  if (!s) return {};
  const title: string = s.meta_title || s.title || "خدمة";
  const description: string | undefined =
    s.meta_description || (s.description || "").slice(0, 160) || undefined;
  const keywords: string | undefined = s.meta_keywords || undefined;
  const img = s.portfolio?.[0]?.image || s.user_avatar || undefined;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${BASE}/services/${id}` },
    openGraph: { title, description, images: img ? [{ url: img }] : undefined, type: "profile", url: `${BASE}/services/${id}` },
    twitter: { card: "summary", title, description, images: img ? [img] : undefined },
  };
}

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const s = await getService(id);

  const categoryName =
    s && typeof s.category === "object" && s.category ? s.category.name_ar : undefined;

  const jsonLd = s
    ? {
        "@context": "https://schema.org",
        "@type": "Service",
        name: s.title,
        description: (s.meta_description || s.description || "").slice(0, 300),
        serviceType: categoryName,
        provider: {
          "@type": "LocalBusiness",
          name: s.title,
          ...(s.average_rating
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: s.average_rating,
                  reviewCount: s.reviews_count ?? 0,
                },
              }
            : {}),
        },
        ...(s.cities_names?.length ? { areaServed: s.cities_names } : {}),
        url: `${BASE}/services/${id}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  );
}
