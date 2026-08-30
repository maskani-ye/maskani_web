import { headers } from "next/headers";

/**
 * سوق الزائر كما يعرفه **الخادم** — لا التخزين المحلّي.
 *
 * ⚠️ المشكلة التي يحلّها: صار كل نصّ في الرئيسية يتبع المدينة المحفوظة في
 * `localStorage`، وهي لا وجود لها على الخادم. ففحصُ الصفحة بلا JavaScript —
 * كما يراها زاحف جوجل — أظهر:
 *   H1  «ابحث عن مسكنك»   بلا مدينة
 *   H2  «عقارات منطقتك»   كلمة «منطقتك» حرفياً
 *   title «عقارات اليمن»  مثبّتة على سوق واحد من ستّة
 * أي أن تخصيص التجربة للمستخدم أفقدَ الصفحةَ إشارتَها للزاحف — والزاحف لا
 * يملك تخزيناً محلّياً أبداً.
 *
 * الحلّ: الوكيل (Cloudflare/Vercel) يضع دولة الزائر في ترويسة، فنقرأها ونصيّر
 * بها العنوان والوصف والعناوين. الزاحف يأتي غالباً من الولايات المتحدة فيقع
 * على السوق الافتراضي — وهو أفضل من «منطقتك» بما لا يُقاس.
 *
 * ولا نستعمل `/cities/detect-country/` هنا: تلك النقطة تقرأ ترويسة **طلبها
 * هي** لا طلب الزائر، فتُرجع دولة خادم الويب لا دولة الباحث.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export interface Market {
  code: string;
  nameAr: string;
  slug: string;
  /** أبرز مدن السوق — تُستعمل في الوصف والكلمات الدلالية */
  cities: string[];
  /** عدد العقارات المنشورة — **يقرّر فهرسة صفحات السوق**. */
  count: number;
  /** صورة السوق ونسب رخصتها — نفس صورة البوّابة، فيتّصل المشهدان. */
  heroImage: string | null;
  heroCredit: string;
}

const FALLBACK: Market = {
  code: "YE",
  nameAr: "اليمن",
  slug: "yemen",
  cities: ["صنعاء", "عدن", "تعز"],
  count: 0,
  heroImage: null,
  heroCredit: "",
};

interface CountryRow {
  code: string;
  name_ar: string;
  slug: string;
  hero_image?: string | null;
  hero_credit?: string;
  properties_count?: number;
  cities?: Array<{ name_ar: string }>;
}

/**
 * الدول من الـAPI — **بمحاولات متعدّدة**.
 *
 * ⚠️ **جلبةٌ واحدة فاشلة تُنتج عشرين صفحة 404.** حدث فعلاً في نشرة
 * 2026‑08‑30: تعثّر النداء أثناء البناء فرجعت قائمة فارغة، فأعادت
 * `marketByCode` قيمة `null` لكل سوق غير اليمن، فاستدعت الصفحات `notFound()`
 * و**خُبزت 404 في عشرين صفحة سوق** لساعة كاملة. الصفحة الساكنة تُخلّد الفشل،
 * فالإصرار على الجلب ليس ترفاً بل شرط صحّة.
 */
async function allCountries(): Promise<CountryRow[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = await fetchCountries(attempt);
    if (rows.length) return rows;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return [];
}

async function fetchCountries(attempt: number): Promise<CountryRow[]> {
  try {
    // عمر التخزين = عمر الصفحات التي تقرأ منه (ساعة). تخزينٌ أطول يُثبّت نتيجةً
    // فاشلة — وهي العلّة التي أفرغت خريطة الموقع من صفحات الدول.
    // بارامتر `_r` يكسر دمج `fetch` بين المحاولات فتتحقّق الإعادة فعلاً.
    const url = attempt === 0
      ? `${API}/cities/countries/?limit=100`
      : `${API}/cities/countries/?limit=100&_r=${attempt}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
}

/**
 * يطابق رمز دولة برأس القائمة المفعّلة. يُستعمل من مسار السوق المبنيّ مسبقاً
 * (`/market/<code>`) حيث يأتي الرمز من عنوان المسار لا من ترويسة الطلب — فلا
 * يلمس `headers()` ولا يُخرج المسار من التخزين.
 */
export async function marketByCode(code: string): Promise<Market | null> {
  const list = await allCountries();
  if (!list.length) {
    return code.toUpperCase() === FALLBACK.code ? FALLBACK : null;
  }
  const hit = list.find((c) => c.code?.toUpperCase() === code.toUpperCase());
  if (!hit) return null;
  return {
    code: hit.code,
    nameAr: hit.name_ar,
    slug: hit.slug,
    cities: (hit.cities ?? []).slice(0, 3).map((c) => c.name_ar),
    count: hit.properties_count ?? 0,
    heroImage: hit.hero_image ?? null,
    heroCredit: hit.hero_credit ?? "",
  };
}

/** يقرأ ترويسة الوكيل ويطابقها بالدول المفعّلة. لا يفشل أبداً — يقع على الافتراضي. */
export async function detectMarket(): Promise<Market> {
  let code = "";
  try {
    const h = await headers();
    code = (
      h.get("cf-ipcountry") ||
      h.get("x-vercel-ip-country") ||
      ""
    ).toUpperCase();
  } catch {
    /* خارج سياق طلب — نقع على الافتراضي */
  }

  const list = await allCountries();
  if (!list.length) return FALLBACK;

  const hit = list.find((c) => c.code?.toUpperCase() === code) ?? list[0];
  return {
    code: hit.code,
    nameAr: hit.name_ar,
    slug: hit.slug,
    cities: (hit.cities ?? []).slice(0, 3).map((c) => c.name_ar),
    count: hit.properties_count ?? 0,
    heroImage: hit.hero_image ?? null,
    heroCredit: hit.hero_credit ?? "",
  };
}
