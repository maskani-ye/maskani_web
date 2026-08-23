import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import ArticlePlaceLinks from "@/components/blog/ArticlePlaceLinks";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/lib/ads";
import { ShareBar } from "@/components/blog/ShareBar";
import { breadcrumbList, blogPosting, SITE_URL } from "@/lib/seo";

/**
 * ⚠️ درسٌ من عطل حيّ (2026-08-23): بُني الويب بينما كانت القاعدة ساقطة، فثُبِّتت
 * صفحاتٌ على **404 دائم** وزارها جوجل فسجّلها «غير موجودة». بلا `revalidate` لا
 * تُعيد الصفحة المحاولة أبداً مهما تعافى الخادم — فيتحوّل عطلٌ عابر إلى ضرر
 * دائم في نتائج البحث.
 */
export const revalidate = 3600;


const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface ArticleCard {
  id: number; title: string; slug: string; excerpt: string;
  cover_image: string | null; category_display: string;
  author_name: string; reading_minutes: number; published_at: string | null;
}
interface Article extends ArticleCard {
  body: string;
  meta_title: string; meta_description: string; meta_keywords: string;
  updated_at: string; views_count: number; tags: string[];
  related?: ArticleCard[];
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API}/blog/${encodeURIComponent(slug)}/`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API}/blog/?limit=1000&offset=0`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return ((await res.json()).results ?? []).map((a: { slug: string }) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return {};
  const title = a.meta_title || a.title;
  const description = a.meta_description || a.excerpt;
  const image = a.cover_image || "/og.webp";
  return {
    title,
    description,
    keywords: a.meta_keywords ? a.meta_keywords.split(",").map((s) => s.trim()) : a.tags,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title, description, url: `${SITE_URL}/blog/${slug}`, siteName: "مسكني",
      locale: "ar_AR", type: "article",
      publishedTime: a.published_at || undefined,
      modifiedTime: a.updated_at || undefined,
      authors: [a.author_name],
      images: [{ url: image, width: 1200, height: 630, alt: a.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" }) : "";

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();

  const url = `${SITE_URL}/blog/${slug}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={blogPosting({
        title: a.title, slug: a.slug, excerpt: a.excerpt, image: a.cover_image,
        published: a.published_at, updated: a.updated_at, author: a.author_name,
      })} />
      <JsonLd data={breadcrumbList([
        { name: "الرئيسية", path: "/" },
        { name: "المدونة", path: "/blog" },
        { name: a.title, path: `/blog/${slug}` },
      ])} />
      <Breadcrumbs items={[
        { name: "الرئيسية", href: "/" },
        { name: "المدونة", href: "/blog" },
        { name: a.title },
      ]} />

      <article className="bg-white rounded-3xl shadow-card overflow-hidden">
        {a.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.cover_image} alt={a.title} className="w-full h-56 sm:h-72 object-cover" />
        )}
        <div className="p-6 sm:p-9">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{a.category_display}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3 leading-tight text-balance">{a.title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400 mt-3">
            <span className="text-gray-600 font-medium">{a.author_name}</span>
            {a.published_at && <><span>·</span><time dateTime={a.published_at}>{fmtDate(a.published_at)}</time></>}
            <span>·</span><span>{a.reading_minutes} دقائق قراءة</span>
          </div>

          <div className="my-5 pb-5 border-b border-gray-100">
            <ShareBar url={url} title={a.title} />
          </div>

          {/* المدونة هي موضع الكثافة الإعلانية: القارئ جاء للقراءة لا للتصفّح. */}
          <AdSlot slot={AD_SLOTS.articleTop} />

          <div
            className="article-body text-[15px] leading-loose text-gray-800"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: a.body }}
          />

          <AdSlot slot={AD_SLOTS.articleMid} layout="in-article" format="fluid" />

          {a.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
              {a.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">#{t}</span>
              ))}
            </div>
          )}

          <AdSlot slot={AD_SLOTS.articleBottom} />

          <div className="mt-6 pt-5 border-t border-gray-100">
            <ShareBar url={url} title={a.title} />
          </div>
        </div>
      </article>

      {/* CTA */}
      <div className="mt-6 rounded-2xl bg-primary text-white p-6 text-center">
        <p className="font-bold text-lg mb-1">عندك عقار للبيع أو الإيجار؟</p>
        <p className="text-white/80 text-sm mb-4">انشره مجاناً على مسكني ويصلك الباحث على رقمك مباشرة — بلا وسيط وبلا عمولة.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link href="/properties/create" className="inline-block bg-white text-primary font-bold rounded-xl px-6 py-2.5 hover:bg-white/90 transition-colors">أضِف عقارك مجاناً</Link>
          <Link href="/properties" className="inline-block border border-white/60 text-white font-bold rounded-xl px-6 py-2.5 hover:bg-white/10 transition-colors">تصفّح العقارات</Link>
        </div>
      </div>

      <ArticlePlaceLinks slug={slug} />

      {/* Related */}
      {a.related && a.related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">مقالات ذات صلة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {a.related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`}
                className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all p-4 block">
                <span className="text-xs font-bold text-primary">{r.category_display}</span>
                <h3 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2">{r.title}</h3>
                <p className="text-xs text-gray-400 mt-2">{r.reading_minutes} دقائق قراءة</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
