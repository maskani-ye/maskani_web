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
  // ⚠️ **صفحاتٌ متوازية لا متتابعة — خريطة الموقع تجاوزت ٦٠ ثانية.**
  // كانت تجلب ١٠٠ صفّ ثم الذي بعده حتى النهاية: ٦ آلاف عقار = ٦١ طلباً على
  // التوالي، كلٌّ منها يعبر إلى قاعدةٍ في الرياض. نجحت الخريطة في المحاولة الثالثة
  // بعد مهلتين (2026-09-14)، والعقارات تزيد مئاتٍ كل أسبوع — فكان سقوط البناء
  // مسألة وقت. الصفحة الأولى تحمل `count`، فتُطلب البقية معاً بسقف تزامنٍ
  // (لا ٦٠ طلباً دفعةً على عاملٍ واحد) وتُرتَّب كما هي.
  const CONCURRENCY = 6;
  const sep = path.includes("?") ? "&" : "?";

  async function page(offset: number): Promise<{ rows: T[] | null; count: number | null }> {
    const url = `${API}${path}${sep}limit=${PAGE}&offset=${offset}`;
    // ⚠️ بناء الخريطة يُصدر عشرات الطلبات دفعةً واحدة فيصطدم بخنق الخادم
    // (رصدنا 1,731 استجابة 429 أثناء بناءٍ واحد). التوقّف عند أوّل رفض يعني
    // خريطةً ناقصة بصمت — فنُعيد المحاولة بتباطؤ متزايد بدل الاستسلام.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
      // ترويسة داخلية تُعفي بناءنا من خنق الزائر المجهول — سرٌّ لا يملكه غيرنا.
      const res = await fetch(url, {
        next: { revalidate },
        headers: process.env.INTERNAL_API_TOKEN
          ? { "X-Maskani-Internal": process.env.INTERNAL_API_TOKEN }
          : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return { rows: data, count: null };
        return { rows: data.results ?? [], count: typeof data.count === "number" ? data.count : null };
      }
    }
    return { rows: null, count: null };
  }

  const first = await page(0);
  if (first.rows === null) return [];   // فشلٌ مستمرّ — نكتفي بما جمعناه
  // مصفوفة خام أو بلا `count`: لا نعرف عدد الصفحات — نبقى على التتابع القديم.
  if (first.count === null) {
    const out = [...first.rows];
    for (let offset = PAGE; offset < 10000 && out.length === offset; offset += PAGE) {
      const r = await page(offset);
      if (r.rows === null) break;
      out.push(...r.rows);
      if (r.rows.length < PAGE) break;
    }
    return out;
  }

  const total = Math.min(first.count, 10000);
  const offsets: number[] = [];
  for (let o = PAGE; o < total; o += PAGE) offsets.push(o);
  const pages: (T[] | null)[] = new Array(offsets.length).fill(null);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, offsets.length) }, async () => {
      while (next < offsets.length) {
        const k = next++;
        pages[k] = (await page(offsets[k])).rows;
      }
    }),
  );
  const out = [...first.rows];
  for (const rows of pages) {
    if (rows === null) break;   // فشلٌ مستمرّ — نكتفي بما جمعناه (كالسابق)
    out.push(...rows);
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
async function countries(): Promise<{ slug: string; code: string; count: number }[]> {
  try {
    // ⚠️ عمر الجلب = عمر الخريطة (3600). كان 86400 فبقيت نتيجةٌ فاشلة محفوظة
    // يوماً كاملاً، فخرجت الخريطة بـ**صفر صفحة دولة** رغم أن الـAPI يردّ بستّ.
    // نفس نمط العطل الذي أثبت صفحات الدول على 404: تخزينٌ يفوق عمر ما يقرأ منه.
    const res = await fetch(`${API}/cities/countries/?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return ((await res.json()).results ?? [])
      .map((c: { slug?: string; code?: string; properties_count?: number }) => ({
        slug: c.slug || "", code: (c.code || "").toLowerCase(),
        count: c.properties_count ?? 0,
      }))
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
// ⚠️ ساعة لا يوم: الحارس `audit-notfound-cache` يقيس `revalidate:` المكتوبة حرفياً
// ولا يرى العمر المُمرَّر وسيطاً لـ`fetchAll` — فبقي جلب المدن ٨٦٤٠٠ ثانية بلا
// إنذار، وهو بالضبط ما خرجت به الخريطة يوماً بصفر صفحة دولة (فشلٌ محفوظٌ يوماً).
async function cities(): Promise<{ slug: string }[]> {
  try {
    const data = { results: await fetchAll<{ name_en?: string; properties_count?: number }>("/cities/", 3600) };
    return (data.results ?? [])
      .map((c: { name_en?: string; properties_count?: number }) => ({
        slug: citySlug(c.name_en || ""),
        count: c.properties_count ?? 0,
      }))
          // ⚠️ **العتبة ثلاثة لا واحد.** صفحةٌ بعقارٍ واحد لا تستحقّ الفهرسة،
    // وتقديمُها يُثقل الموقع بصفحاتٍ هزيلة — وهو سبب رفض أدسنس ٢٠٢٦-٠٩-١٠.
    // العتبة نفسها في `robots` بالصفحتين، فلا يتناقض ما نُقدّمه مع ما نسمح به.
    .filter((c: { slug: string; count: number }) => c.slug && c.count >= 3);
  } catch {
    return [];
  }
}

// يجلب الأحياء المسجّلة — أعمق طبقة فهرسة بعد المحافظة («عقارات في حي السبل»).
async function neighborhoods(): Promise<{ slug: string }[]> {
  try {
    // ⚠️ **`has_properties=1` لا القائمة كاملة.** الردّ الكامل ٣ م.ب — فوق سقف
    // تخزين Next (٢ م.ب) — فلا يُخزَّن، ويُنزَّل في كل محاولة حتى تنتهي المهلة
    // ويسقط البناء كلّه. والخريطة لا تُدرج إلا ما له مخزون أصلاً، فالمرشّح يعيد
    // ٢٨٧ ك.ب بدل ٣ م.ب: أخفّ وأدقّ معاً.
    const res = await fetch(`${API}/cities/neighborhoods/?has_properties=1`,
                            { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list
      .map((n: { slug?: string; properties_count?: number }) => ({
        slug: n.slug || "",
        count: n.properties_count ?? 0,
      }))
      // ⚠️ **العتبة ثلاثة لا واحد.** صفحة حيٍّ فارغة يصنّفها جوجل «اكتُشفت —
      // لم تُفهرَس» فتلتهم ميزانية الزحف، وصفحةُ حيٍّ بعقارٍ واحد لا تختلف
      // عنها كثيراً: لا يُشتقّ منها سعرٌ وسيط ولا مقارنة. وبها رُفض الموقع في
      // أدسنس بوصف «محتوى غير ذي قيمة» (٢٠٢٦-٠٩-١٠). تعود الصفحة تلقائياً
      // بثالث عقارٍ يُنشر فيها — بلا تدخّل يدويّ.
      .filter((n: { slug: string; count: number }) => n.slug && n.count >= 3)
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

// تُعاد الخريطة كل ساعة: بناءٌ واحد فاشل (خنق أو عطل عابر) لا يجوز أن يُجمّد
// خريطة الموقع ناقصةً إلى الأبد.
// ⚠️ **تُولَّد عند الطلب لا وقت البناء.** تجاوزت الخريطة مهلة الستّين ثانية في
// البناء مرّتين ثمّ مرّةً بعد الجلب المتوازي (2026-09-14): ٦٬٠٢٥ عقاراً على
// ٦١ صفحة، تتزاحم مع ٨٤٤ صفحة تُولَّد في الوقت نفسه على عاملٍ واحد في الخادم.
// زيادة التوازي تزيد الزحام، ورفع المهلة يخفيه حتى يسقط البناء مع نموّ العقارات.
// عند الطلب لا زحام: أوّل طلبٍ بعد النشر بطيء (ضمن مهلة المنصّة)، والجلبات
// نفسها مخزّنة ساعةً (`next: { revalidate }`) فما بعده سريع.
// ⚠️ **ولا يُضاف `revalidate` هنا**: `force-dynamic` يُلغيه (يجعله صفراً)،
// فيبدو السطران ضبطاً وهما تناقض. تخزين الحافّة يُضبط بترويسة صريحة في
// `next.config.mjs` — انظر `headers()` هناك.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    // ⚠️ الأقسام الأربعة **لم تعد عناوين مستقلّة**: صارت تابعة لسوق
    // (`/ye/properties`) وتُبعث في `marketEntries`. وإرسال `/properties` هنا
    // بعد أن صارت تُحوَّل بـ308 يعني إخبار جوجل بفهرسة عنوانٍ يُعيد التوجيه —
    // تقريرٌ أحمر بلا فائدة.
    { url: `${BASE}/reports`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...TOOLS.map((t) => ({
      url: `${BASE}/tools/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    // صفحة المكاتب العقارية — مدخل المخزون، فأولويتها أعلى من الصفحات التعريفية.
    { url: `${BASE}/offices`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
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

  // الأسواق — /ye /sa … الصفحة الأولى لكل سوق.
  //
  // ⚠️ دخلت الخريطة بعد أن صارت **مفهرسة**: كانت تُخدَم على `/` بوسم `noindex`
  // فأخرجت الرئيسية نفسها من الفهرس. الأولوية 0.9 — أعلى من صفحة هبوط الدولة
  // لأنها واجهة السوق لا قائمة عقاراته وحدها.
  const marketEntries: MetadataRoute.Sitemap = countryList
    .filter((c) => c.code)
    .flatMap((c) => [
      {
        url: `${BASE}/${c.code}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      // أقسام السوق الأربعة — كلٌّ صفحة قائمة قائمة بذاتها بنصّها ومدنها.
      //
      // ⚠️ **لا تُرسَل أقسام سوقٍ فارغ**: صفحاتها تحمل `noindex` (محتوى رقيق)،
      // وإرسال ما منعناه تناقضٌ يعود بتقرير «مستثناة بعلامة noindex».
      ...(c.count > 0 ? ["properties", "services", "requests", "jobs"] : []).map((sec) => ({
        url: `${BASE}/${c.code}/${sec}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ]);

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
    ...marketEntries,
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
