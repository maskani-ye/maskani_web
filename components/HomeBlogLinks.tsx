import Link from "next/link";
import { BlogCard, type BlogCardData } from "@/components/blog/BlogCard";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

/**
 * ثلاث مقالات من المدوّنة على واجهة السوق — **بنفس بطاقة المدوّنة**.
 *
 * ⚠️ **كان يعرض أربعاً وعشرين عنواناً كشرائح نصّية**: صفٌّ طويل من الأقراص
 * يملأ الشاشة بعناوين متشابهة بلا صورة ولا مقتطف، فلا يُقرأ منه شيء ولا
 * يُنقَر. الغرض المعلن كان تمرير قوّة الزحف إلى المقالات، لكن **أربعاً
 * وعشرين رابطاً في كتلة واحدة** لا يمرّر قوّة بل يبدّدها — وجوجل يقرؤها كتلة
 * روابط لا توصية.
 *
 * ⚠️ **والبطاقة هي بطاقة المدوّنة نفسها** (`BlogCard`) لا نسخةً منها: تعديل
 * شكل بطاقة المقال يقع مرّة واحدة ويسري على الموضعين.
 */
const TAKE = 3;

async function getArticles(): Promise<BlogCardData[]> {
  try {
    const res = await fetch(`${API}/blog/?limit=${TAKE}&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

export default async function HomeBlogLinks() {
  const articles = await getArticles();
  if (!articles.length) return null;

  return (
    <section aria-labelledby="home-blog-heading" className="w-full px-3 sm:px-5 lg:px-6 mt-2 mb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="home-blog-heading" className="text-h3 text-ink">
          من مدوّنة مسكني
        </h2>
        <Link href="/blog" className="text-caption font-semibold text-primary-400 hover:underline">
          كل المقالات ←
        </Link>
      </div>
      <div className="grid grid-cols-cards gap-4">
        {articles.map((a) => (
          <BlogCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}
