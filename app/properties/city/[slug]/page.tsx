import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { breadcrumbList, itemList, citySlug, SITE_URL } from "@/lib/seo";
import { formatPrice, propertyTypeName, offerTypeLabels } from "@/lib/utils";
import { PropertyCard } from "@/components/properties/PropertyCard";
import CityGuideLinks from "@/components/properties/CityGuideLinks";
import CityAlertButton from "@/components/properties/CityAlertButton";
import CityNeighborhoods from "@/components/properties/CityNeighborhoods";

/**
 * ⚠️ درسٌ من عطل حيّ (2026-08-23): بُني الويب بينما كانت القاعدة ساقطة، فثُبِّتت
 * صفحاتٌ على **404 دائم** وزارها جوجل فسجّلها «غير موجودة». بلا `revalidate` لا
 * تُعيد الصفحة المحاولة أبداً مهما تعافى الخادم — فيتحوّل عطلٌ عابر إلى ضرر
 * دائم في نتائج البحث.
 */
export const revalidate = 3600;


const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface City {
  id: number;
  name_ar: string;
  name_en: string;
  /** اسم الدولة من الخادم — تُبنى منه الكلمة المفتاحية بدل «اليمن» الثابتة. */
  country_name?: string | null;
  /** المخزون — يقرّر أيّ مدينة تُبنى سلفاً وأيّها تُؤجَّل. */
  properties_count?: number;
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

/**
 * ⚠️ درسٌ من عطل حيّ (2026-08-24): سجّل جوجل صفحة مصر **404**، وكانت عُمان ترجع
 * 404 بعد إضافتها بيوم كامل. السبب ليس `dynamicParams` — بل أنّ تخزين هذا الجلب
 * (86400) كان يفوق `revalidate` الصفحة (3600): تُعاد بناء الصفحة كل ساعة لكنها
 * تقرأ قائمةً محفوظةً لا يظهر فيها الكيان الجديد، فتُعلن 404 وتُثبّتها.
 *
 * الإصلاح شقّان: مواءمة التخزين مع الصفحة، ثم **إعادة محاولة بلا تخزين قبل
 * إعلان الغياب** — فالـ404 قرارٌ لا رجعة فيه في نتائج البحث، ولا يجوز اتّخاذه
 * من نسخةٍ قد تكون قديمة.
 */
async function getCities(): Promise<City[]> {
  try {
    const res = await fetch(`${API}/cities/?limit=1000`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

async function resolveCity(slug: string): Promise<City | null> {
  // ⚠️ **لا `no-store` هنا.** كانت هذه الدالّة تُعيد المحاولة بجلبٍ بلا تخزين
  // قبل إعلان الغياب (تفادياً لـ404 كاذب لمدينة أُضيفت للتوّ)، لكنها تعمل **وقت
  // التشغيل** داخل تصيير ISR — فيُخرج `no-store` الصفحةَ من التوليد الساكن
  // ويرفضه Next صراحةً: «Page changed from static to dynamic at runtime …
  // reason: no-store fetch» (رصده Sentry).
  //
  // البديل كافٍ: عمر الجلب (3600) = عمر الصفحة، فالمدينة الجديدة تظهر خلال
  // ساعة على الأكثر بدل أن تُثبَّت على 404. وقائمة المسارات الثابتة تقرأ من المصدر نفسه وقت البناء.
  const hit = (list: City[]) =>
    list.find((c) => citySlug(c.name_en) === slug) ?? null;
  return hit(await getCities());
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
// مدن دولة جديدة لا توجد في قائمة البناء السابقة — تُبنى عند أوّل طلب.
export const dynamicParams = true;

/**
 * نولّد مسبقاً المدن **ذات المخزون** فقط — والبقية عند الطلب.
 *
 * ⚠️ **هذا ما أسقط نشرتين متتاليتين (2026-09-01).** بعد فتح ستّة أسواق صار
 * الجدول 372 مدينة، فطلب البناء 591 صفحة ساكنة بعاملٍ واحد، وكل صفحة تنادي
 * الـAPI مرّتين عبر القارّات (≈1.3ث للطلب) — فتجاوزت `/properties/city/cairo`
 * مهلة الستّين ثانية وفشل النشر كلّه (`BUILD_ERROR`). والنشرة التي قبلها سقطت
 * بـ`fetch failed` من الصنف نفسه.
 *
 * والمدينة الفارغة لا تخسر شيئاً بالتأجيل: `generateMetadata` يضع لها
 * `noindex` أصلاً ما دامت بلا عقار، فتوليدها سلفاً دفعُ ثمنٍ لصفحةٍ لا نريد
 * فهرستها. و`dynamicParams` يُبقي رابطها حيّاً لمن يصله.
 */
export async function generateStaticParams() {
  // بلا تخزين — انظر التعليق نفسه في صفحة الدولة.
  const list = await getCities();
  return list
    .filter((c) => (c.properties_count ?? 0) > 0)
    .map((c) => ({ slug: citySlug(c.name_en) }))
    .filter((p) => p.slug);
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
  const description = `عقارات ${city.name_ar} على مسكني: شقق وفلل وأراضٍ ومحلات بالسعر والصور والموقع، ورقم صاحب العقار مباشرةً — بلا عمولة.`;
  return {
    title,
    description,
    ...(stock === 0 ? { robots: { index: false, follow: true } } : {}),
    keywords: [
      `عقارات ${city.name_ar}`, `شقق للإيجار ${city.name_ar}`, `شقق للبيع ${city.name_ar}`,
      `أراضي ${city.name_ar}`, `فلل ${city.name_ar}`,
      // ⚠️ **كانت «عقارات اليمن» على كل مدينة** — بما فيها الرياض والقاهرة
      // وبغداد. كلمةٌ مفتاحية تناقض محتوى الصفحة تُضعف صلتها لا تقوّيها،
      // وتُقرأ حشواً. الدولة تُقرأ من المدينة نفسها.
      city.country_name ? `عقارات ${city.country_name}` : "عقارات",
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
        <h1 className="text-h2 sm:text-h1 font-bold text-ink">
          عقارات في {city.name_ar}
        </h1>
        <p className="text-muted-600 mt-2 leading-relaxed max-w-3xl">
          استكشف {count > 0 ? `${count} ` : ""}عقاراً في {city.name_ar} على منصّة مسكني —
          شقق وفلل وأراضٍ ومحلات تجارية للبيع والإيجار، مع الأسعار والصور والموقع على الخريطة،
          وتواصل مباشر مع أصحاب العقارات بلا عمولات.
        </p>
        <div className="mt-4">
          <CityAlertButton cityId={city.id} cityName={city.name_ar} />
        </div>
        <Link
          href={`/properties?city=${city.id}`}
          className="inline-flex items-center gap-2 mt-4 rounded-xl bg-primary text-white px-5 py-2.5 text-body font-semibold hover:bg-primary/90 transition-colors"
        >
          تصفّح كل عقارات {city.name_ar} مع الفلاتر
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-h3 font-bold text-ink mb-2">
            لا يوجد عقار معروض في {city.name_ar} بعد
          </p>
          <p className="text-muted-600 text-body leading-relaxed max-w-xl mx-auto mb-5">
            كن أوّل من ينشر هنا: إعلانك سيكون وحيداً في صفحة {city.name_ar} فيراه كل
            من يبحث عن عقار في المحافظة. النشر مجّاني بلا عمولة، ويصلك الباحث على
            رقمك مباشرة.
          </p>
          <Link
            href="/properties/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-6 py-3 text-body font-bold hover:bg-primary/90 transition-colors"
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

      <CityNeighborhoods cityId={city.id} cityName={city.name_ar} />

      <CityGuideLinks cityName={city.name_ar} />
    </div>
  );
}
