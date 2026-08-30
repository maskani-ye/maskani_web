import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RequestsListClient from "@/app/requests/RequestsListClient";
import SectionIntro from "@/components/SectionIntro";
import { marketByCode } from "@/lib/serverMarket";
import { MARKETS } from "@/lib/markets";

/**
 * طلبات العقارات في السوق — صفحة **داخل سوق**.
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
  const title = `طلبات العقارات في ${m.nameAr}`;
  const description = `ما يبحث عنه الناس في ${m.nameAr}: طلبات شراء وإيجار بميزانياتها ومدنها (${cities} وغيرها).`;
  return {
    title: { absolute: `${title} | مسكني` },
    description,
    // ⚠️ **السوق الفارغ لا يُفهرَس.** صفحة قائمة بلا عنصر واحد محتوى رقيق:
    // جوجل يردّ عليها بـ«اكتُشفت ولم تُفهرَس» ويستهلك ميزانية زحفنا، وملفّ
    // أدسنس عندنا رُفض مرّة بسبب «شاشات بلا محتوى ناشر». تُفتح الفهرسة تلقائياً
    // بأوّل عقار يُنشر — لا حاجة لتدخّل.
    robots: m.count > 0 ? undefined : { index: false, follow: true },
    alternates: { canonical: `/${market}/requests` },
    openGraph: { title, description, url: `/${market}/requests`, siteName: "مسكني", locale: "ar_AR" },
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
      <SectionIntro title={`طلبات العقارات في ${m.nameAr}`}>
        {`طلبات شراء وإيجار حقيقية من باحثين في ${m.nameAr}: اطّلع على ما يبحث عنه الناس في ${cities} وغيرها — النوع والميزانية والمدينة — وقدّم عرضك مباشرةً إن كان لديك ما يناسب.`}
      </SectionIntro>
      <RequestsListClient />
    </>
  );
}
