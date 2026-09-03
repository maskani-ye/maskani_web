import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/lib/ads";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogCard, CategoryChips, type BlogCardData } from "@/components/blog/BlogCard";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { getBlogCategories } from "@/lib/blogCategories";
import { breadcrumbList, itemList, SITE_URL, SITE_NAME } from "@/lib/seo";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const PER_PAGE = 12;

export const metadata: Metadata = {
  // ⚠️ **٥٠١ مقالاً لستّة أسواق تحت عنوانٍ يقول «اليمن»** — ومنها ١١٥
  // سعودياً و١١١ عراقياً. عنوانٌ يناقض محتواه يخسر الاستعلامين معاً.
  title: "مدونة مسكني — أدلّة ونصائح العقارات في ستّة أسواق عربية",
  description:
    "مقالات وأدلّة عقارية في السعودية والأردن ومصر والعراق وعُمان واليمن: شراء وبيع وإيجار، أدلّة المدن، اتجاهات الأسعار، ونصائح تجنّب الاحتيال العقاري — من فريق مسكني.",
  keywords: [
    "مدونة عقارية", "نصائح عقارية", "دليل شراء عقار", "أسعار العقارات",
    "عقارات السعودية", "عقارات مصر", "عقارات العراق",
    "الاحتيال العقاري", "عقارات صنعاء", "عقارات عدن",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    // ⚠️ **٥٠١ مقالاً لستّة أسواق تحت عنوانٍ يقول «اليمن»** — ومنها ١١٥
  // سعودياً و١١١ عراقياً. عنوانٌ يناقض محتواه يخسر الاستعلامين معاً.
  title: "مدونة مسكني — أدلّة ونصائح العقارات في ستّة أسواق عربية",
    description: "أدلّة ونصائح عقارية موثوقة من فريق مسكني.",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    locale: "ar_AR",
    type: "website",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: SITE_NAME }],
  },
};

async function getArticles(offset: number): Promise<{ results: BlogCardData[]; count: number }> {
  try {
    const res = await fetch(`${API}/blog/?limit=${PER_PAGE}&offset=${offset}`, { next: { revalidate: 600 } });
    if (!res.ok) return { results: [], count: 0 };
    const data = await res.json();
    return { results: data.results ?? [], count: data.count ?? 0 };
  } catch {
    return { results: [], count: 0 };
  }
}

async function getFeatured(): Promise<BlogCardData[]> {
  try {
    const res = await fetch(`${API}/blog/?featured=1&limit=2&offset=0`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

export default async function BlogPage(
  { searchParams }: { searchParams: Promise<{ page?: string }> },
) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const [{ results: articles, count }, cats, featuredAll] = await Promise.all([
    getArticles(offset),
    getBlogCategories(),
    page === 1 ? getFeatured() : Promise.resolve([]),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / PER_PAGE));
  const featured = page === 1 ? featuredAll.slice(0, 2) : [];
  const featuredIds = new Set(featured.map((a) => a.id));
  const grid = articles.filter((a) => !featuredIds.has(a.id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: "المدونة", path: "/blog" }])} />
      {articles.length > 0 && (
        <JsonLd data={itemList("مدونة مسكني", articles.map((a) => `/blog/${a.slug}`))} />
      )}
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "المدونة" }]} />

      <header className="mb-8">
        <h1 className="text-h1 font-extrabold text-ink">مدونة مسكني</h1>
        <p className="text-muted-600 mt-2 max-w-2xl leading-relaxed">
          أدلّة ونصائح عقارية موثوقة في السعودية والأردن ومصر والعراق وعُمان واليمن — شراء، بيع، إيجار، أدلّة المدن، وحماية من الاحتيال.
          كل ما تحتاج معرفته قبل قرارك العقاري.
        </p>
      </header>

      <CategoryChips categories={cats} />

      {count === 0 ? (
        <div className="rounded-2xl border border-muted-200 bg-white py-16 text-center text-muted-500">
          لا مقالات منشورة بعد.
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {featured.map((a) => <BlogCard key={a.id} a={a} />)}
            </section>
          )}
          <AdSlot slot={AD_SLOTS.blogList} hasContent={grid.length > 0 || featured.length > 0} />
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grid.map((a) => <BlogCard key={a.id} a={a} />)}
          </section>
          <BlogPagination
            page={page}
            totalPages={totalPages}
            hrefFor={(p) => (p === 1 ? "/blog" : `/blog?page=${p}`)}
          />
        </>
      )}
    </div>
  );
}
