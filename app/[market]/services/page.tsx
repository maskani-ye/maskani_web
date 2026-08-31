import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServicesListClient from "@/app/services/ServicesListClient";
import RecentItemsLinks from "@/components/RecentItemsLinks";
import { marketByCode } from "@/lib/serverMarket";
import { MARKETS } from "@/lib/markets";

/**
 * مزوّدو الخدمات العقارية في السوق — صفحة **داخل سوق**.
 *
 * ⚠️ **النصّ يتبع السوق ولا يُكتب فيه اسم بلدٍ ثابت.** كانت النسخة العامّة
 * تقول «في اليمن» حرفياً، فكان زائر السعودية يقرأ عنواناً يخصّ بلداً آخر —
 * وجوجل يفهرس صفحةً واحدة لستّة أسواق. هنا الاسم والمدن من الـAPI لكل سوق.
 *
 * ⚠️ **السوق الفارغ لا يُفهرَس**: صفحة قائمة بلا عناصر محتوى رقيق، وإرسالها
 * إلى جوجل يعود بتقرير «اكتُشفت ولم تُفهرَس» ويستهلك ميزانية الزحف.
 */
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return MARKETS.map((market) => ({ market }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ market: string }> },
): Promise<Metadata> {
  const { market } = await params;
  const m = await marketByCode(market);
  if (!m) return {};
  const cities = m.cities.join(" و") || m.nameAr;
  const title = `مزوّدو الخدمات العقارية في ${m.nameAr}`;
  const description = `مقاولون وفنّيون ومهندسون في ${m.nameAr} — ${cities} وغيرها، بتقييمات حقيقية وتواصل مباشر.`;
  return {
    title: { absolute: `${title} | مسكني` },
    description,
    // ⚠️ **السوق الفارغ لا يُفهرَس.** صفحة قائمة بلا عنصر واحد محتوى رقيق:
    // جوجل يردّ عليها بـ«اكتُشفت ولم تُفهرَس» ويستهلك ميزانية زحفنا، وملفّ
    // أدسنس عندنا رُفض مرّة بسبب «شاشات بلا محتوى ناشر». تُفتح الفهرسة تلقائياً
    // بأوّل عقار يُنشر — لا حاجة لتدخّل.
    robots: m.count > 0 ? undefined : { index: false, follow: true },
    alternates: { canonical: `/${market}/services` },
    openGraph: { title, description, url: `/${market}/services`, siteName: "مسكني", locale: "ar_AR" },
  };
}

export default async function MarketSectionPage(
  { params }: { params: Promise<{ market: string }> },
) {
  const { market } = await params;
  const m = await marketByCode(market);
  if (!m) notFound();
  const cities = m.cities.join(" و") || m.nameAr;

  return (
    <>
      {/* الكتلة التعريفية حُذفت كما في العقارات — `h1` انتقل إلى سطر العدد. */}
      <ServicesListClient />
      <RecentItemsLinks endpoint="/services/" hrefPrefix="/services" heading="أحدث مزوّدي الخدمات" />
    </>
  );
}
