import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Article { id: number; slug: string; title: string; reading_minutes: number }

// خادمي — الاتجاه المعاكس للربط الداخليّ: صفحة المحافظة (ضعيفة، قليلة المحتوى)
// تستعير عمقاً من المدونة، والقارئ يجد ما يحتاجه فعلاً قبل الشراء بدل صفحة
// تعرض عقارين وتنتهي.
async function getArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`${API}/blog/?limit=6&offset=0`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

export default async function CityGuideLinks({ cityName }: { cityName: string }) {
  const articles = (await getArticles()).slice(0, 3);
  if (!articles.length) return null;

  return (
    <section aria-labelledby="city-guides" className="mt-10">
      <h2 id="city-guides" className="text-h3 font-bold text-ink mb-3">
        اقرأ قبل أن تشتري في {cityName}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/blog/${a.slug}`}
            className="rounded-xl border border-muted-200 bg-white p-4 hover:border-primary transition-colors"
          >
            <p className="font-bold text-ink text-body leading-snug line-clamp-2">{a.title}</p>
            <span className="inline-block mt-2 text-primary text-caption font-semibold">
              {a.reading_minutes} دقائق قراءة ←
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/tools/area-converter" className="text-body rounded-xl border border-muted-200 bg-white px-3.5 py-2 text-muted-700 hover:border-primary hover:text-primary transition-colors">
          محوّل اللبنة والقصبة إلى متر مربّع
        </Link>
        <Link href="/tools/construction-cost" className="text-body rounded-xl border border-muted-200 bg-white px-3.5 py-2 text-muted-700 hover:border-primary hover:text-primary transition-colors">
          حاسبة تكلفة البناء
        </Link>
      </div>
    </section>
  );
}
