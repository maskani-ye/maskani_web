"use client";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  شاشة تحديد الموقع — خطوتان: الدولة ثم المدينة
 * ════════════════════════════════════════════════════════════════════════
 *
 * تحلّ محلّ المودال الإجباريّ الذي كان يحجب الرئيسية عند أوّل زيارة. لماذا
 * شاشة لا نافذة:
 *
 * • **المودال يحجب ولا يشرح.** الزائر يهبط على الرئيسية فتُغطّى بنافذة لا
 *   تُغلق، فيرى منتجاً محجوباً قبل أن يفهم ما هو. الشاشة تُعلن نفسها: هذه
 *   خطوة إعداد لا عائق.
 * • **الرجوع مضمون.** يصل الزائر من جوجل إلى `/properties`، فيُحوَّل إلى هنا
 *   ثم يعود إلى الصفحة نفسها بعد الاختيار (`?next=`) — لا إلى الرئيسية. مع
 *   المودال كان السياق يضيع.
 * • قابلة للمشاركة والرجوع بزرّ المتصفّح، والمودال ليس كذلك.
 *
 * ⚠️ **الدولة مُنتقاة مسبقاً** ممّا كشفه الخادم من عنوان الزائر: أغلب الناس
 * في بلدهم، فجعلُهم يختارونها من صفر احتكاكٌ بلا مقابل. تبقى قابلة للتغيير
 * بنقرة للمغترب الذي يبحث في بلده.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { Magnifer, MapPoint, AltArrowRight, CheckCircle } from "@solar-icons/react";
import type { Country } from "@/types";

/** المسارات المسموح العودة إليها — لا نقبل أي قيمة من الرابط. */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  // مسار داخليّ فقط: `//host` و`https://host` كلاهما يخرج بالمستخدم من الموقع.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function LocationClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const { countries, country, setCountry, loading: countryLoading } = useCountry();
  const { cities, setCity, loading: cityLoading } = useCity();
  const [query, setQuery] = useState("");
  const [done, setDone] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name_ar.toLowerCase().includes(q));
  }, [cities, query]);

  // بعد اختيار المدينة نعود إلى الصفحة التي جاء منها — لا إلى الرئيسية.
  useEffect(() => {
    if (done) router.replace(next);
  }, [done, next, router]);

  const pickCountry = (c: Country) => {
    setQuery("");
    setCountry(c);
  };

  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary px-3.5 py-1.5 text-caption font-bold">
          <MapPoint weight="Bold" className="h-4 w-4" />
          خطوة واحدة
        </span>
        <h1 className="text-h1 text-ink mt-4 text-balance">أين تبحث عن عقار؟</h1>
        <p className="text-body-lg text-muted mt-3 leading-relaxed">
          نعرض لك العقارات والخدمات والطلبات في مدينتك وحدها — فلا تتصفّح سوقاً
          ليس سوقك. تستطيع تغييرها في أي وقت من أعلى الصفحة.
        </p>
      </header>

      {/* ─── الدولة ───────────────────────────────────────────────────── */}
      {countries.length > 1 && (
        <section className="mb-8">
          <h2 className="text-h3 text-ink mb-3">الدولة</h2>
          {countryLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {countries.map((c) => {
                const on = c.code === country?.code;
                return (
                  <button
                    key={c.id}
                    onClick={() => pickCountry(c)}
                    aria-pressed={on}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-body font-semibold ring-1 transition-all ${
                      on
                        ? "bg-primary text-white ring-primary"
                        : "bg-white text-ink ring-ink/[0.08] hover:ring-primary/40"
                    }`}
                  >
                    <span aria-hidden>{c.flag_emoji}</span>
                    {c.name_ar}
                    {on && <CheckCircle weight="Bold" className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─── المدينة ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-h3 text-ink mb-3">
          المدينة{country?.name_ar ? ` في ${country.name_ar}` : ""}
        </h2>

        <div className="relative mb-4">
          <Magnifer className="absolute top-1/2 -translate-y-1/2 start-3.5 h-5 w-5 text-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن مدينة…"
            aria-label="ابحث عن مدينة"
            className="w-full h-12 rounded-xl bg-white ring-1 ring-ink/[0.08] ps-11 pe-4 text-body text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {cityLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-body text-muted py-10 text-center">
            لا مدينة بهذا الاسم — جرّب اسماً آخر أو غيّر الدولة.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCity(String(c.id), c.name_ar);
                  setDone(true);
                }}
                className="group flex items-center justify-between gap-2 rounded-xl bg-white ring-1 ring-ink/[0.08] px-4 py-3.5 text-start hover:ring-primary hover:shadow-e2 transition-all"
              >
                <span className="text-body font-semibold text-ink line-clamp-1">
                  {c.name_ar}
                </span>
                <AltArrowRight className="h-4 w-4 text-muted group-hover:text-primary group-hover:-translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
