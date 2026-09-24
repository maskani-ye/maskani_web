import { formatPrice } from "@/lib/utils";
import type { MarketContextData } from "@/types";
import { ChartSquare, Ruler, Buildings3, HandMoney } from "@solar-icons/react";

/**
 * سياق السوق حول هذا العقار — حقائق محسوبة من مخزون المنصّة.
 *
 * ⚠️ **الغرض قيمةٌ للقارئ أوّلاً، وهو ما يجعله مقبولاً لدى جوجل ثانياً.** صفحة
 * العقار كانت بضع عشرات من الكلمات الفريدة فوق قالبٍ مكرّر — وهذا تعريف
 * «المحتوى منخفض القيمة» الذي أوقف أدسنس. والعلاج ليس حشواً مولَّداً (هو
 * بعينه ما عوقبنا عليه) بل **أرقاماً لا توجد في المصدر الأصليّ**: موقع السعر
 * من وسيط الحيّ والمدينة، وسعر المتر، والعائد الإيجاريّ المقدَّر.
 *
 * ⚠️ **ولا يُعرض شيءٌ لا نثق به.** الخادم يحجب كل مستوى عيّنته دون العتبة،
 * ويُلغي أي فرقٍ يتجاوز الحدّ المعقول (خطأ إدخالٍ غالباً). فغياب القسم هنا
 * سلامةٌ لا نقص.
 */
export function MarketContext({
  data, cityName, neighborhoodName, offerType,
}: {
  data?: MarketContextData | null;
  cityName?: string | null;
  neighborhoodName?: string | null;
  offerType?: string | null;
}) {
  if (!data) return null;

  const cur = data.currency;
  const rent = offerType !== "sale";
  const unit = rent ? "الإيجار" : "السعر";

  // مقارنةٌ واحدة تُصدَّر للعنوان: الحيّ أدقّ من المدينة حين يتوفّر.
  const ref = data.neighborhood ?? data.city;
  const refName = data.neighborhood ? neighborhoodName : cityName;
  const diff = ref?.diff_pct ?? null;

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (data.city?.median != null) {
    rows.push({
      icon: <Buildings3 className="h-4 w-4" />,
      label: `وسيط ${unit} في ${cityName || "المدينة"}`,
      value: `${formatPrice(data.city.median, cur)} (${data.city.count} عقاراً مشابهاً)`,
    });
  }
  if (data.neighborhood?.median != null) {
    rows.push({
      icon: <Buildings3 className="h-4 w-4" />,
      label: `وسيط ${unit} في ${neighborhoodName || "الحيّ"}`,
      value: `${formatPrice(data.neighborhood.median, cur)} (${data.neighborhood.count} عقاراً)`,
    });
  }
  if (data.price_per_m2 != null) {
    const refM2 = data.neighborhood?.median_per_m2 ?? data.city?.median_per_m2;
    rows.push({
      icon: <Ruler className="h-4 w-4" />,
      label: "سعر المتر المربّع لهذا العقار",
      value: formatPrice(data.price_per_m2, cur)
        + (refM2 != null ? ` · الوسيط ${formatPrice(refM2, cur)}` : ""),
    });
  }
  if (data.rental_yield_pct != null) {
    rows.push({
      icon: <HandMoney className="h-4 w-4" />,
      label: "العائد الإيجاريّ المقدَّر",
      value: `${data.rental_yield_pct}% سنوياً`
        + (data.median_annual_rent != null
            ? ` (وسيط الإيجار ${formatPrice(data.median_annual_rent, cur)})` : ""),
    });
  }

  if (rows.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl shadow-e2 p-5 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <ChartSquare className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-ink">أين يقع هذا العقار من السوق؟</h2>
      </div>

      {diff != null && refName && (
        <p className="text-body text-muted-600 mb-4">
          {unit} هنا{" "}
          <strong className={diff > 0 ? "text-danger-600" : "text-success-700"}>
            {diff === 0 ? "مطابق لوسيط" : `${Math.abs(diff)}% ${diff > 0 ? "أعلى من" : "أقلّ من"} وسيط`}
          </strong>{" "}
          العقارات المشابهة في {refName}.
        </p>
      )}

      <dl className="divide-y divide-muted-50">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 py-2.5">
            <span className="text-primary/70 mt-0.5 shrink-0">{r.icon}</span>
            <dt className="text-body text-muted-600 flex-1 min-w-0">{r.label}</dt>
            <dd className="text-body font-semibold text-ink text-left shrink-0">{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* ⚠️ الإفصاح ليس تجميلاً: رقمٌ محسوبٌ من عيّنةٍ يجب أن يُعرَف مصدره وحدّه. */}
      <p className="text-micro text-muted mt-3">
        أرقام محسوبة من عقارات مسكني المعروضة حالياً بالنوع ونوع العرض نفسيهما،
        وتتغيّر مع تغيّر المعروض. الوسيط لا المتوسّط، ولا تُحتسب الأسعار الشاذّة.
      </p>
    </section>
  );
}
