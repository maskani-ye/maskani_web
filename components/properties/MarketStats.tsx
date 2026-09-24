import { formatPrice, formatNumber, CURRENCY_LABELS } from "@/lib/utils";
import { fetchRetry } from "@/lib/fetchRetry";

// ─── MarketStats ────────────────────────────────────────────────────────────
// ⚠️ **هذا القسم هو ما يجعل صفحة الحيّ صفحتَنا لا نسخةً عن غيرنا.**
// قائمةُ إعلاناتٍ مصدرها موقعٌ آخر لا تضيف شيئاً للقارئ ولا للمفهرس — ورُفض
// الموقع في أدسنس بوصف «محتوى غير ذي قيمة» (٢٠٢٦-٠٩-١٠) لهذا السبب بعينه.
// أمّا وسيط سعر المتر في هذا الحيّ، وموضعه من مدينته، وتوزيع الأسعار فيه،
// فمعلومةٌ لا توجد في أيّ إعلانٍ منفرد: تُشتقّ من المخزون كلّه، وهي عندنا.
//
// ⚠️ **ولا يُعرَض رقمٌ لا نثق به**: الخادم يردّ `enough:false` أو `null` لأيّ
// شريحةٍ عيّنتها أقلّ من ثلاثة، فنُخفيها. صفحةٌ صامتة أصدق من رقمٍ مخترَع.

export interface MarketStatsData {
  enough: boolean;
  count: number;
  scope: "neighborhood" | "city";
  display_currency: string;
  usd_to_display: number | null;
  sale: Block | null;
  rent: Block | null;
  types: {
    name: string; count: number;
    median_sale_usd: number | null;
    median_rent_usd: number | null;
    median_per_sqm_usd: number | null;
  }[];
  /** ترتيب أحياء المدينة بسعر المتر — لصفحة المدينة وحدها. */
  neighborhood_table?: {
    name: string; slug: string; count: number;
    median_usd: number; median_per_sqm_usd: number | null;
  }[];
  /** `from`/`to` بعملة العرض ومستديرة — `*_usd` احتياطٌ لخادمٍ أقدم. */
  price_buckets: { from?: number; to?: number; from_usd: number; to_usd: number; count: number }[];
  vs_city?: { city_median_per_sqm_usd: number; diff_pct: number; city_sample: number };
}

interface Block {
  count: number;
  median_usd: number;
  min_usd: number;
  max_usd: number;
  p25_usd: number;
  p75_usd: number;
  median_per_sqm_usd: number | null;
  sample_per_sqm: number;
}

export async function getMarketStats(
  scope: "neighborhood" | "city",
  id: number,
): Promise<MarketStatsData | null> {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";
  try {
    const res = await fetchRetry(`${API}/properties/stats/?${scope}=${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res || !res.ok) return null;
    const data: MarketStatsData = await res.json();
    return data.enough ? data : null;
  } catch {
    return null;
  }
}

/** تمييز العدد بالعربية: ٣–١٠ جمعٌ مجرور، و١١ فأكثر مفردٌ منصوب.
 *  الأقسام لا تُعرض دون ثلاثة (`MIN_SAMPLE` في الخادم)، فلا حاجة لمفردٍ ومثنّى —
 *  وكان النصّ «من 2 عقاراً» لعيّنةٍ دون الحدّ، وهي نفسها ما أُغلق في الخادم. */
function count(n: number, plural: string, accusative: string): string {
  const k = n % 100;
  return `${formatNumber(n)} ${k >= 3 && k <= 10 ? plural : accusative}`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-muted-200 bg-white p-4">
      <div className="text-caption text-muted-500">{label}</div>
      <div className="text-h3 font-bold text-ink mt-1">{value}</div>
      {hint && <div className="text-micro text-muted-500 mt-1">{hint}</div>}
    </div>
  );
}

export function MarketStats({
  data,
  placeName,
  cityName,
}: {
  data: MarketStatsData;
  placeName: string;
  cityName?: string;
}) {
  const cur = data.display_currency;
  const k = data.usd_to_display ?? 1;
  const money = (usd: number) => formatPrice(Math.round(usd * k), cur);
  const sale = data.sale;
  const rent = data.rent;
  const maxBucket = Math.max(1, ...data.price_buckets.map((b) => b.count));

  return (
    <section className="mt-10" aria-labelledby="market-stats">
      <h2 id="market-stats" className="text-h3 sm:text-h2 font-bold text-ink">
        مؤشّرات أسعار {placeName}
      </h2>
      <p className="text-muted-600 mt-2 leading-relaxed max-w-3xl">
        محسوبةٌ من {count(data.count, "عقارات معروضة", "عقاراً معروضاً")} في {placeName} على مسكني. نعرض{" "}
        <strong>الوسيط</strong> لا المتوسّط — عقارٌ واحد بسعرٍ استثنائيّ يرفع
        المتوسّط ويضلّل، والوسيط لا يتأثّر به. القيم بـ{CURRENCY_LABELS[cur] ?? cur}.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {sale?.median_per_sqm_usd != null && (
          <Stat
            label="وسيط سعر المتر (بيع)"
            value={money(sale.median_per_sqm_usd)}
            hint={`من ${count(sale.sample_per_sqm, "عقارات", "عقاراً")}`}
          />
        )}
        {sale && (
          <Stat
            label="وسيط سعر العقار (بيع)"
            value={money(sale.median_usd)}
            hint={`النطاق الأوسط ${money(sale.p25_usd)} – ${money(sale.p75_usd)}`}
          />
        )}
        {rent?.median_usd != null && (
          <Stat label="وسيط الإيجار" value={money(rent.median_usd)} hint={`من ${count(rent.count, "عروض", "عرضاً")}`} />
        )}
        {data.vs_city && cityName && (
          <Stat
            label={`مقارنةً بـ${cityName}`}
            value={`${data.vs_city.diff_pct > 0 ? "أغلى" : "أرخص"} ${formatNumber(Math.abs(data.vs_city.diff_pct))}٪`}
            hint={`وسيط المتر في المدينة ${money(data.vs_city.city_median_per_sqm_usd)}`}
          />
        )}
      </div>

      {data.price_buckets.length > 0 && (
        <div className="mt-6 rounded-2xl border border-muted-200 bg-white p-5">
          <h3 className="text-body-lg font-semibold text-ink">توزيع أسعار البيع</h3>
          <ul className="mt-4 space-y-2">
            {data.price_buckets.map((b, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="text-caption text-muted-600 w-40 shrink-0">
                  {b.from != null && b.to != null
                    ? `${formatPrice(b.from, cur)} – ${formatPrice(b.to, cur)}`
                    : `${money(b.from_usd)} – ${money(b.to_usd)}`}
                </span>
                <span className="flex-1 h-2.5 rounded-full bg-muted-100 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(b.count / maxBucket) * 100}%` }}
                  />
                </span>
                <span className="text-caption text-muted-600 w-12 text-left shrink-0">
                  {formatNumber(b.count)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ⚠️ **«٣٤ شقة» لا تُجيب سؤال القارئ: بكم الشقّة هنا؟** فالعدد وحده كان
          سطراً يُقرأ ولا يُفيد. الجدول يضمّ وسيط البيع والإيجار وسعر المتر لكل
          نوع — والخانة تبقى فارغة حين تقلّ عيّنتها، لا تُملأ بتقدير. */}
      {data.types.length > 1 && (
        <div className="mt-6 rounded-2xl border border-muted-200 bg-white p-5 overflow-x-auto">
          <h3 className="text-body-lg font-semibold text-ink">
            الأسعار حسب نوع العقار في {placeName}
          </h3>
          <table className="w-full mt-4 text-body">
            <thead>
              <tr className="text-caption text-muted-500 text-right">
                <th className="font-medium py-2">النوع</th>
                <th className="font-medium py-2">المعروض</th>
                <th className="font-medium py-2">وسيط البيع</th>
                <th className="font-medium py-2">وسيط الإيجار</th>
                <th className="font-medium py-2">سعر المتر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {data.types.map((t) => (
                <tr key={t.name}>
                  <td className="py-2.5 font-semibold text-ink">{t.name}</td>
                  <td className="py-2.5 text-muted-600">{formatNumber(t.count)}</td>
                  <td className="py-2.5 text-muted-600">
                    {t.median_sale_usd != null ? money(t.median_sale_usd) : "—"}
                  </td>
                  <td className="py-2.5 text-muted-600">
                    {t.median_rent_usd != null ? money(t.median_rent_usd) : "—"}
                  </td>
                  <td className="py-2.5 text-muted-600">
                    {t.median_per_sqm_usd != null ? money(t.median_per_sqm_usd) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ⚠️ **أنفع ما تملكه صفحة المدينة.** الباحث لا يسأل «كم وسيط الرياض؟»
          بل «أيّ حيٍّ في متناولي؟» — والترتيب نفسه جوابٌ لا يوجد في أيّ إعلان. */}
      {(data.neighborhood_table?.length ?? 0) >= 2 && (
        <div className="mt-6 rounded-2xl border border-muted-200 bg-white p-5 overflow-x-auto">
          <h3 className="text-body-lg font-semibold text-ink">
            أحياء {placeName} مرتّبةً بسعر المتر
          </h3>
          <table className="w-full mt-4 text-body">
            <thead>
              <tr className="text-caption text-muted-500 text-right">
                <th className="font-medium py-2">الحيّ</th>
                <th className="font-medium py-2">سعر المتر</th>
                <th className="font-medium py-2">وسيط سعر العقار</th>
                <th className="font-medium py-2">المعروض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {data.neighborhood_table!.map((h) => (
                <tr key={h.slug}>
                  <td className="py-2.5 font-semibold text-ink">
                    <a href={`/properties/neighborhood/${encodeURIComponent(h.slug)}`}
                       className="hover:text-primary">{h.name}</a>
                  </td>
                  <td className="py-2.5 text-muted-600">
                    {h.median_per_sqm_usd != null ? money(h.median_per_sqm_usd) : "—"}
                  </td>
                  <td className="py-2.5 text-muted-600">{money(h.median_usd)}</td>
                  <td className="py-2.5 text-muted-600">{formatNumber(h.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-micro text-muted mt-3">
            الأحياء التي يقلّ معروضها عن ثلاثة عقارات لا تُدرَج — عيّنةٌ أصغر
            لا يُشتقّ منها وسيطٌ يُوثَق به.
          </p>
        </div>
      )}
    </section>
  );
}
