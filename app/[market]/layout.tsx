import { notFound } from "next/navigation";
import { isMarket, MARKETS } from "@/lib/markets";
import { MarketSync } from "@/components/city/MarketSync";

/**
 * حدّ السوق — كل ما تحته ينتمي إلى دولة واحدة يحدّدها المسار.
 *
 * ⚠️ **العنوان هو مالك الدولة، لا التخزين المحلّي.** قبل هذا كان الزائر يختار
 * اليمن فيُفتح `/ye`، ثم يبدّل إلى السعودية من داخل الشاشات فيبقى العنوان
 * `/ye` والمحتوى سعوديّاً — رابطٌ يكذب على من يُشارَك معه، وصفحةٌ لا يعرف
 * جوجل لأي سوق يفهرسها. الآن التبديل **يفتح عنواناً آخر**، و`MarketSync`
 * يفرض ما في المسار على السياق فلا يبقى مصدران للحقيقة.
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
      <MarketSync market={market} />
      {children}
    </>
  );
}
