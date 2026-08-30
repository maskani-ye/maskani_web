import { notFound } from "next/navigation";
import { isMarket, MARKETS } from "@/lib/markets";

/**
 * حدّ السوق — كل ما تحته ينتمي إلى دولة واحدة يحدّدها المسار.
 *
 * ⚠️ **العنوان هو مالك الدولة، لا التخزين المحلّي.** والملكيّة تقع في
 * `CountryProvider` نفسه: يقرأ السوق من المسار **تزامنياً** فيصحّ أوّل طلب.
 *
 * كان هنا مكوّن `MarketSync` يصحّح السياق بعد تحميل قائمة الدول — فتسبقه
 * القوائم وتجلب بالدولة المحفوظة: يفتح الزائر `/sa` فيرى الأردن. مالكان
 * للحقيقة يعني سباقاً، وحلّه إسقاط أحدهما لا تسريعه.
 */
export function generateStaticParams() {
  return MARKETS.map((market) => ({ market }));
}

export default async function MarketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  // رمزٌ غير معروف تحت الجذر ليس سوقاً — 404 صريحة بدل صفحة سوق فارغة.
  if (!isMarket(market)) notFound();

  return (
    <>
      {children}
    </>
  );
}
