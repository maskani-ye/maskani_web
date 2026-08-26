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
}

const FALLBACK: Market = {
  code: "YE",
  nameAr: "اليمن",
  slug: "yemen",
  cities: ["صنعاء", "عدن", "تعز"],
};

interface CountryRow {
  code: string;
  name_ar: string;
  slug: string;
  cities?: Array<{ name_ar: string }>;
}

async function allCountries(): Promise<CountryRow[]> {
  try {
    // عمر التخزين = عمر الصفحات التي تقرأ منه (ساعة). تخزينٌ أطول يُثبّت نتيجةً
    // فاشلة — وهي العلّة التي أفرغت خريطة الموقع من صفحات الدول.
    const res = await fetch(`${API}/cities/countries/?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()).results ?? [];
  } catch {
    return [];
  }
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
  };
}
