import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { JsonLd } from "@/components/JsonLd";
import { homeFaq } from "@/lib/seo";
import HomeBlogLinks from "@/components/HomeBlogLinks";
import { detectMarket } from "@/lib/serverMarket";

const HomeClient = dynamic(() => import("./HomeClient"), { ssr: true });

/**
 * ⚠️ العنوان والوصف كانا مثبَّتين في `layout.tsx` على اليمن — «عقارات اليمن»،
 * «في صنعاء وعدن وتعز» — على منصّة تخدم ستّ دول. فزائر القاهرة يرى في نتيجة
 * البحث وعداً بسوقٍ ليس سوقه.
 *
 * هنا يُصيَّران من سوق الزائر كما يعرفه **الخادم** (ترويسة الوكيل)، فيصحّان
 * للزاحف وللمستخدم معاً.
 */
export async function generateMetadata(): Promise<Metadata> {
  const m = await detectMarket();
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
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", siteName: "مسكني", locale: "ar_AR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  // يُمرَّر إلى المكوّن العميل كقيمة ابتدائية: يُصيَّر بها الخادم **وأوّل تصيير
  // في المتصفّح** (فلا عدم تطابق ترطيب)، ثم يحلّ محلّها اختيار المستخدم المحفوظ
  // بعد تحميل السياق.
  const market = await detectMarket();

  return (
    <>
      {/* أسئلة شائعة (FAQ) — بيانات منظّمة تظهر كنتائج منسدلة في Google */}
      <JsonLd data={homeFaq} />
      <HomeClient serverMarket={market.nameAr} />
      {/* روابط داخلية خادمية من الرئيسية نحو مقالات المدوّنة */}
      <HomeBlogLinks />
    </>
  );
}
