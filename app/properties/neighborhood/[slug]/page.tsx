import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { breadcrumbList, itemList, citySlug, SITE_URL } from "@/lib/seo";
import { PropertyCard } from "@/components/properties/PropertyCard";
import type { Property } from "@/types";

/**
 * ساعة كاملة بين التجديدات، لا خمس دقائق.
 *
 * ⚠️ درسٌ من عطل حيّ: كل صفحة حيّ تطلب الـAPI مرّة، والأحياء 4,155. بتجديد كل
 * خمس دقائق كان موقعنا يضرب واجهتنا آلاف الطلبات في الساعة، فردّ الخادم
 * 10,259 مرّة بـ429 وسقط 1,674 مرّة بـ502 — خنقنا أنفسنا بأنفسنا. مخزون
 * الأحياء لا يتغيّر كل خمس دقائق؛ الساعة تكفي بفارق مئة ضعف في الحِمل.
 */
export const revalidate = 3600;

// الأحياء غير المولَّدة مسبقاً تُبنى عند أوّل طلب لها (لا 404).
export const dynamicParams = true;

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  city: number;
  city_name: string;
  country_name?: string | null;
  properties_count?: number;
}

async function getNeighborhoods(): Promise<Neighborhood[]> {
  try {
    // مدّة قصيرة عمداً: الأحياء تُحرَّر من اللوحة (حذف/تعطيل)، وكاش طويل يُبقي
    // صفحةَ حيٍّ محذوف حيّةً ساعةً كاملة. خمس دقائق تكفي لالتئام ذاتي سريع.
    const res = await fetch(`${API}/cities/neighborhoods/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch {
    return [];
  }
}

/** الأحياء عربية الاسم، و`slug` المولّد عربي أيضاً — نطابق على المُرمَّز
 *  (decodeURIComponent) كي يعمل الرابط سواء وصل مُرمَّزاً أو خاماً. */
async function resolveNeighborhood(slug: string): Promise<Neighborhood | null> {
  const wanted = decodeURIComponent(slug);
  // ⚠️ **كانت تُنزّل القائمة كاملةً لتجد صفّاً واحداً.** الردّ 2.7 م.ب، وهو فوق
  // سقف تخزين Next (2 م.ب) فلا يُخزَّن أصلاً — فكل صفحة حيٍّ في البناء تُنزّله
  // وتُحلّله من جديد، فتتجاوز مهلة الستّين ثانية. سقط بها البناء البارد كلّه
  // (`Export encountered an error on /properties/neighborhood/[slug]`) وكان
  // البناء الدافئ ينجو بذاكرة الجلب وحدها. `?slug=` يردّ صفّاً واحداً.
  try {
    const res = await fetch(
      `${API}/cities/neighborhoods/?slug=${encodeURIComponent(wanted)}`,
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const rows: Neighborhood[] = Array.isArray(data) ? data : data.results ?? [];
      const hit = rows.find((n) => n.slug === wanted || n.name === wanted);
      if (hit) return hit;
    }
  } catch { /* نسقط إلى القائمة الكاملة أدناه */ }
  // احتياطٌ لخادمٍ لم يُنشر عليه المرشّح بعد — يبقى الموقع عاملاً لا 404.
  const list = await getNeighborhoods();
  return list.find((n) => n.slug === wanted || n.name === wanted) ?? null;
}

async function getProperties(refId: number): Promise<{ items: Property[]; count: number }> {
  try {
    const res = await fetch(
      `${API}/properties/?neighborhood_ref=${refId}&limit=12&offset=0`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return { items: [], count: 0 };
    const data = await res.json();
    return { items: data.results ?? [], count: data.count ?? 0 };
  } catch {
    return { items: [], count: 0 };
  }
}

// صفحة ثابتة لكل حيّ مسجّل — البحث العقاري في اليمن يبدأ بالحيّ، فهذه أعمق
// طبقة فهرسة بعد المحافظة.
/**
 * نولّد مسبقاً أحياء **فيها عقارات فعلاً** فقط (ثلاثة من 4,155 اليوم).
 *
 * توليد صفحة لكل حيّ كان يكلّف طلب API لكل واحد منها، ويُنتج آلاف الصفحات
 * الفارغة التي يصنّفها جوجل «اكتُشفت ولم تُفهرَس» فتستهلك ميزانية الزحف بلا
 * مقابل. البقية تُبنى عند الطلب عبر `dynamicParams` — فيبقى الرابط حيّاً لمن
 * يصله من مشاركة أو بحث، بلا أن ندفع ثمنه سلفاً 4,152 مرّة.
 */
export async function generateStaticParams() {
  const list = await getNeighborhoods();
  return list
    .filter((n) => (n.properties_count ?? 0) > 0 && n.slug)
    .map((n) => ({ slug: n.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const hood = await resolveNeighborhood(slug);
  if (!hood) return {};
  const title = `عقارات في ${hood.name} — ${hood.city_name} | شقق وفلل وأراضٍ`;
  const description = `أحدث العقارات في حي ${hood.name} — ${hood.city_name}: شقق وفلل وأراضٍ للبيع والإيجار على مسكني، مع الأسعار والصور والتواصل المباشر بلا عمولات.`;
  return {
    title,
    description,
    keywords: [
      `عقارات ${hood.name}`, `شقق ${hood.name}`, `أراضي ${hood.name}`,
      // ⚠️ نفس عطل صفحة المدينة: «عقارات اليمن» على حيٍّ في الرياض.
      `عقارات ${hood.city_name}`,
      hood.country_name ? `عقارات ${hood.country_name}` : "عقارات",
    ],
    alternates: { canonical: `/properties/neighborhood/${hood.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/properties/neighborhood/${hood.slug}`,
      siteName: "مسكني",
      locale: "ar_AR",
      type: "website",
      images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني" }],
    },
  };
}

export default async function NeighborhoodPropertiesPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const hood = await resolveNeighborhood(slug);
  if (!hood) notFound();

  const { items, count } = await getProperties(hood.id);
  const cityHref = `/properties/city/${citySlug(hood.city_name)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd
        data={breadcrumbList([
          { name: "الرئيسية", path: "/" },
          { name: "العقارات", path: "/properties" },
          { name: `عقارات ${hood.city_name}`, path: cityHref },
          { name: `حي ${hood.name}`, path: `/properties/neighborhood/${hood.slug}` },
        ])}
      />
      {items.length > 0 && (
        <JsonLd
          data={itemList(
            `عقارات في حي ${hood.name}`,
            items.map((l) => `/properties/${l.id}`),
          )}
        />
      )}
      <Breadcrumbs
        items={[
          { name: "الرئيسية", href: "/" },
          { name: "العقارات", href: "/properties" },
          { name: `عقارات ${hood.city_name}`, href: cityHref },
          { name: `حي ${hood.name}` },
        ]}
      />

      <header className="mb-6">
        <h1 className="text-h2 sm:text-h1 font-bold text-ink">
          عقارات في حي {hood.name}
          <span className="text-muted font-normal"> — {hood.city_name}</span>
        </h1>
        <p className="text-muted-600 mt-2 leading-relaxed max-w-3xl">
          استكشف {count > 0 ? `${count} ` : ""}عقاراً في حي {hood.name} بمحافظة {hood.city_name} —
          شقق وفلل وأراضٍ ومحلات تجارية للبيع والإيجار، مع الأسعار والصور،
          وتواصل مباشر مع أصحاب العقارات بلا عمولات.
        </p>
        <Link
          href={`/properties?neighborhood_ref=${hood.id}`}
          className="inline-flex items-center gap-2 mt-4 rounded-xl bg-primary text-white px-5 py-2.5 text-body font-semibold hover:bg-primary/90 transition-colors"
        >
          تصفّح كل عقارات {hood.name} مع الفلاتر
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-muted-200 bg-white py-16 text-center text-muted-500">
          لا توجد عقارات في حي {hood.name} بعد — كن أول من يضيف عقاراً هنا.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((l) => (
            <PropertyCard key={l.id} property={l} />
          ))}
        </div>
      )}
    </div>
  );
}
