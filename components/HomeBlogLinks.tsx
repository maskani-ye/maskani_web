import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Row {
  slug: string;
  title: string;
}

// خادمي — يجلب أحدث مقالات المدوّنة ويصيّرها روابط <a> في HTML الخام على الصفحة
// الرئيسية (الصفحة الوحيدة المفهرسة حالياً). يمرّر قوّة الزحف من الرئيسية إلى
// المقالات «المُكتشَفة وغير المفهرَسة» ويقلّل عمق النقر إليها إلى نقرة واحدة.
async function getArticles(): Promise<Row[]> {
  try {
    const res = await fetch(`${API}/blog/?limit=24&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((a: { slug: string; title: string }) => ({
      slug: a.slug,
      title: a.title,
    }));
  } catch {
    return [];
  }
}

export default async function HomeBlogLinks() {
  const articles = await getArticles();
  if (!articles.length) return null;

  return (
    <nav aria-labelledby="home-blog-heading" className="max-w-7xl mx-auto px-4 sm:px-6 mt-2 mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 id="home-blog-heading" className="text-lg font-bold text-ink">
          من مدوّنة مسكني
        </h2>
        <Link href="/blog" className="text-sm font-semibold text-primary hover:underline">
          كل المقالات
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/blog/${a.slug}`}
              className="inline-block max-w-full sm:max-w-[20rem] truncate rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-ink hover:border-primary hover:text-primary transition-colors"
            >
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
