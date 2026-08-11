/** تصنيفات المدونة — تُدار ديناميكياً من لوحة التحكم (جدول Category في الباك اند).
 * القائمة الثابتة أدناه احتياطية فقط (fallback) إن تعذّر جلب API. */
export interface BlogCategory {
  slug: string;
  label: string;
  description: string; // لوصف SEO لصفحة التصنيف
}

/** احتياطي — يطابق التصنيفات المبذورة أوّلاً (إن فشل جلب API لا تنكسر الصفحات). */
export const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: "city_guide", label: "أدلّة المدن", description: "أدلّة شاملة للعقارات في مدن ومحافظات اليمن — الأحياء والأسعار وطبيعة السوق ونصائح الشراء والإيجار." },
  { slug: "buying", label: "شراء العقارات", description: "كل ما تحتاجه لشراء عقار في اليمن — خطوات الشراء الآمن، التحقّق من الملكية، وتفادي الأخطاء الشائعة." },
  { slug: "renting", label: "استئجار العقارات", description: "أدلّة استئجار العقارات في اليمن — عقد الإيجار، حقوق المستأجر والمالك، ونصائح الباحثين عن سكن." },
  { slug: "market", label: "السوق والأسعار", description: "تحليلات وأدلّة سوق العقارات في اليمن — ما يحدّد الأسعار، توقيت الشراء، والاستثمار العقاري." },
  { slug: "safety", label: "الأمان وتجنّب الاحتيال", description: "احمِ نفسك من الاحتيال العقاري في اليمن — علامات النصب، التأجير المزدوج، وكيف تتحقّق قبل أن تدفع." },
  { slug: "tips", label: "نصائح ومقالات", description: "نصائح عقارية عملية في اليمن — اختيار الحيّ، بيع عقارك، الانتقال، واختيار مزوّدي الخدمات." },
];

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

/** يجلب التصنيفات المُفعّلة من الباك اند (ديناميكية) — مع fallback للقائمة الثابتة. */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    const res = await fetch(`${API}/blog/categories/`, { next: { revalidate: 600 } });
    if (!res.ok) return BLOG_CATEGORIES;
    const data = await res.json();
    const cats: BlogCategory[] = (Array.isArray(data) ? data : []).map(
      (c: { value: string; label: string; description?: string }) => ({
        slug: c.value,
        label: c.label,
        description: c.description || "",
      }),
    );
    return cats.length ? cats : BLOG_CATEGORIES;
  } catch {
    return BLOG_CATEGORIES;
  }
}

export const categoryLabel = (slug: string) =>
  BLOG_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
