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
  ar: { name: string; body: string; short: string };
  en: { name: string; body: string; short: string };
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
    // ⚠️ لا روابط أقسام في ترويسة البوّابة: العقارات والخدمات والطلبات كلّها
    // **تابعة لسوق**، وفتحها قبل اختيار الدولة يُوقع الزائر في بوّابة الموقع
    // فيُعاد إلى `/location` — طريقٌ ملتوٍ إلى ما تفعله هذه الصفحة أصلاً. تبقى
    // المدونة لأنها المحتوى الوحيد غير المرتبط بسوق.
    nav: [["المدونة", "/blog"], ["عن المنصّة", "/about"]],
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
    nav: [["Blog", "/blog"], ["About", "/about"]],
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

  /**
   * عرضٌ دوّار للأسواق: كل ستّ ثوانٍ تتلاشى صورة إلى صورة سوقٍ آخر.
   *
   * ⚠️ **الدوران يتوقّف فور لمس المؤشّر سوقاً** ثم يستأنف بعد تركه: وإلا نازع
   * العرضُ الزائرَ فتبدّلت الخلفية بينما هو يتفحّص سوقاً بعينه — حركةٌ تُقاتل
   * المستخدم بدل أن تخدمه. ويتوقّف كذلك لمن طلب تقليل الحركة ولمن غادر التبويب
   * (لا نُحرق بطاريةً على زينة لا يراها أحد).
   */
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (withImage.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (hovered) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setSlide((i) => (i + 1) % withImage.length);
    }, 6000);
    return () => clearInterval(id);
  }, [withImage.length, hovered]);

  const active = markets.find((m) => m.code === hovered)
    || withImage[slide % (withImage.length || 1)]
    || primary;
  const shown = expanded ? markets : markets.slice(0, 3);
  const rest = markets.length - shown.length;

  return (
    // ⚠️ **شاشة واحدة بلا تمرير**: `h-[100svh]` + `overflow-hidden`، والتخطيط
    // ثلاثة صفوف (ترويسة · مشهد · نسب الصورة) فيتمدّد المشهد بما بقي لا أكثر.
    // `svh` لا `vh`: شريط متصفّح الجوّال يقضم من `vh` فيظهر تمرير بمقداره.
    // ⚠️ **لا لون خلفية على الجذر.** كان `bg-ink` هنا وطبقة الصورة عند
    // `-z-10`، فرُسمت الخلفية المعتمة **فوق** الصورة: تُحمَّل ولا تُرى إطلاقاً
    // (٢٢٠ ك.ب تُدفع بلا مقابل). اللون انتقل إلى طبقة الخلفية نفسها ليبقى
    // احتياطاً حين تتعذّر الصورة، والطبقات صارت موجبة ومرتّبة: صورة (0) ←
    // كرة (1) ← محتوى (10).
    <div dir={t.dir} lang={lang}
      className="relative h-[100svh] overflow-hidden text-white grid grid-rows-[auto_1fr_auto]">
      {/* ─── الخلفية السينمائية ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 bg-ink">
        {withImage.map((m) => (
          <Image
            key={m.code}
            src={m.image as string}
            alt=""
            fill
            priority={m.code === primary?.code}
            sizes="100vw"
            aria-hidden
            // التلاشي نفسه للحالتين — الدوران التلقائي وتمرير المؤشّر على سوق —
            // فلا يشعر الزائر بأنّهما آليّتان مختلفتان.
            className={`object-cover transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none ${
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
        <div className="pointer-events-none absolute inset-y-0 start-0 w-[46vw] max-w-globe z-[1] opacity-70">
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
      <main className="relative z-10 w-full max-w-shell mx-auto px-5 sm:px-8 min-h-0 flex items-center">
        <div className="w-full">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-14 items-center">
            {/* العنوان */}
            <div className="max-w-headline">
              <h1 className="text-h1 md:text-display lg:text-hero font-extrabold text-balance">
                {t.headline}
              </h1>
              <p className="text-body-lg text-white/70 mt-5 leading-relaxed max-w-[46ch]">
                {t.sub}
              </p>

              {/* ما تقدّمه المنصّة — **نبذة لا أزرار**، ونظامٌ واحد بفواصل لا
                  أربع بطاقات منفصلة. والنصّ داخل الإطار لأن صفحةً بلا نصّ صفحةٌ
                  رقيقة أمام جوجل، وقد رُفضنا من أدسنس مرّة لهذا السبب بعينه. */}
              <div className="mt-6 lg:mt-8 rounded-3xl bg-white/[0.07] ring-1 ring-white/15 backdrop-blur-xl p-4 sm:p-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 lg:divide-x lg:divide-x-reverse divide-white/10">
                  {pillars.map((p) => {
                    const Icon = PILLAR_ICON[p.key] ?? Buildings2;
                    const c = isAr ? p.ar : p.en;
                    return (
                      // ⚠️ **نبذة لا رابط**: الزائر هنا لم يختر سوقه بعد،
                      // فالنقر على «العقارات» يرميه في سوقٍ لم يخترْه (تحويل
                      // 308 إلى الافتراضي). الاختيار فعلٌ واحد في هذه الصفحة:
                      // الدولة. وهذه فقرات تعريفٍ لا أزرار.
                      <div key={p.key} className="lg:px-4">
                        <span className="flex items-center gap-2">
                          <Icon weight="Bold" className="h-4 w-4 text-gold shrink-0" />
                          <span className="text-caption font-bold">{c.name}</span>
                        </span>
                        <span className="block text-caption text-white/55 mt-1.5 leading-relaxed">
                          {c.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
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

        </div>

      </main>

      {/* نسب الصورة — شرط رخصة لا تجميل. صفٌّ ثالث ثابت فلا يزحم المشهد. */}
      <p className="relative z-10 max-w-shell w-full mx-auto px-5 sm:px-8 pb-3 text-caption text-white/30 truncate">
        {active?.credit ? `${t.photo} ${active.credit}` : ""}
      </p>
    </div>
  );
}
