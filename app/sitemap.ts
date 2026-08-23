import type { MetadataRoute } from "next";
import { citySlug } from "@/lib/seo";
import { getBlogCategories } from "@/lib/blogCategories";
import { TOOLS } from "@/lib/toolsMeta";
import { ALL_UNITS } from "@/lib/areaUnits";

const BASE = "https://maskani.homes";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Row {
  id: number;
  updated?: string | null;
  image?: string | null;
}

/**
 * يجلب **كل** صفوف مسار مُرقَّم، لا الصفحة الأولى وحدها.
 *
 * ⚠️ درسٌ من عطل حيّ (2026-08-23): كنّا نطلب `?limit=1000` والخادم يسقّف عند 100
 * (`StandardPagination.max_limit`)، فلم تحمل خريطة الموقع سوى **106 مقالاً من
 * 477** — أي أن 371 مقالاً نشرناها لم يعرفها جوجل أصلاً، بلا أي رسالة خطأ.
 * الطلب بحدٍّ أكبر من السقف لا يفشل، بل **يُقصّ بصمت** — وهذا أخطر أنواع العطل.
 */
async function fetchAll<T>(
  path: string,
  revalidate: number,
): Promise<T[]> {
  const PAGE = 100;
  const out: T[] = [];
  for (let offset = 0; offset < 10000; offset += PAGE) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${API}${path}${sep}limit=${PAGE}&offset=${offset}`, {
      next: { revalidate },
    });
    if (!res.ok) break;
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data.results ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

// يجلب عناصر قسم كاملةً لبناء خريطة الموقع الديناميكية — مع lastmod وصورة.
async function rows(path: string): Promise<Row[]> {
  try {
    const list = await fetchAll<{ id: number; updated_at?: string; created_at?: string; main_image?: string; first_image?: string }>(path, 3600);
    return list.map(
      (x) => ({
        id: x.id,
        updated: x.updated_at || x.created_at || null,
        image: x.main_image || x.first_image || null,
      }),
    );
  } catch {
    return [];
  }
}

// يجلب الدول لبناء صفحات هبوطها — أعلى طبقة في التسلسل الجغرافي، وهي ما
// يلتقط استعلامات «عقارات <الدولة>» في كل سوق نفتحه.
async function countries(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API}/cities/countries/?limit=100`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    return ((await res.json()).results ?? [])
      .map((c: { slug?: string }) => ({ slug: c.slug || "" }))
      .filter((c: { slug: string }) => c.slug);
  } catch {
    return [];
  }
}

// يجلب المدن لبناء صفحات هبوط المدن (SEO — الذيل الطويل: «عقارات في صنعاء»).
//
// ⚠️ **المدن الفارغة لا تدخل الخريطة.** صفحة المدينة تحمل `noindex` ما دامت بلا
// عقار (منعاً للمحتوى الرقيق)، وإرسالها في الخريطة رغم ذلك تناقضٌ صريح: نطلب
// من جوجل فهرسة ما منعناه، فيردّ بتقرير «مستثناة بعلامة noindex» — وهو ما وقع
// فعلاً في 2026-08-23 مع **292 مدينة**. القاعدة نفسها المطبَّقة على الأحياء.
// تعود المدينة إلى الخريطة تلقائياً بأوّل عقار يُنشر فيها.
async function cities(): Promise<{ slug: string }[]> {
  try {
    const data = { results: await fetchAll<{ name_en?: string; properties_count?: number }>("/cities/", 86400) };
    return (data.results ?? [])
      .map((c: { name_en?: string; properties_count?: number }) => ({
        slug: citySlug(c.name_en || ""),
        count: c.properties_count ?? 0,
      }))
      .filter((c: { slug: string; count: number }) => c.slug && c.count > 0);
  } catch {
    return [];
  }
}

// يجلب الأحياء المسجّلة — أعمق طبقة فهرسة بعد المحافظة («عقارات في حي السبل»).
async function neighborhoods(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API}/cities/neighborhoods/`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list
      .map((n: { slug?: string; properties_count?: number }) => ({
        slug: n.slug || "",
        count: n.properties_count ?? 0,
      }))
      // نُدرج الأحياء التي تحمل عقاراً واحداً على الأقل فقط: صفحة حيٍّ فارغة
      // يصنّفها جوجل «اكتُشفت — لم تُفهرَس» وتلتهم ميزانية الزحف، فتؤخّر فهرسة
      // الصفحات ذات المحتوى. تعود الصفحة إلى الخريطة تلقائياً بأوّل عقار فيها.
      .filter((n: { slug: string; count: number }) => n.slug && n.count > 0)
      .map((n: { slug: string }) => ({ slug: n.slug }));
  } catch {
    return [];
  }
}

// يجلب مقالات المدونة (slug + آخر تحديث) لخريطة الموقع.
async function blogArticles(): Promise<{ slug: string; updated: string | null }[]> {
  try {
    const list = await fetchAll<{ slug: string; published_at?: string }>("/blog/", 3600);
    return list.map(
      (a: { slug: string; published_at?: string }) => ({ slug: a.slug, updated: a.published_at || null }),
    );
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/properties`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/requests`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/reports`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...TOOLS.map((t) => ({
      url: `${BASE}/tools/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [properties, services, requests, jobs, reports, cityList, countryList, hoodList, blog, blogCats] = await Promise.all([
    rows("/properties/"),
    rows("/services/"),
    rows("/requests/"),
    rows("/jobs/"),
    rows("/reports/"),
    cities(),
    countries(),
    neighborhoods(),
    blogArticles(),
    getBlogCategories(),
  ]);

  const build = (
    items: Row[],
    prefix: string,
    changeFrequency: "daily" | "weekly",
    priority: number,
    withImages = false,
  ): MetadataRoute.Sitemap =>
    items.map((x) => ({
      url: `${BASE}${prefix}/${x.id}`,
      lastModified: x.updated ? new Date(x.updated) : now,
      changeFrequency,
      priority,
      ...(withImages && x.image ? { images: [x.image] } : {}),
    }));

  // صفحات هبوط الدول — /properties/country/<slug>
  const countryEntries: MetadataRoute.Sitemap = countryList.map((c) => ({
    url: `${BASE}/properties/country/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // صفحات هبوط المدن — /properties/city/<slug>
  const cityEntries: MetadataRoute.Sitemap = cityList.map((c) => ({
    url: `${BASE}/properties/city/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  // صفحات هبوط الأحياء — /properties/neighborhood/<slug>
  const hoodEntries: MetadataRoute.Sitemap = hoodList.map((n) => ({
    url: `${BASE}/properties/neighborhood/${encodeURIComponent(n.slug)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blog.map((b) => ({
    url: `${BASE}/blog/${b.slug}`,
    lastModified: b.updated ? new Date(b.updated) : now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  const blogCategoryEntries: MetadataRoute.Sitemap = blogCats.map((c) => ({
    url: `${BASE}/blog/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // صفحة لكل وحدة مساحة — كل واحدة تجيب سؤالاً مختلفاً يُبحث عنه في بلد مختلف.
  const unitEntries: MetadataRoute.Sitemap = ALL_UNITS.map((u) => ({
    url: `${BASE}/tools/area-converter/${u.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...unitEntries,
    ...staticEntries,
    ...countryEntries,
    ...cityEntries,
    ...hoodEntries,
    ...blogEntries,
    ...blogCategoryEntries,
    ...build(properties, "/properties", "daily", 0.7, true),
    ...build(services, "/services", "weekly", 0.6),
    ...build(requests, "/requests", "weekly", 0.5),
    ...build(jobs, "/jobs", "weekly", 0.5),
    ...build(reports, "/reports", "weekly", 0.5, true),
  ];
}
