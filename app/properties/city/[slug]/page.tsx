import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { breadcrumbList, itemList, citySlug, SITE_URL } from "@/lib/seo";
import { formatPrice, propertyTypeName, offerTypeLabels } from "@/lib/utils";
import { PropertyCard } from "@/components/properties/PropertyCard";
import CityGuideLinks from "@/components/properties/CityGuideLinks";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

interface PropertyRow {
  id: number;
  title: string;
  price?: string | number | null;
  currency?: string | null;
  main_image?: string | null;
  property_type?: string;
  offer_type?: string;
  rooms?: number | null;
  area?: number | null;
}

async function getCities(): Promise<City[]> {
  try {
    const res = await fetch(`${API}/cities/?limit=1000`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

async function resolveCity(slug: string): Promise<City | null> {
  const list = await getCities();
  return list.find((c) => citySlug(c.name_en) === slug) ?? null;
}

async function getCityProperties(cityId: number): Promise<{ items: PropertyRow[]; count: number }> {
  try {
    const res = await fetch(`${API}/properties/?city=${cityId}&limit=12&offset=0`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return { items: [], count: 0 };
    const data = await res.json();
    return { items: data.results ?? [], count: data.count ?? 0 };
  } catch {
    return { items: [], count: 0 };
  }
}

// توليد المسارات الثابتة لكل مدينة (أداء أفضل + أرشفة أشمل).
export async function generateStaticParams() {
  const list = await getCities();
  return list.map((c) => ({ slug: citySlug(c.name_en) })).filter((p) => p.slug);
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const city = await resolveCity(slug);
  if (!city) return {};
  // محافظة بلا عقار = صفحة رقيقة. نمنع فهرستها مؤقّتاً (مع follow كي تمرّ الروابط)
  // حتى يُنشر فيها أوّل عقار، فترجع للفهرسة تلقائياً — بلا تدخّل يدويّ.
  const { count: stock } = await getCityProperties(city.id);
  const title = `شقق وأراضٍ للبيع والإيجار في ${city.name_ar} — أرقام الملاك`;
  const description = `عقارات ${city.name_ar} على مسكني: شقق وفلل وأراضٍ ومحلات بالسعر والصور والموقع، ورقم صاحب العقار مباشرةً — بلا سمسار وبلا عمولة.`;
  return {
    title,
    description,
    ...(stock === 0 ? { robots: { index: false, follow: true } } : {}),
    keywords: [
      `عقارات ${city.name_ar}`, `شقق للإيجار ${city.name_ar}`, `شقق للبيع ${city.name_ar}`,
      `أراضي ${city.name_ar}`, `فلل ${city.name_ar}`, "عقارات اليمن",
    ],
    alternates: { canonical: `/properties/city/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/properties/city/${slug}`,
      siteName: "مسكني",
      locale: "ar_AR",
      type: "website",
      images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني" }],
    },
  };
}

export default async function CityPropertiesPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();

  const { items, count } = await getCityProperties(city.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd
        data={breadcrumbList([
          { name: "الرئيسية", path: "/" },
          { name: "العقارات", path: "/properties" },
          { name: `عقارات ${city.name_ar}`, path: `/properties/city/${slug}` },
        ])}
      />
      {items.length > 0 && (
        <JsonLd
          data={itemList(
            `عقارات في ${city.name_ar}`,
            items.map((l) => `/properties/${l.id}`),
          )}
        />
      )}
      <Breadcrumbs
        items={[
          { name: "الرئيسية", href: "/" },
          { name: "العقارات", href: "/properties" },
          { name: `عقارات ${city.name_ar}` },
        ]}
      />

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          عقارات في {city.name_ar}
        </h1>
        <p className="text-gray-600 mt-2 leading-relaxed max-w-3xl">
          استكشف {count > 0 ? `${count} ` : ""}عقاراً في {city.name_ar} على منصّة مسكني —
          شقق وفلل وأراضٍ ومحلات تجارية للبيع والإيجار، مع الأسعار والصور والموقع على الخريطة،
          وتواصل مباشر مع أصحاب العقارات بلا عمولات.
        </p>
        <Link
          href={`/properties?city=${city.id}`}
          className="inline-flex items-center gap-2 mt-4 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          تصفّح كل عقارات {city.name_ar} مع الفلاتر
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-lg font-bold text-ink mb-2">
            لا يوجد عقار معروض في {city.name_ar} بعد
          </p>
          <p className="text-gray-600 text-sm leading-relaxed max-w-xl mx-auto mb-5">
            كن أوّل من ينشر هنا: إعلانك سيكون وحيداً في صفحة {city.name_ar} فيراه كل
            من يبحث عن عقار في المحافظة. النشر مجّاني بلا عمولة، ويصلك الباحث على
            رقمك مباشرة.
          </p>
          <Link
            href="/properties/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            أضِف عقارك في {city.name_ar} مجاناً
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((l) => (
            <PropertyCard key={l.id} property={{ ...l, city_name: city.name_ar }} />
          ))}
        </div>
      )}

      <CityGuideLinks cityName={city.name_ar} />
    </div>
  );
}
