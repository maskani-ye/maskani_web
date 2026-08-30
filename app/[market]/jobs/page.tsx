import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobsListClient from "@/app/jobs/JobsListClient";
import SectionIntro from "@/components/SectionIntro";
import { marketByCode } from "@/lib/serverMarket";
import { MARKETS } from "@/lib/markets";

/**
 * طلبات الخدمات في السوق — صفحة **داخل سوق**.
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
  const title = `طلبات الخدمات في ${m.nameAr}`;
  const description = `طلبات خدمات حقيقية في ${m.nameAr} — صيانة ونقل وتصميم في ${cities} وغيرها.`;
  return {
    title: { absolute: `${title} | مسكني` },
    description,
    // ⚠️ **السوق الفارغ لا يُفهرَس.** صفحة قائمة بلا عنصر واحد محتوى رقيق:
    // جوجل يردّ عليها بـ«اكتُشفت ولم تُفهرَس» ويستهلك ميزانية زحفنا، وملفّ
    // أدسنس عندنا رُفض مرّة بسبب «شاشات بلا محتوى ناشر». تُفتح الفهرسة تلقائياً
    // بأوّل عقار يُنشر — لا حاجة لتدخّل.
    robots: m.count > 0 ? undefined : { index: false, follow: true },
    alternates: { canonical: `/${market}/jobs` },
    openGraph: { title, description, url: `/${market}/jobs`, siteName: "مسكني", locale: "ar_AR" },
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
      <SectionIntro title={`طلبات الخدمات في ${m.nameAr}`}>
        {`طلبات خدمات من عملاء في ${m.nameAr}: صيانة ونقل وتصميم وبناء في ${cities} وغيرها. إن كنت مزوّد خدمة فاطّلع على الطلبات وقدّم عرضك مباشرةً لصاحب الطلب.`}
      </SectionIntro>
      <JobsListClient />
    </>
  );
}
