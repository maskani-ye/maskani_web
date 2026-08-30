"use client";

/**
 * تأليف البوّابة العالمية — مشهد واحد يملأ الإطار، ثم طبقة محتوى واحدة تحته.
 *
 * ⚠️ **الزجاج معماريّ لا نيونيّ**: أبيض شفّاف ٨–١٤٪ + `backdrop-blur` + حدّ
 * شعرة. بلا توهّج ولا تدرّجات ملوّنة — الفخامة هنا من الضوء والمسافة لا من
 * اللون. والأكسنت البنفسجيّ (`#4F2396`) لا يظهر إلا في التفاعل: علامة العلامة،
 * والحدّ المضيء عند التمرير، والسهم. هذا ما يجعله يبدو ثميناً بدل أن يصرخ.
 *
 * ⚠️ **لون العلامة لا يُبدَّل**: طُلب أكسنت أخضر/تركوازي «معماريّ»، ومنصّتنا
 * بنفسجية عبر أربعة مشاريع بعد إعادة هوية كاملة. أخذنا انضباط الطلب اللوني
 * (فحميّ + عاجيّ + أكسنت نادر) ورفضنا درجته — صفحةٌ بلونٍ آخر تقطع الهوية عند
 * أوّل نقرة إلى السوق.
 *
 * ⚠️ **الحركة تحترم `prefers-reduced-motion`**: تبديل الخلفية والبارالاكس
 * يتوقّفان لمن ضبط جهازه على تقليل الحركة — لا زينة تُفرَض على من يتضرّر بها.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { AltArrowLeft, Buildings2, ClipboardList, Settings, CaseMinimalistic, Global } from "@solar-icons/react";

export interface Market {
  code: string; slug: string; nameAr: string; nameEn: string; flag: string;
  image: string | null; credit: string;
  taglineAr: string; taglineEn: string; count: number;
  lat?: number | null; lng?: number | null;
}
interface Pillar {
  key: string;
  ar: { name: string; body: string };
  en: { name: string; body: string };
  href: string;
}

type Lang = "ar" | "en";

const PILLAR_ICON: Record<string, React.ElementType> = {
  properties: Buildings2, services: Settings,
  requests: ClipboardList, jobs: CaseMinimalistic,
};

const T = {
  ar: {
    dir: "rtl" as const,
    brand: "مسكني",
    nav: [["العقارات", "/properties"], ["الخدمات", "/services"], ["الطلبات", "/requests"], ["عن المنصّة", "/about"]],
    headline: "مكانك يبدأ هنا.",
    sub: "عقارات وخدمات وطلبات حقيقية — موصولة عبر ستّة أسواق.",
    chooseTitle: "اختر سوقك",
    chooseSub: "افتح مسكني في بلدك.",
    explore: "ادخل",
    empty: "سوق جديد — كن أوّل من ينشر",
    unit: (n: number) => `${formatNumber(n)} عقاراً معروضاً`,
    more: "أسواق أخرى",
    whatTitle: "ما الذي تجده في مسكني؟",
    whatSub: "أربعة مسارات تعمل معاً: تعرض، أو تطلب، أو تخدم — في العقار وفي ما حوله.",
    photo: "الصورة:",
    scroll: "تعرّف على المنصّة",
  },
  en: {
    dir: "ltr" as const,
    brand: "MASKANI",
    nav: [["Properties", "/properties"], ["Services", "/services"], ["Requests", "/requests"], ["About", "/about"]],
    headline: "Your place starts here.",
    sub: "Properties, services and real-world requests — connected across six markets.",
    chooseTitle: "Choose your market",
    chooseSub: "Explore Maskani in your country.",
    explore: "Explore",
    empty: "New market — be the first to publish",
    unit: (n: number) => `${formatNumber(n)} listings`,
    more: "More markets",
    whatTitle: "What you find on Maskani",
    whatSub: "Four paths working as one system: list, request, or serve — in property and around it.",
    photo: "Photo:",
    scroll: "About the platform",
  },
};

/**
 * الكرة تُحمَّل **بعد** رسم الصفحة ولا تُصيَّر على الخادم: مكتبة three ثقيلة،
 * وتحميلها ضمن الحزمة الأولى يؤخّر أهمّ صفحة عندنا. وهي زينة — فلا يجوز أن
 * تسبق المحتوى.
 */
const MarketGlobe = dynamic(() => import("@/components/landing/MarketGlobe"), {
  ssr: false,
  loading: () => null,
});

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export default function LandingClient({ markets: initial, pillars }: { markets: Market[]; pillars: Pillar[] }) {
  const [markets, setMarkets] = useState<Market[]>(initial);
  const [lang, setLang] = useState<Lang>("ar");
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const t = T[lang];
  const isAr = lang === "ar";

  // ⚠️ اللغة تُقرأ بعد الترطيب لا أثناءه: قراءتها في الحالة الابتدائية تُنتج
  // عدم تطابق بين ما صيّره الخادم (العربية دائماً) وما يراه المتصفّح.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maskani_landing_lang");
      if (saved === "en" || saved === "ar") setLang(saved);
    } catch { /* تخزين محجوب — تبقى العربية */ }
  }, []);

  /**
   * شبكة أمان: لو خرجت الصفحة الساكنة بلا أسواق (فشل جلبٍ لحظيّ وقت البناء —
   * وقد حدث فعلاً في أوّل نشرة) نجلبها من المتصفّح فلا يرى الزائر لوحةً فارغة
   * لساعة كاملة حتى تتجدّد الصفحة. لا تمويه: نفس المحتوى الذي كان سيُصيَّر.
   */
  useEffect(() => {
    if (initial.length) return;
    let alive = true;
    fetch(`${API}/cities/countries/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        const rows = Array.isArray(j) ? j : j.results || [];
        setMarkets(rows.map((c: Record<string, never | string | number | null>) => ({
          code: String(c.code || "").toLowerCase(),
          slug: String(c.slug || ""),
          nameAr: String(c.name_ar || ""),
          nameEn: String(c.name_en || ""),
          flag: String(c.flag_emoji || ""),
          image: (c.hero_image as string | null) ?? null,
          credit: String(c.hero_credit || ""),
          taglineAr: String(c.tagline_ar || ""),
          taglineEn: String(c.tagline_en || ""),
          count: Number(c.properties_count || 0),
        })));
      })
      .catch(() => { /* تبقى اللوحة كما هي */ });
    return () => { alive = false; };
  }, [initial.length]);

  const switchLang = useCallback((next: Lang) => {
    setLang(next);
    try { localStorage.setItem("maskani_landing_lang", next); } catch { /* لا شيء */ }
  }, []);

  // تأجيل الزينة: بعد خمول المتصفّح، وعلى الشاشات الواسعة وحدها.
  const [showGlobe, setShowGlobe] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 1024) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // مهلة بسيطة بدل `requestIdleCallback`: مدعومة في كل المتصفّحات، وتُبقي
    // الزينة خلف الرسم الأوّل بلا تفرّع في الشيفرة.
    const id = window.setTimeout(() => setShowGlobe(true), 1400);
    return () => clearTimeout(id);
  }, []);

  const globePoints = useMemo(
    () => markets
      .filter((m) => m.lat != null && m.lng != null)
      .map((m) => ({ code: m.code, lat: m.lat as number, lng: m.lng as number, active: hovered === m.code })),
    [markets, hovered],
  );

  const withImage = useMemo(() => markets.filter((m) => m.image), [markets]);
  const primary = markets[0] ?? null;
  const active = markets.find((m) => m.code === hovered) || primary;
  const shown = expanded ? markets : markets.slice(0, 3);
  const rest = markets.length - shown.length;

  return (
    <div dir={t.dir} lang={lang} className="relative min-h-screen bg-ink text-white overflow-hidden">
      {/* ─── الخلفية السينمائية ─────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        {withImage.map((m) => (
          <Image
            key={m.code}
            src={m.image as string}
            alt=""
            fill
            priority={m.code === primary?.code}
            sizes="100vw"
            aria-hidden
            className={`object-cover transition-opacity duration-[900ms] ease-out motion-reduce:transition-none ${
              active?.code === m.code ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* حجاب الحبر — **مُوجَّه لا مُطبِق**.
            ⚠️ أوّل ضبطٍ كدّس تدرّجين ثقيلين (85→70→90 فوق 0→20→60) فصار
            المجموع ≈٩٠٪ من كحليّ داكن: الصورة موجودة ومحمَّلة لكن **غير مرئية**
            إطلاقاً — دفعنا ثمن تحميلها ولم نقبض المشهد. الآن يثقل الحجاب تحت
            النصّ ويخفّ حيث لا نصّ، فيُقرأ النصّ وتبقى العمارة ظاهرة. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/85" />
        <div className="absolute inset-0 bg-gradient-to-l from-ink/10 via-transparent to-ink/70" />
      </div>

      {/* كرة الأسواق — بين الصورة والمحتوى، بلا التقاط للمؤشّر. */}
      {showGlobe && globePoints.length > 0 && (
        <div className="pointer-events-none fixed inset-y-0 start-0 w-[46vw] max-w-globe -z-[5] opacity-70">
          <MarketGlobe points={globePoints} />
        </div>
      )}

      {/* ─── الترويسة ───────────────────────────────────────────────────── */}
      <header className="relative z-20 max-w-shell mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <span className="text-h3 font-extrabold tracking-tight">{t.brand}</span>
        <nav className="hidden md:flex items-center gap-7">
          {t.nav.map(([label, href]) => (
            <Link key={href} href={href}
              className="text-caption text-white/70 hover:text-white transition-colors relative group">
              {label}
              <span className="absolute -bottom-1.5 inset-x-0 h-px bg-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 text-caption">
          <button onClick={() => switchLang("ar")}
            className={`px-2 py-1 rounded-lg transition-colors ${isAr ? "text-white font-bold" : "text-white/50 hover:text-white/80"}`}>
            العربية
          </button>
          <span className="text-white/25">|</span>
          <button onClick={() => switchLang("en")}
            className={`px-2 py-1 rounded-lg transition-colors ${!isAr ? "text-white font-bold" : "text-white/50 hover:text-white/80"}`}>
            EN
          </button>
        </div>
      </header>

      {/* ─── المشهد ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-shell mx-auto px-5 sm:px-8">
        <div className="min-h-[calc(100svh-theme(spacing.16))] flex flex-col justify-center py-10 lg:py-0">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-10 lg:gap-14 items-center">
            {/* العنوان */}
            <div className="max-w-headline">
              <h1 className="text-h1 md:text-display lg:text-hero font-extrabold text-balance">
                {t.headline}
              </h1>
              <p className="text-body-lg text-white/70 mt-5 leading-relaxed max-w-[46ch]">
                {t.sub}
              </p>

              {/* شريط القدرات — نظام واحد بفواصل، لا أربع بطاقات منفصلة */}
              <div className="mt-9 rounded-3xl bg-white/[0.08] ring-1 ring-white/15 backdrop-blur-xl px-2 py-2 inline-flex flex-wrap">
                {pillars.map((p, i) => {
                  const Icon = PILLAR_ICON[p.key] ?? Buildings2;
                  return (
                    <span key={p.key} className="flex items-center">
                      {i > 0 && <span className="w-px h-5 bg-white/15" aria-hidden />}
                      <a href={`#${p.key}`}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-caption font-semibold text-white/85 hover:text-white hover:bg-white/[0.07] transition-colors">
                        <Icon className="h-4 w-4 text-gold/90" />
                        {(isAr ? p.ar : p.en).name}
                      </a>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* لوحة الأسواق — الفعل الأساسي */}
            <section aria-labelledby="markets-title"
              className="rounded-glass bg-white/[0.10] ring-1 ring-white/20 backdrop-blur-2xl p-5 sm:p-6 shadow-e4">
              <h2 id="markets-title" className="text-h3 font-bold">{t.chooseTitle}</h2>
              <p className="text-caption text-white/60 mt-1">{t.chooseSub}</p>

              <ul className="mt-5 space-y-2">
                {shown.map((m) => (
                  <li key={m.code}>
                    <Link
                      href={`/${m.code}`}
                      onMouseEnter={() => setHovered(m.code)}
                      onFocus={() => setHovered(m.code)}
                      onMouseLeave={() => setHovered(null)}
                      onBlur={() => setHovered(null)}
                      className="group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 ring-1 ring-white/10 bg-white/[0.04] hover:bg-white/[0.10] hover:ring-primary/60 transition-all duration-300 motion-safe:hover:scale-[1.015]"
                    >
                      <span className="text-h2 leading-none" aria-hidden>{m.flag}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-body font-bold">{isAr ? m.nameAr : m.nameEn}</span>
                        <span className="block text-caption text-white/55 truncate">
                          {isAr ? m.taglineAr : m.taglineEn}
                        </span>
                        {/* ⚠️ الرقم حقيقيّ دائماً — والسوق الفارغ يُقال إنه جديد
                            لا أن يُخفى: الصدق يجذب أوّل ناشر، والادّعاء يطرده. */}
                        <span className={`block text-caption mt-0.5 ${m.count ? "text-gold/90" : "text-white/40"}`}>
                          {m.count ? t.unit(m.count) : t.empty}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-caption font-bold text-white/0 group-hover:text-white transition-all shrink-0">
                        {t.explore}
                        <AltArrowLeft className={`h-4 w-4 transition-transform group-hover:-translate-x-0.5 ${isAr ? "" : "rotate-180 group-hover:translate-x-0.5"}`} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {rest > 0 && (
                <button onClick={() => setExpanded(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-caption font-bold text-white/70 hover:text-white ring-1 ring-white/10 hover:ring-white/25 transition-colors">
                  <Global className="h-4 w-4" />
                  {t.more} ({formatNumber(rest)})
                </button>
              )}
            </section>
          </div>

          {/* نسب الصورة — شرط رخصة لا تجميل */}
          <p className="text-caption text-white/35 mt-8 truncate">
            {active?.credit ? `${t.photo} ${active.credit}` : ""}
          </p>
        </div>

        {/* ─── طبقة المحتوى: النبذات الأربع نصّاً ───────────────────────── */}
        <section className="pb-20 pt-4">
          <h2 className="text-h2 font-bold">{t.whatTitle}</h2>
          <p className="text-body text-white/60 mt-2 max-w-[60ch] leading-relaxed">{t.whatSub}</p>

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {pillars.map((p) => {
              const Icon = PILLAR_ICON[p.key] ?? Buildings2;
              const c = isAr ? p.ar : p.en;
              return (
                <article key={p.key} id={p.key}
                  className="rounded-3xl bg-white/[0.06] ring-1 ring-white/12 backdrop-blur-xl p-6 hover:bg-white/[0.09] transition-colors scroll-mt-20">
                  <span className="inline-flex w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
                    <Icon weight="Bold" className="h-5 w-5 text-gold" />
                  </span>
                  <h3 className="text-h3 font-bold mt-4">{c.name}</h3>
                  <p className="text-body text-white/65 mt-2 leading-relaxed">{c.body}</p>
                  <Link href={p.href}
                    className="inline-flex items-center gap-1.5 text-caption font-bold text-white/80 hover:text-white mt-4 group">
                    {c.name}
                    <AltArrowLeft className={`h-4 w-4 transition-transform group-hover:-translate-x-1 ${isAr ? "" : "rotate-180 group-hover:translate-x-1"}`} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
