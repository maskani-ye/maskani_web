import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogCard, CategoryChips, type BlogCardData } from "@/components/blog/BlogCard";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { getBlogCategories, BLOG_CATEGORIES } from "@/lib/blogCategories";
import { breadcrumbList, itemList, SITE_URL, SITE_NAME } from "@/lib/seo";

/**
 * ⚠️ درسٌ من عطل حيّ (2026-08-23): بُني الويب بينما كانت القاعدة ساقطة، فثُبِّتت
 * صفحاتٌ على **404 دائم** وزارها جوجل فسجّلها «غير موجودة». بلا `revalidate` لا
 * تُعيد الصفحة المحاولة أبداً مهما تعافى الخادم — فيتحوّل عطلٌ عابر إلى ضرر
 * دائم في نتائج البحث.
 */
export const revalidate = 3600;


const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
const PER_PAGE = 12;

export async function generateStaticParams() {
  const cats = await getBlogCategories();
  return (cats.length ? cats : BLOG_CATEGORIES).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const cats = await getBlogCategories();
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) return {};
  const title = `${cat.label} — مدونة مسكني`;
  return {
    title,
    description: cat.description,
    alternates: { canonical: `/blog/category/${slug}` },
    openGraph: {
      title, description: cat.description, url: `${SITE_URL}/blog/category/${slug}`,
      siteName: SITE_NAME, locale: "ar_AR", type: "website",
      images: [{ url: "/og.webp", width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

async function getArticles(slug: string, offset: number): Promise<{ results: BlogCardData[]; count: number }> {
  try {
    const res = await fetch(`${API}/blog/?category=${slug}&limit=${PER_PAGE}&offset=${offset}`, { next: { revalidate: 600 } });
    if (!res.ok) return { results: [], count: 0 };
    const data = await res.json();
    return { results: data.results ?? [], count: data.count ?? 0 };
  } catch {
    return { results: [], count: 0 };
  }
}

export default async function BlogCategoryPage(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
  },
) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const cats = await getBlogCategories();
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();
  const { results: articles, count } = await getArticles(slug, offset);
  const totalPages = Math.max(1, Math.ceil(count / PER_PAGE));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={breadcrumbList([
        { name: "الرئيسية", path: "/" },
        { name: "المدونة", path: "/blog" },
        { name: cat.label, path: `/blog/category/${slug}` },
      ])} />
      {articles.length > 0 && (
        <JsonLd data={itemList(`${cat.label} — مدونة مسكني`, articles.map((a) => `/blog/${a.slug}`))} />
      )}
      <Breadcrumbs items={[
        { name: "الرئيسية", href: "/" },
        { name: "المدونة", href: "/blog" },
        { name: cat.label },
      ]} />

      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">{cat.label}</h1>
        <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">{cat.description}</p>
      </header>

      <CategoryChips active={slug} categories={cats} />

      {count === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">
          لا مقالات في هذا التصنيف بعد.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((a) => <BlogCard key={a.id} a={a} />)}
          </section>
          <BlogPagination
            page={page}
            totalPages={totalPages}
            hrefFor={(p) => (p === 1 ? `/blog/category/${slug}` : `/blog/category/${slug}?page=${p}`)}
          />
        </>
      )}
    </div>
  );
}
