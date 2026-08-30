"use client";

/**
 * رابطٌ يعرف سوق الزائر — بديل `next/link` في كل صفحات المستخدم.
 *
 * ⚠️ **المشكلة التي يحلّها**: صار لكل سوق مسارُه (`/sa/properties`)، لكن
 * روابط المنصّة بقيت مجرّدة (`/properties`) في **ثلاثين موضعاً**. فكل نقرة
 * على «العقارات» تُخرج الزائر من سوقه إلى تحويلٍ من الحافة (308) يعيده إلى
 * سوق الكعكة — أو إلى السوق الافتراضي إن لم تكن. تعديل ثلاثين موضعاً يدوياً
 * يُصلح اليوم ويترك الغد: أوّل رابط جديد يكتبه أحدنا يعود إلى العطل نفسه.
 *
 * ⚠️ **ولا تُبادَأ إلا جذور الأقسام**: `/properties` → `/sa/properties`، أمّا
 * `/properties/123` فتبقى كما هي — العقار كيانٌ واحد لا نسخة لكل سوق، وبادئةٌ
 * له تعني مساراً غير موجود (404). وكذلك `/blog` و`/about` و`/auth` وغيرها:
 * محتوى عابرٌ للأسواق لا يُبادَأ.
 */

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { isMarket, splitMarket } from "@/lib/markets";

/** الأقسام التابعة لسوق — جذورها وحدها تُبادَأ. */
const SECTION_ROOT = /^\/(properties|services|requests|jobs)(\?.*)?$/;

export function useMarketHref() {
  const pathname = usePathname();
  const { market } = splitMarket(pathname || "/");
  return (href: string): string => {
    if (!market || !isMarket(market)) return href;
    const m = SECTION_ROOT.exec(href);
    return m ? `/${market}/${m[1]}${m[2] ?? ""}` : href;
  };
}

type Props = React.ComponentProps<typeof NextLink>;

export const MarketLink = forwardRef<HTMLAnchorElement, Props>(function MarketLink(
  { href, ...rest }, ref,
) {
  const withMarket = useMarketHref();
  const next = typeof href === "string" ? withMarket(href) : href;
  return <NextLink ref={ref} href={next} {...rest} />;
});

export default MarketLink;
