import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import PropertiesListClient from "@/app/properties/PropertiesListClient";
import { marketByCode } from "@/lib/serverMarket";
import { MARKETS } from "@/lib/markets";

/**
 * عقارات للبيع والإيجار في السوق — صفحة **داخل سوق**.
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
  const title = `عقارات للبيع والإيجار في ${m.nameAr}`;
  const description = `شقق وفلل وأراضٍ للبيع والإيجار في ${m.nameAr} — ${cities} وغيرها. تواصل مباشر مع صاحب العقار بلا عمولة.`;
  return {
    title: { absolute: `${title} | مسكني` },
    description,
    // ⚠️ **السوق الفارغ لا يُفهرَس.** صفحة قائمة بلا عنصر واحد محتوى رقيق:
    // جوجل يردّ عليها بـ«اكتُشفت ولم تُفهرَس» ويستهلك ميزانية زحفنا، وملفّ
    // أدسنس عندنا رُفض مرّة بسبب «شاشات بلا محتوى ناشر». تُفتح الفهرسة تلقائياً
    // بأوّل عقار يُنشر — لا حاجة لتدخّل.
    robots: m.count > 0 ? undefined : { index: false, follow: true },
    alternates: { canonical: `/${market}/properties` },
    openGraph: { title, description, url: `/${market}/properties`, siteName: "مسكني", locale: "ar_AR" },
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
      {/* ⚠️ **حُذفت الكتلة التعريفية وقسم «أحدث العقارات» بأمر المالك.**
          كانتا محتوى الصفحة المفهرَس (h1 + فقرة + روابط عميقة للزحف)، فنُقل
          دور `h1` إلى سطر العدد داخل الشريط كي لا تبقى الصفحة بلا عنوان. */}
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-muted">جارِ التحميل…</div>}>
        <PropertiesListClient />
      </Suspense>
    </>
  );
}
