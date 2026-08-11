import Link from "next/link";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blogCategories";

export interface BlogCardData {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  category_display: string;
  author_name: string;
  reading_minutes: number;
}

/** بطاقة مقال موحّدة — تُستخدم في /blog وصفحات التصنيف (لا تكرار). */
export function BlogCard({ a }: { a: BlogCardData }) {
  return (
    <Link href={`/blog/${a.slug}`}
      className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative h-44 bg-primary/5 overflow-hidden">
        {a.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.cover_image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/30 text-4xl font-extrabold">مسكني</div>
        )}
        <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 text-primary">{a.category_display}</span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">{a.title}</h2>
        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 flex-1">{a.excerpt}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
          <span>{a.author_name}</span>
          <span>·</span>
          <span>{a.reading_minutes} دقائق قراءة</span>
        </div>
      </div>
    </Link>
  );
}

/** شرائح تنقّل التصنيفات — تظهر أعلى صفحات المدونة (ديناميكية عبر prop، مع fallback ثابت). */
export function CategoryChips({ active, categories }: { active?: string; categories?: BlogCategory[] }) {
  const base = categories && categories.length ? categories : BLOG_CATEGORIES;
  const chips = [{ slug: "", label: "الكل" }, ...base];
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {chips.map((c) => {
        const href = c.slug ? `/blog/category/${c.slug}` : "/blog";
        const on = (active ?? "") === c.slug;
        return (
          <Link key={c.slug || "all"} href={href}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${on ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary"}`}>
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
