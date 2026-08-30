import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/seo";
import LandingClient, { type Market } from "./LandingClient";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  الصفحة الأولى — بوّابة مسكني العالمية
 * ════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **هذه ليست واجهة سوق، بل مدخله.** السوق يبدأ بعد اختيار الدولة (`/ye`
 * `/sa` …). لذلك لا قوائم عقارات هنا ولا شريط بحث: مهمّة الصفحة أن تقول ما
 * تقدّمه المنصّة وأين تعمل، ثم تُسلّم الزائر إلى سوقه.
 *
 * ⚠️ **ولماذا تغيّرت أصلاً:** كانت `/` تُعيد الكتابة إلى `/market/<code>`
 * الحاملة `noindex`، فورثته وخرجت من فهرس جوجل («Excluded by 'noindex' tag»
 * — مُتحقَّق 2026‑08‑30)، وضاع استعلام «مسكني» (٩٨ ظهوراً · نقرتان). وكان
 * الزاحف — من عناوين أمريكية — يُوجَّه إلى سوق السعودية وفيه **صفر عقار**.
 *
 * ⚠️ **الأربع قدرات نصٌّ لا أزرار.** صفحة بمِلء الشاشة وخمسين كلمة صفحةٌ
 * رقيقة، ونحن رُفضنا من أدسنس مرّة بسبب «شاشات بلا محتوى ناشر». النصّ
 * التعريفيّ هو ما يجعلها صفحة حقيقية — وهو مُصيَّر على **الخادم** فيقرؤه
 * الزاحف بلا JavaScript. ولا وحدة إعلانية هنا إطلاقاً.
 *
 * ⚠️ **DOM واحد للجميع** — ممنوع تقديم محتوى للزاحف يختلف عمّا يراه الإنسان
 * (تمويه يُعاقَب عليه). فالفرق بين الاثنين حركةٌ لا محتوى.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export const revalidate = 3600;

const TITLE = "مسكني — عقارات وخدمات وطلبات في ستّة أسواق عربية";
const DESCRIPTION =
  "منصّة عقارية اجتماعية تصلك بصاحب العقار مباشرة: عقارات للبيع والإيجار، " +
  "ومزوّدو خدمات بتقييمات حقيقية، وطلبات تُعلن فيها ما تريد فيأتيك السوق. " +
  "اختر سوقك — اليمن أو السعودية أو الأردن أو مصر أو العراق أو عُمان.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "مسكني", "maskani", "عقارات", "عقارات اليمن", "عقارات السعودية",
    "خدمات عقارية", "طلبات عقارية", "شقق للإيجار", "أراضي للبيع",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE, description: DESCRIPTION, url: "/",
    siteName: "مسكني", locale: "ar_AR", type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

interface ApiCountry {
  id: number; code: string; slug: string; name_ar: string; name_en: string;
  flag_emoji: string; hero_image: string | null; hero_credit: string;
  tagline_ar: string; tagline_en: string; properties_count: number;
  cities?: { name_ar: string; name_en: string; latitude?: string | null; longitude?: string | null }[];
}

/**
 * الأسواق من الـAPI — لا قائمة مكتوبة في الشيفرة.
 *
 * ⚠️ فتح سوق سابع يجب أن يكون صفّاً في القاعدة لا نشرةَ شيفرة. وعند تعذّر
 * الـAPI نُرجع قائمة فارغة فتعرض الصفحة نصّها ودعوة الاتصال بدل أن تنهار.
 */
async function getMarkets(): Promise<Market[]> {
  // ⚠️ **محاولةٌ واحدة لا تكفي وقت البناء.** أوّل نشرة خرجت بلوحة أسواق
  // **فارغة**: صادف البناءُ إعادةَ تشغيل حاوية الـAPI، ففشل الجلب مرّةً واحدة
  // فخُبز الفراغ في صفحةٍ ساكنة عمرها ساعة. الصفحة الأهمّ عندنا لا تُترك
  // لمصادفة شبكة — ثلاث محاولات متباعدة، ثم رجوعٌ للمتصفّح في `LandingClient`.
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = await fetchMarkets();
    if (rows.length) return rows;
    await new Promise((r) => setTimeout(r, 1200));
  }
  return [];
}

async function fetchMarkets(): Promise<Market[]> {
  try {
    const res = await fetch(`${API}/cities/countries/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows: ApiCountry[] = Array.isArray(json) ? json : json.results || [];
    return rows.map((c) => ({
      code: c.code.toLowerCase(),
      slug: c.slug,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      flag: c.flag_emoji,
      image: c.hero_image,
      credit: c.hero_credit,
      taglineAr: c.tagline_ar || (c.cities || []).slice(0, 4).map((x) => x.name_ar).join(" · "),
      taglineEn: c.tagline_en || (c.cities || []).slice(0, 4).map((x) => x.name_en).join(" · "),
      count: c.properties_count || 0,
      // إحداثيّات العاصمة (أوّل مدينة بالترتيب) — تضع نقطة السوق على الكرة.
      lat: Number((c.cities || [])[0]?.latitude ?? 0) || null,
      lng: Number((c.cities || [])[0]?.longitude ?? 0) || null,
    }));
  } catch {
    return [];
  }
}

/** النبذات الأربع — نصٌّ تعريفيّ يُصيَّر على الخادم (محتوى الصفحة الحقيقي). */
const PILLARS = [
  {
    key: "properties",
    ar: { name: "العقارات", short: "شقق وأراضٍ وبيوت للبيع والإيجار، بتواصل مباشر مع صاحب العقار.",
          body: "شقق وأراضٍ وبيوت ومحلات للبيع والإيجار، بتواصل مباشر مع صاحب العقار — الصورة والسعر والموقع من مالكه لا من وسيط." },
    en: { name: "Properties", short: "Homes and land for sale and rent — straight from the owner.",
          body: "Apartments, land, houses and shops for sale and rent — you reach the owner directly, not a middleman." },
    href: "/properties",
  },
  {
    key: "services",
    ar: { name: "الخدمات", short: "مقاولون وفنّيون ومكاتب هندسية بتقييمات من عملاء حقيقيين.",
          body: "مقاولون وفنّيون ومكاتب هندسية وخدمات يومية في مدينتك، بتقييمات من عملاء حقيقيين وسجلّ أعمال ظاهر." },
    en: { name: "Services", short: "Contractors and technicians, with ratings from real clients.",
          body: "Contractors, technicians and everyday services in your city — with real client ratings and visible past work." },
    href: "/services",
  },
  {
    key: "requests",
    ar: { name: "طلبات العقارات", short: "لا تبحث — اكتب ما تريده وميزانيتك، فيأتيك أصحاب العقارات.",
          body: "لا تبحث بنفسك: اكتب ما تريده وميزانيتك ومدينتك، ويصلك أصحاب العقارات المطابقة بعروضهم." },
    en: { name: "Property requests", short: "Post what you need — matching owners come to you.",
          body: "Stop searching: post what you need and your budget, and matching owners come to you." },
    href: "/requests",
  },
  {
    key: "jobs",
    ar: { name: "طلبات الخدمات", short: "اطلب صيانة أو نقلاً أو تصميماً، وقارِن عروض المزوّدين.",
          body: "اطلب خدمة — صيانة أو نقل أو تصميم — واستقبل عروض المزوّدين المناسبين لمدينتك وقارِن بينها." },
    en: { name: "Service requests", short: "Request a service and compare providers' offers.",
          body: "Ask for a service — repair, moving, design — and compare offers from providers in your city." },
    href: "/jobs",
  },
];

export default async function GlobalLanding() {
  const markets = await getMarkets();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "مسكني",
          alternateName: "Maskani",
          url: SITE_URL,
          inLanguage: ["ar", "en"],
          description: DESCRIPTION,
          publisher: {
            "@type": "Organization",
            name: "مسكني",
            url: SITE_URL,
            logo: `${SITE_URL}/icon.png`,
            areaServed: markets.map((m) => m.nameEn),
          },
        }}
      />
      <LandingClient markets={markets} pillars={PILLARS} />
    </>
  );
}
