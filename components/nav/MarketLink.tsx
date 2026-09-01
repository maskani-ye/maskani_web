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
 * ⚠️ **ولا يُترك الرابط مجرّداً على صفحةٍ غير سوقية.** على `/tools` و`/blog`
 * و`/about` لا يحمل المسار سوقاً، فكان المكوّن يُصدِر `/properties` — وهو
 * **مسارٌ يُحوَّل 308**. فيقرأ الزاحف رابطاً داخلياً إلى تحويلة في كل صفحةٍ
 * عابرة للأسواق، ومنها صفحات الأدوات التي تحمل وحدها **22,263 ظهوراً** في
 * ثلاثين يوماً. الرابط الداخليّ إلى تحويلة يبدّد سُلطتها ويبطئ الزحف.
 *
 * الحلّ يفصل ما يراه الزاحف عمّا يذهب إليه المستخدم: **التصيير الأوّل** (وهو
 * ما يُخزَّن ويُقرأ آلياً) يحمل السوق الافتراضيّ — رابطٌ حقيقيّ يردّ 200 —
 * ثمّ يُبدَّل بعد الترطيب إلى سوق الزائر من كعكة `mk_market`. فلا مسار مُحوَّل
 * في HTML، ولا مستخدمٌ يُنقل إلى سوقٍ ليس سوقه.
 *
 * ⚠️ **ولا تُبادَأ إلا جذور الأقسام**: `/properties` → `/sa/properties`، أمّا
 * `/properties/123` فتبقى كما هي — العقار كيانٌ واحد لا نسخة لكل سوق، وبادئةٌ
 * له تعني مساراً غير موجود (404). وكذلك `/blog` و`/about` و`/auth` وغيرها:
 * محتوى عابرٌ للأسواق لا يُبادَأ.
 */

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useEffect, useState } from "react";
import { DEFAULT_MARKET, isMarket, splitMarket } from "@/lib/markets";

/** الأقسام التابعة لسوق — جذورها وحدها تُبادَأ. */
const SECTION_ROOT = /^\/(properties|services|requests|jobs)(\?.*)?$/;

export function useMarketHref() {
  const pathname = usePathname();
  const { market: fromPath } = splitMarket(pathname || "/");

  // سوق الكعكة يُقرأ **بعد الترطيب** لا أثناء التصيير: قراءته في التصيير
  // تُنتج اختلافاً بين ما يُصيّره الخادم وما يُصيّره المتصفّح.
  const [fromCookie, setFromCookie] = useState<string | null>(null);
  useEffect(() => {
    if (fromPath) return;
    const m = document.cookie.match(/(?:^|;\s*)mk_market=([a-z]{2})/i);
    if (m && isMarket(m[1].toLowerCase())) setFromCookie(m[1].toLowerCase());
  }, [fromPath]);

  const market =
    (fromPath && isMarket(fromPath) && fromPath) || fromCookie || DEFAULT_MARKET;

  return (href: string): string => {
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
