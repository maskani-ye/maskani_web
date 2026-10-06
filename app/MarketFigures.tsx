import { CURRENCY_SYMBOLS, NUMERIC_LOCALE } from "@/lib/utils";

/**
 * «أسواق مسكني بالأرقام» — قسمٌ يُصيَّر على الخادم تحت بوّابة الأسواق.
 *
 * ⚠️ **لماذا وُجد:** رُفض أدسنس مرّتين بحكم «محتوى منخفض القيمة»، والرئيسية
 * — أوّل ما يفتحه المراجِع — كانت ١٠٢ كلمة. والإضافة هنا **ليست نصّاً
 * تعريفياً أطول** (حشوٌ يزيد الحكم سوءاً) بل أرقامٌ لا توجد في أيّ موقعٍ
 * آخر: وسيط البيع والإيجار وسعر المتر في عاصمة كل سوق، محسوبةً من مخزوننا.
 *
 * ⚠️ **الوسيط لا المتوسّط، ولا رقم بلا عيّنة كافية.** الخادم يُسقط الأسعار
 * المستحيلة ويُرجع `enough: false` تحت الحدّ الأدنى، فتُحذف المدينة من القسم
 * بدل عرض رقمٍ من ثلاثة إعلانات. إحصاءٌ كاذب على موقعٍ مُراجَع أسوأ من غيابه.
 *
 * ⚠️ **سبعة طلبات فرعية فقط** (الدول + عاصمةٌ لكل سوق): سقف Workers خمسون
 * طلباً للصفحة.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

interface Block { count: number; median_usd: number; median_per_sqm_usd?: number; sample_per_sqm?: number }
interface Stats {
  enough: boolean; count: number;
  display_currency: string; usd_to_display: number;
  sale?: Block; rent?: Block;
}
interface Country {
  code: string; name_ar: string; flag_emoji: string; properties_count: number;
  cities?: { id: number; name_ar: string }[];
}
interface Row { country: Country; city: string; stats: Stats }

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { next: { revalidate: 3600 } });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

async function getRows(): Promise<Row[]> {
  const raw = await getJson<Country[] | { results: Country[] }>(`${API}/cities/countries/`);
  const countries = (Array.isArray(raw) ? raw : raw?.results || []).filter((c) => c.cities?.length);
  const rows = await Promise.all(countries.map(async (c) => {
    const capital = c.cities![0];
    const stats = await getJson<Stats>(`${API}/properties/stats/?city=${capital.id}`);
    return stats?.enough ? { country: c, city: capital.name_ar, stats } : null;
  }));
  return rows.filter((r): r is Row => r !== null);
}

const fmt = (usd: number, s: Stats) => {
  const v = usd * (s.usd_to_display || 1);
  const sym = CURRENCY_SYMBOLS[s.display_currency] || s.display_currency;
  // تقريبٌ يناسب الحجم: سعر متر بأرقامه، وسعر عقار إلى أقرب ألف.
  const rounded = v >= 10_000 ? Math.round(v / 1000) * 1000 : Math.round(v);
  return `${rounded.toLocaleString(NUMERIC_LOCALE)} ${sym}`;
};

export default async function MarketFigures() {
  const rows = await getRows();
  if (!rows.length) return null;

  return (
    <section aria-labelledby="figures-title" dir="rtl"
             className="bg-ink text-white border-t border-white/10">
      <div className="max-w-shell mx-auto px-5 sm:px-8 py-14">
        <h2 id="figures-title" className="text-h2 font-extrabold">أسواق مسكني بالأرقام</h2>
        <p className="mt-3 max-w-3xl text-body text-white/75 leading-relaxed">
          أسعارٌ نحسبها من الإعلانات المعروضة على مسكني في عاصمة كل سوق: الوسيط لا
          المتوسّط، كي لا يرفع إعلانٌ واحد مبالَغ فيه الرقمَ كلّه، ونستبعد الأسعار
          والمساحات غير المعقولة قبل الحساب. تتحدّث كل ساعة.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ country: c, city, stats: s }) => (
            <article key={c.code} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-h3 font-bold">
                <span aria-hidden>{c.flag_emoji}</span> {city}، {c.name_ar}
              </h3>
              <dl className="mt-4 space-y-2 text-body">
                {s.sale && s.sale.count > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/65">وسيط سعر البيع</dt>
                    <dd className="font-bold tabular-nums">{fmt(s.sale.median_usd, s)}</dd>
                  </div>
                )}
                {s.sale?.median_per_sqm_usd && (s.sale.sample_per_sqm ?? 0) >= 10 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/65">وسيط سعر المتر (بيع)</dt>
                    <dd className="font-bold tabular-nums">{fmt(s.sale.median_per_sqm_usd, s)}</dd>
                  </div>
                )}
                {s.rent && s.rent.count > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/65">وسيط الإيجار</dt>
                    <dd className="font-bold tabular-nums">{fmt(s.rent.median_usd, s)}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 text-caption text-white/55">
                من {s.count.toLocaleString(NUMERIC_LOCALE)} إعلاناً في {city} ·{" "}
                {c.properties_count.toLocaleString(NUMERIC_LOCALE)} في {c.name_ar} كلّها
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
