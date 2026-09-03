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

/**
 * بطاقة مقال موحّدة — تُستخدم في /blog وصفحات التصنيف وواجهة السوق (لا تكرار).
 *
 * ⚠️ **البديل كان كلمة «مسكني» بحجم ضخم مكرّرة في كل بطاقة.** قياس
 * 2026-08-31: **صفر من المقالات له صورة غلاف**، فصفُّ المدوّنة على واجهة السوق
 * ثلاث كتلٍ متطابقة تقول اسم العلامة ثلاث مرّات ولا تقول شيئاً عن المقال.
 * البديل يرفع **التصنيف** إلى السطح — وهو يختلف بين المقالات فتتمايز البطاقات،
 * ويقول للزائر نوع ما سيقرأ قبل أن يقرأ العنوان.
 *
 * ⚠️ **والطباعة على السُلَّم**: كانت `text-body-lg/sm/xs` ورماديّ Tailwind
 * (`ink/500/400`) — وهما بندان يعدّهما حارس نظام التصميم انحرافاً، لأنّ
 * المقاس يُختار بالذوق كل مرّة والنصّ يفقد كحليّ الهوية.
 */
/** أسطح الغلاف البديلة — تدور بمعرّف المقال فلا يتشابه صفّ البطاقات. */
const COVER_SURFACES = [
  "bg-gradient-to-br from-primary-400/90 via-primary-500 to-primary-700",
  "bg-gradient-to-tr from-primary-600 via-primary-500 to-primary-300/80",
  "bg-gradient-to-b from-primary-400 to-primary-800",
];

export function BlogCard({ a }: { a: BlogCardData }) {
  return (
    <Link
      href={`/blog/${a.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-e1 ring-1 ring-ink/[0.06] transition-all duration-200 hover:shadow-e3 hover:ring-ink/[0.10]"
    >
      <div className="relative h-44 overflow-hidden bg-primary-500">
        {a.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.cover_image}
            alt=""
            aria-hidden
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* ⚠️ **التصنيف كان أكبر من العنوان** (26 بكسل مقابل 15): قلبٌ
             للتراتبية — العين تقرأ «نصائح ومقالات» قبل موضوع المقال، والبطاقتان
             من التصنيف نفسه تبدوان نسخةً واحدة. الآن شريحةٌ صغيرة، والسطح
             يتفاوت بمعرّف المقال فيتمايز الصفّ. */
          <span
            aria-hidden
            className={`absolute inset-0 ${COVER_SURFACES[a.id % COVER_SURFACES.length]}`}
          />
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-caption font-bold text-primary">
          {a.category_display}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-body font-bold leading-snug text-ink line-clamp-2 transition-colors group-hover:text-primary-400">
          {a.title}
        </h3>
        <p className="mt-1.5 flex-1 text-caption text-muted line-clamp-2">{a.excerpt}</p>
        <div className="mt-3 flex items-center gap-2 text-caption text-muted/70">
          <span className="truncate">{a.author_name}</span>
          <span aria-hidden>·</span>
          <span className="flex-shrink-0 tabular-nums">{a.reading_minutes} دقائق قراءة</span>
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
            className={`px-4 py-2 rounded-full text-body font-medium transition-colors ${on ? "bg-primary text-white" : "bg-white text-muted-600 border border-muted-200 hover:border-primary"}`}>
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
