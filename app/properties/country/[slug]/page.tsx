import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { breadcrumbList, itemList, citySlug, SITE_URL } from "@/lib/seo";
import { PropertyCard } from "@/components/properties/PropertyCard";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface CityRow {
  id: number;
  name_ar: string;
  name_en: string;
  image?: string | null;
}

interface CountryRow {
  id: number;
  name_ar: string;
  name_en: string;
  code: string;
  slug: string;
  flag_emoji?: string;
  properties_count?: number;
  cities?: CityRow[];
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
  city_name?: string;
}

async function getCountries(): Promise<CountryRow[]> {
  try {
    const res = await fetch(`${API}/cities/countries/?limit=100`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

async function resolveCountry(slug: string): Promise<CountryRow | null> {
  const list = await getCountries();
  return list.find((c) => c.slug === slug) ?? null;
}

async function getCountryProperties(
  code: string,
): Promise<{ items: PropertyRow[]; count: number }> {
  try {
    const res = await fetch(`${API}/properties/?country=${code}&limit=12&offset=0`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return { items: [], count: 0 };
    const data = await res.json();
    return { items: data.results ?? [], count: data.count ?? 0 };
  } catch {
    return { items: [], count: 0 };
  }
}

async function countOf(path: string, code: string): Promise<number> {
  try {
    const res = await fetch(`${API}/${path}/?country=${code}&limit=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    return (await res.json()).count ?? 0;
  } catch {
    return 0;
  }
}

/** الكلمات الدلالية تُبنى من اسم الدولة **وأسماء مدنها**: الباحث العربي يكتب
 *  «شقق للإيجار في صنعاء» لا «عقارات اليمن»، فالذيل الطويل هو ما يجلب الزيارة. */
function keywordsFor(country: CountryRow, cities: CityRow[]): string[] {
  const n = country.name_ar;
  const base = [
    `عقارات ${n}`, `عقارات في ${n}`, `شقق للإيجار في ${n}`, `شقق للبيع في ${n}`,
    `أراضي للبيع في ${n}`, `فلل للبيع في ${n}`, `بيوت للبيع في ${n}`,
    `محلات للإيجار في ${n}`, `أسعار العقارات في ${n}`, `سوق العقارات في ${n}`,
    `خدمات عقارية في ${n}`, `مقاولون في ${n}`, `مسكني ${n}`,
  ];
  const perCity = cities
    .slice(0, 8)
    .flatMap((c) => [
      `عقارات ${c.name_ar}`,
      `شقق للإيجار في ${c.name_ar}`,
      `أراضي للبيع في ${c.name_ar}`,
    ]);
  return [...base, ...perCity];
}

// دولة جديدة تُضاف من الخادم (الأردن مثلاً) لا توجد في قائمة البناء السابقة،
// فكانت صفحتها ترجع 404 حتى إعادة النشر. `dynamicParams` تبنيها عند أوّل طلب.
export const dynamicParams = true;

export async function generateStaticParams() {
  const list = await getCountries();
  return list.map((c) => ({ slug: c.slug })).filter((p) => p.slug);
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const country = await resolveCountry(slug);
  if (!country) return {};
  const cities = country.cities ?? [];
  const cityNames = cities.slice(0, 5).map((c) => c.name_ar).join("، ");
  const title = `عقارات ${country.name_ar} — شقق وأراضٍ وفلل للبيع والإيجار`;
  const description =
    `سوق العقارات في ${country.name_ar} على مسكني: شقق وفلل وأراضٍ ومحلات للبيع والإيجار` +
    `${cityNames ? ` في ${cityNames} وبقية المدن` : ""}، مع خدمات عقارية موثوقة وتواصل مباشر ` +
    `مع أصحاب العقارات.`;
  return {
    title,
    description,
    keywords: keywordsFor(country, cities),
    alternates: { canonical: `/properties/country/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/properties/country/${slug}`,
      siteName: "مسكني",
      locale: "ar_AR",
      type: "website",
      images: [{ url: "/og.webp", width: 1200, height: 630, alt: `عقارات ${country.name_ar}` }],
    },
  };
}

export default async function CountryLandingPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const country = await resolveCountry(slug);
  if (!country) notFound();

  const cities = country.cities ?? [];
  const [{ items, count }, servicesCount, requestsCount] = await Promise.all([
    getCountryProperties(country.code),
    countOf("services", country.code),
    countOf("requests", country.code),
  ]);

  const stats = [
    { label: "عقار منشور", value: count },
    { label: "مزوّد خدمة", value: servicesCount },
    { label: "طلب عقاري", value: requestsCount },
    { label: "مدينة ومحافظة", value: cities.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd
        data={breadcrumbList([
          { name: "الرئيسية", path: "/" },
          { name: "العقارات", path: "/properties" },
          { name: `عقارات ${country.name_ar}`, path: `/properties/country/${slug}` },
        ])}
      />
      {items.length > 0 && (
        <JsonLd
          data={itemList(
            `عقارات في ${country.name_ar}`,
            items.map((l) => `/properties/${l.id}`),
          )}
        />
      )}
      <Breadcrumbs
        items={[
          { name: "الرئيسية", href: "/" },
          { name: "العقارات", href: "/properties" },
          { name: `عقارات ${country.name_ar}` },
        ]}
      />

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2">
          <span aria-hidden>{country.flag_emoji}</span>
          عقارات {country.name_ar}
        </h1>
        <p className="text-gray-600 mt-3 leading-relaxed max-w-3xl">
          سوق العقارات في {country.name_ar} على منصّة مسكني: شقق وفلل وأراضٍ ومحلات تجارية
          للبيع والإيجار في {cities.slice(0, 4).map((c) => c.name_ar).join("، ")}
          {cities.length > 4 ? " وبقية المدن" : ""}، مع الأسعار والصور والموقع على الخريطة،
          وخدمات عقارية موثوقة، وتواصل مباشر مع أصحاب العقارات.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <Link
            href="/properties"
            className="rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            تصفّح كل العقارات
          </Link>
          <Link
            href="/services"
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary/40 transition-colors"
          >
            خدمات عقارية في {country.name_ar}
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white card-shadow p-4 text-center">
            <p className="text-2xl font-extrabold text-primary tabular-nums">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {cities.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-ink mb-3">
            العقارات حسب المدينة في {country.name_ar}
          </h2>
          {/* روابط داخلية لكل مدينة — هي طريق الزاحف إلى الطبقة الأعمق. */}
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link
                key={c.id}
                href={`/properties/city/${citySlug(c.name_en)}`}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-primary/40 hover:text-primary transition-colors"
              >
                عقارات {c.name_ar}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold text-ink mb-3">أحدث العقارات في {country.name_ar}</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">
            لا توجد عقارات في {country.name_ar} بعد — كن أوّل من ينشر عقاراً هنا.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((l) => (
              <PropertyCard key={l.id} property={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
