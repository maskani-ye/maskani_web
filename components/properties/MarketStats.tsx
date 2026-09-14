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
  types: { name: string; count: number }[];
  price_buckets: { from_usd: number; to_usd: number; count: number }[];
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
        محسوبةٌ من {data.count} عقاراً معروضاً في {placeName} على مسكني. نعرض{" "}
        <strong>الوسيط</strong> لا المتوسّط — عقارٌ واحد بسعرٍ استثنائيّ يرفع
        المتوسّط ويضلّل، والوسيط لا يتأثّر به. القيم بـ{CURRENCY_LABELS[cur] ?? cur}.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {sale?.median_per_sqm_usd != null && (
          <Stat
            label="وسيط سعر المتر (بيع)"
            value={money(sale.median_per_sqm_usd)}
            hint={`من ${sale.sample_per_sqm} عقاراً`}
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
          <Stat label="وسيط الإيجار" value={money(rent.median_usd)} hint={`من ${rent.count} عرضاً`} />
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
                  {money(b.from_usd)} – {money(b.to_usd)}
                </span>
                <span className="flex-1 h-2.5 rounded-full bg-muted-100 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(b.count / maxBucket) * 100}%` }}
                  />
                </span>
                <span className="text-caption text-muted-600 w-12 text-left shrink-0">
                  {b.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.types.length > 1 && (
        <p className="text-body text-muted-600 mt-5 leading-relaxed">
          تركيبة المعروض:{" "}
          {data.types.map((t, i) => (
            <span key={t.name}>
              {i > 0 && " · "}
              <strong className="text-ink">{t.name}</strong> {t.count}
            </span>
          ))}
          .
        </p>
      )}
    </section>
  );
}
