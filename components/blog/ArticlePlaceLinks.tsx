import Link from "next/link";
import { citySlug } from "@/lib/seo";
import { TOOLS, TOOL_ARTICLES } from "@/lib/toolsMeta";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface City { id: number; name_ar: string; name_en: string; properties_count?: number }

// خادمي — يربط المقال بصفحات المحافظات والأدوات. سببه أن المدونة تجلب أضعاف ما
// تجلبه صفحات العقارات من ظهور في البحث، ولا يتسرّب من هذا الظهور شيء إليها:
// القارئ يصل المقال ثم يخرج. هذه الكتلة تحوّل قارئ المقال إلى متصفّح عقارات،
// وتمرّر ثقل الروابط الداخلية من الصفحات القوية إلى الضعيفة.
async function getCities(): Promise<City[]> {
  try {
    const res = await fetch(`${API}/cities/?limit=1000`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

/** الأداة المرتبطة بالمقال — عكس خريطة TOOL_ARTICLES (أداة ← مقالاتها). */
function toolForArticle(slug: string) {
  const entry = Object.entries(TOOL_ARTICLES).find(([, arts]) =>
    arts.some((a) => a.slug === slug),
  );
  return entry ? TOOLS.find((t) => t.slug === entry[0]) : undefined;
}

export default async function ArticlePlaceLinks({ slug }: { slug: string }) {
  const cities = await getCities();
  // المحافظات ذات العقارات أولاً — رابطٌ إلى صفحة فارغة لا ينفع قارئاً ولا زاحفاً.
  const withStock = cities
    .filter((c) => (c.properties_count ?? 0) > 0)
    .sort((a, b) => (b.properties_count ?? 0) - (a.properties_count ?? 0));
  const shown = (withStock.length ? withStock : cities).slice(0, 10);
  const tool = toolForArticle(slug);

  return (
    <section aria-labelledby="article-places" className="mt-8">
      <h2 id="article-places" className="text-h3 font-bold text-ink mb-3">
        تصفّح العقارات حسب المحافظة
      </h2>
      <div className="flex flex-wrap gap-2">
        {shown.map((c) => (
          <Link
            key={c.id}
            href={`/properties/city/${citySlug(c.name_en)}`}
            className="text-body rounded-xl border border-muted-200 bg-white px-3.5 py-2 text-muted-700 hover:border-primary hover:text-primary transition-colors"
          >
            عقارات {c.name_ar}
            {c.properties_count ? (
              <span className="text-muted text-caption"> ({c.properties_count})</span>
            ) : null}
          </Link>
        ))}
      </div>

      {tool && (
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-body text-muted-600 mb-1">أداة تُغنيك عن الحساب اليدويّ</p>
          <Link href={`/tools/${tool.slug}`} className="font-bold text-primary hover:underline">
            {tool.h1} ←
          </Link>
          <p className="text-muted-600 text-body mt-1 leading-relaxed">{tool.cardDesc}</p>
        </div>
      )}
    </section>
  );
}
