import type { Metadata } from "next";
import dynamicImport from "next/dynamic";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { homeFaq } from "@/lib/seo";
import HomeBlogLinks from "@/components/HomeBlogLinks";
import { marketByCode } from "@/lib/serverMarket";

const HomeClient = dynamicImport(() => import("../../HomeClient"), { ssr: true });

/**
 * ════════════════════════════════════════════════════════════════════════
 *  الرئيسية — نسخة السوق (تُخدَم على المسار `/`)
 * ════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **لماذا مسارٌ داخليّ بدل `headers()` في الرئيسية:**
 * كانت الرئيسية تقرأ دولة الزائر بـ`headers()` كي يرى الزاحف نصّاً صحيحاً بدل
 * «عقارات منطقتك». لكن `headers()` تُخرج المسار من التخزين نهائياً
 * (`cache-control: no-store`)، فقِسنا بعده على الجوّال:
 *      TTFB 3,487 م.ث · LCP 3,948 م.ث   (عتبة جوجل 2,500)
 *
 * هنا نجمع الاثنين: الحافة (middleware) تقرأ الترويسة — وهي رخيصة — وتعيد
 * الكتابة إلى هذا المسار، وهو **مبنيّ مسبقاً لكل سوق** فيُخدَم من التخزين.
 * الرابط الظاهر يبقى `/` لأنها إعادة كتابة لا تحويل.
 *
 * ⚠️ **لا يُفهرَس هذا المسار**: العنوان الأساسي `/` وحده (canonical)، وهذه
 * النسخ ستّ صفحات بمحتوى شبه متطابق. `noindex` هنا + `Disallow` في robots
 * يمنعان تكرار المحتوى، والزاحف يصل عبر `/` فيقع على النسخة الصحيحة تلقائياً.
 */

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return ["ye", "sa", "jo", "eg", "iq", "om"].map((market) => ({ market }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ market: string }> },
): Promise<Metadata> {
  const { market } = await params;
  const m = await marketByCode(market);
  if (!m) return {};
  const cities = m.cities.length ? m.cities.join(" و") : "";

  const title = `مسكني — عقارات ${m.nameAr}: تواصل مع صاحب العقار مباشرة`;
  const description =
    `شقق وأراضٍ وفلل للبيع والإيجار${cities ? ` في ${cities} وبقيّة المدن` : ` في ${m.nameAr}`}، ` +
    `ومقاولون وفنيّون بتقييمات حقيقية، وبلاغات احتيال تحميك قبل أن تدفع — ` +
    `مجّاناً وبلا عمولة وبلا وسيط.`;

  return {
    title,
    description,
    keywords: [
      "عقارات",
      `عقارات ${m.nameAr}`,
      `مسكني ${m.nameAr}`,
      ...m.cities.map((c) => `عقارات ${c}`),
      ...m.cities.map((c) => `شقق للإيجار في ${c}`),
      "شقق للبيع", "أراضي", "فلل", "محلات تجارية",
      "خدمات عقارية", "مقاول", "طلبات عقارية",
      "بلاغات احتيال عقاري", "مسكني", "maskani",
    ],
    // العنوان الأساسي هو `/` دائماً — النسخ الستّ لا تُفهرَس بذاتها.
    alternates: { canonical: "/" },
    robots: { index: false, follow: true },
    openGraph: {
      title, description, url: "/", siteName: "مسكني",
      locale: "ar_AR", type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MarketHome(
  { params }: { params: Promise<{ market: string }> },
) {
  const { market } = await params;
  const m = await marketByCode(market);
  if (!m) notFound();

  return (
    <>
      {/* أسئلة شائعة (FAQ) — بيانات منظّمة تظهر كنتائج منسدلة في Google */}
      <JsonLd data={homeFaq} />
      {/* `serverMarket` يُصيَّر به الخادم **وأوّل تصيير في المتصفّح** (فلا عدم
          تطابق ترطيب)، ثم يحلّ محلّه اختيار المستخدم المحفوظ بعد تحميل السياق. */}
      <HomeClient serverMarket={m.nameAr} />
      <HomeBlogLinks />
    </>
  );
}
