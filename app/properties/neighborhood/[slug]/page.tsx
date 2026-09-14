import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { breadcrumbList, itemList, citySlug, SITE_URL } from "@/lib/seo";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { MarketStats, getMarketStats } from "@/components/properties/MarketStats";
import type { Property } from "@/types";
import { fetchRetry } from "@/lib/fetchRetry";
import { DEFAULT_MARKET, MARKETS, marketPath } from "@/lib/markets";

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
  country_code?: string | null;
  properties_count?: number;
}

async function getNeighborhoods(): Promise<Neighborhood[]> {
  try {
    // ⚠️ **`has_properties=1` لا القائمة كاملة — والسبب ليس الحجم وحده.**
    // القائمة الكاملة ٣ م.ب أي فوق سقف تخزين Next (٢ م.ب) فلا تُخزَّن، بينما
    // هذه ٢٨٧ ك.ب فتُخزَّن مرّةً وتخدم **كل** صفحات الأحياء في البناء الواحد.
    // وهذه القائمة نفسها هي ما نولّده مسبقاً، فما ينقصها لا يُبنى أصلاً.
    const res = await fetchRetry(`${API}/cities/neighborhoods/?has_properties=1`, {
      next: { revalidate: 3600 },
    });
    if (!res || !res.ok) return [];
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

  // ⚠️ **القائمة المخزَّنة أوّلاً — وهذا ما يمنع كارثة ٤٠٤ الصامتة.**
  //
  // كان كل صفحة حيٍّ تسأل `?slug=` سؤالاً خاصاً بها. البناء يولّد ٨٥٩ صفحة،
  // فصارت ٢٬٦٠٠ نداءٍ في دقائق أمام سقفٍ قدره ٣٠٠/دقيقة — فردّ الخادم ٤٢٩،
  // وفسّرته الصفحة «حيٌّ غير موجود» فاستدعت `notFound()`، **فخُبزت ٥١٩ صفحة
  // من ٨٥٩ في الإخراج كـ404 دائمة**: أحياءٌ حقيقية فيها عقارات، مفقودةٌ من
  // الموقع بلا أيّ خطأ في السجلّ. القائمة المخزَّنة تخدمها كلّها بنداءٍ واحد.
  const list = await getNeighborhoods();
  const hit = list.find((n) => n.slug === wanted || n.name === wanted);
  if (hit) return hit;

  // حيٌّ خارج القائمة (بلا عقارات، أو أُضيف بعد آخر تخزين) — نسأل عنه وحده.
  const res = await fetchRetry(
    `${API}/cities/neighborhoods/?slug=${encodeURIComponent(wanted)}`,
    { next: { revalidate: 3600 } },
  );
  // ⚠️ **خطأ الشبكة يُرفَع ولا يُبتلَع.** ردٌّ غير سليم (٤٢٩/٥٠٢) ليس دليلاً
  // على أنّ الحيّ غير موجود، وابتلاعُه هو ما حوّل الخنق إلى ٤٠٤ دائمة.
  // رفعُه يُسقط البناء بصوتٍ مسموع بدل أن ينشر موقعاً ناقصاً بصمت.
  if (!res || !res.ok) {
    throw new Error(
      `تعذّر التحقّق من الحيّ «${wanted}»: ${res?.status ?? "شبكة"} — لا نبني 404 على ردٍّ فاشل.`,
    );
  }
  const data = await res.json();
  const rows: Neighborhood[] = Array.isArray(data) ? data : data.results ?? [];
  return rows.find((n) => n.slug === wanted || n.name === wanted) ?? null;
}

async function getProperties(refId: number): Promise<{ items: Property[]; count: number }> {
  try {
    const res = await fetchRetry(
      `${API}/properties/?neighborhood_ref=${refId}&limit=12&offset=0`,
      { next: { revalidate: 3600 } },
    );
    if (!res || !res.ok) return { items: [], count: 0 };
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
  // ⚠️ **حيٌّ بأقلّ من ثلاثة عقارات لا يُفهرَس.**
  // ٨٬١٠١ حيّاً عندنا بلا عقارٍ واحد و٥٤٧ بعقارٍ واحد. صفحاتها لا تحمل معلومةً
  // تُذكر، وجوجل يصنّفها «اكتُشفت ولم تُفهرَس» ويحسبها على الموقع كلّه —
  // وبها رُفض الموقع في أدسنس بوصف «محتوى غير ذي قيمة» (٢٠٢٦-٠٩-١٠).
  // تبقى الصفحة حيّةً لمن يصله رابطها، لكنّها لا تُقدَّم للفهرسة.
  const thin = (hood.properties_count ?? 0) < 3;

  return {
    title,
    description,
    robots: thin ? { index: false, follow: true } : undefined,
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
  const stats = await getMarketStats("neighborhood", hood.id);
  const cityHref = `/properties/city/${citySlug(hood.city_name)}`;
  // سوق الحيّ من دولته — لا من كعكة الزائر. صفحةٌ مفهرسة تُقرأ من أيّ سوق،
  // فوجهتها يجب أن تُشتقّ من محتواها لا من حالة قارئها.
  const code = (hood.country_code || "").toLowerCase();
  const market = (MARKETS as readonly string[]).includes(code) ? code : DEFAULT_MARKET;

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
          // ⚠️ **الرابط يحمل سوقه ومدينته وحيّه — وكان يحمل الحيّ وحده.**
          // `/properties?…` مسارٌ قديم يحوّله الوسيط 308 إلى **سوق الكعكة**،
          // فالقادم من بحث جوجل إلى حيٍّ مصريّ كان يهبط في `/ye/properties`
          // ومعه معرّف مدينةٍ مصرية — قائمةٌ فارغة وسوقٌ ليس سوقه.
          href={`${marketPath(market, "properties")}?city=${hood.city}&neighborhood_ref=${hood.id}`}
          className="inline-flex items-center gap-2 mt-4 rounded-xl bg-primary text-white px-5 py-2.5 text-body font-semibold hover:bg-primary/90 transition-colors"
        >
          تصفّح كل عقارات {hood.name} مع الفلاتر
        </Link>
      </header>

      {stats && (
        <MarketStats data={stats} placeName={`حي ${hood.name}`} cityName={hood.city_name} />
      )}

      <h2 className="text-h3 sm:text-h2 font-bold text-ink mt-10 mb-4">
        العقارات المعروضة في {hood.name}
      </h2>
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
