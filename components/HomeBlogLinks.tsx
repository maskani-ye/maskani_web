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
    // ⚠️ **الترويسة كانت 20 بكسل بين أقسامٍ بـ36**: قسمٌ كامل بوزن عنوانٍ
    // فرعيّ، فيبدو ذيلاً للقسم السابق. وحشوُه `mt-2 mb-12` خالف إيقاع بقيّة
    // النطاقات (`py-14 md:py-20`) فبدا الفاصل مبتوراً من فوق ومتراخياً من تحت.
    <section aria-labelledby="home-blog-heading" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <h2 id="home-blog-heading" className="text-h1 text-ink text-balance">
            من مدوّنة مسكني
          </h2>
          <p className="text-body text-muted mt-2">
            أدلّة وشروح عن التوثيق والأسعار وحقوق الطرفين
          </p>
        </div>
        <Link
          href="/blog"
          className="group hidden flex-shrink-0 items-center gap-1.5 text-body font-bold text-primary transition-all hover:gap-2.5 sm:flex"
        >
          كل المقالات
          <span aria-hidden>←</span>
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
