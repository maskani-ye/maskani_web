import type { Metadata } from "next";
import Link from "next/link";
import {
  Buildings2,
  CaseMinimalistic,
  ShieldWarning,
  ChatRoundLine,
  MapPointWave,
  Magnifer,
  HeartAngle,
  Bell,
  Star,
  VerifiedCheck,
  UsersGroupRounded,
  Smartphone,
  BellBing,
  TagPrice,
  Bookmark,
  Bolt,
  MedalStar,
} from "@solar-icons/react";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, breadcrumbList } from "@/lib/seo";
import { TesterEnroll } from "@/components/download/TesterEnroll";

export const metadata: Metadata = {
  title: "حمّل تطبيق مسكني للأندرويد | عقارات وخدمات اليمن",
  description:
    "حمّل تطبيق مسكني على أندرويد: عقارات للبيع والإيجار، مزودو خدمات، طلبات عقارية، محادثة مباشرة، وخرائط — بلا وسطاء ولا مدفوعات. أكمل خطوات الانضمام للاختبار مرّة واحدة.",
  keywords:
    "تطبيق مسكني, تحميل مسكني, تطبيق عقارات اليمن, عقارات أندرويد, مسكني أبلكيشن, تطبيق عقارات صنعاء",
  alternates: { canonical: "/download" },
  openGraph: {
    title: "حمّل تطبيق مسكني للأندرويد",
    description:
      "عقارات وخدمات ومجتمع عقاري لليمن في تطبيق واحد — بلا وسطاء ولا مدفوعات.",
    url: `${SITE_URL}/download`,
    type: "website",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني" }],
  },
};

// روابط برنامج الاختبار المغلق (التطبيق حالياً في closed testing على Google Play).
const GROUP_JOIN = "https://groups.google.com/g/maskani-testers";
const OPT_IN = "https://play.google.com/apps/testing/ar.dev.maskani";
const STORE = "https://play.google.com/store/apps/details?id=ar.dev.maskani";

const FEATURES = [
  { icon: Buildings2, title: "عقارات للبيع والإيجار", desc: "تصفّح آلاف العقارات مع فلترة بالنوع والمدينة والسعر والمساحة." },
  { icon: CaseMinimalistic, title: "خدمات ومقاولات", desc: "اعثر على مزوّدي الخدمات العقارية وقيّمهم، أو قدّم خدماتك." },
  { icon: Magnifer, title: "طلبات عقارية", desc: "انشر ما تبحث عنه واستقبل عروضاً مباشرة من أصحاب العقارات." },
  { icon: ShieldWarning, title: "مجتمع ضدّ الاحتيال", desc: "بلاغات وتصويت مجتمعي لكشف عمليات النصب قبل وقوعها." },
  { icon: ChatRoundLine, title: "محادثة مباشرة", desc: "تواصل فوري بينك وبين صاحب العقار — بلا وسيط." },
  { icon: MapPointWave, title: "خرائط تفاعلية", desc: "استعرض العقارات على الخريطة وحدّد الموقع بدقّة." },
];

const WHY = [
  { icon: BellBing, title: "تنبيهات فورية تسبق الجميع", desc: "بمجرد نزول عقار يطابق معاييرك يصلك إشعار لحظيّ — فتكون أوّل من يتواصل مع صاحبه." },
  { icon: TagPrice, title: "تنبيه انخفاض السعر", desc: "نُعلمك فور تخفيض سعر عقار تتابعه، لتقتنص الفرصة في وقتها المناسب." },
  { icon: Bookmark, title: "عمليات بحث محفوظة", desc: "احفظ معايير بحثك مرّة واحدة، ودع مسكني يبحث ويرشّح لك نيابةً عنك باستمرار." },
  { icon: Bolt, title: "أسرع وأخفّ من المتصفّح", desc: "تصفّح سلس، فتح فوري، وتواصل بضغطة واحدة — تجربة مصمّمة للهاتف." },
  { icon: MedalStar, title: "سمعة تبنيها بمرور الوقت", desc: "تقييمات ومتابعون وثقة تتراكم مع كل تعامل، فتصبح طرفاً موثوقاً في السوق." },
  { icon: UsersGroupRounded, title: "مجتمعك العقاري", desc: "تابِع من يهمّك، شارك في كشف الاحتيال، وكن جزءاً من مجتمع يحمي بعضه." },
];

const HIGHLIGHTS = [
  { icon: VerifiedCheck, label: "بلا وسطاء" },
  { icon: HeartAngle, label: "مفضّلة ومتابعة" },
  { icon: Star, label: "تقييمات موثوقة" },
  { icon: Bell, label: "إشعارات فورية" },
];

const STEPS = [
  {
    n: "1",
    title: "انضم لمجموعة المختبرين",
    desc: "اضغط «Join group» بحسابك على Google — خطوة لمرّة واحدة فقط.",
    cta: "انضمّ للمجموعة",
    href: GROUP_JOIN,
  },
  {
    n: "2",
    title: "فعّل الوصول للاختبار",
    desc: "افتح صفحة الاختبار واضغط «Become a tester» بنفس الحساب.",
    cta: "تفعيل الاختبار",
    href: OPT_IN,
  },
  {
    n: "3",
    title: "حمّل من Google Play",
    desc: "بعد التفعيل، افتح المتجر وحمّل مسكني مباشرةً.",
    cta: "تحميل من Play",
    href: STORE,
  },
];

export default function DownloadPage() {
  const appLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "مسكني",
    operatingSystem: "Android",
    applicationCategory: "LifestyleApplication",
    description:
      "منصة عقارية اجتماعية لليمن: عقارات للبيع والإيجار، خدمات ومقاولات، طلبات عقارية، مجتمع ضدّ الاحتيال، ومحادثة مباشرة — بلا وسطاء ولا مدفوعات.",
    url: `${SITE_URL}/download`,
    downloadUrl: STORE,
    installUrl: STORE,
    inLanguage: "ar",
    offers: { "@type": "Offer", price: "0", priceCurrency: "YER" },
    provider: { "@type": "Organization", name: "مسكني", url: SITE_URL },
  };

  return (
    <div className="bg-cream">
      <JsonLd data={appLd} />
      <JsonLd
        data={breadcrumbList([
          { name: "الرئيسية", path: "/" },
          { name: "تحميل التطبيق", path: "/download" },
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-700 to-primary text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-[1.75rem] overflow-hidden ring-4 ring-white/15 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="أيقونة تطبيق مسكني" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-balance">
            كن أوّل من يعرف بالعقار المناسب
          </h1>
          <p className="text-primary-100 mt-4 max-w-2xl mx-auto leading-relaxed">
            العقارات الجيّدة لا تنتظر. مع تطبيق مسكني تصلك تنبيهات فورية لحظة نزول عقار
            يطابق بحثك أو انخفاض سعره — فتتواصل مع صاحبه مباشرةً قبل الجميع. بلا وسطاء ولا مدفوعات.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a
              href={OPT_IN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-gold text-ink font-bold px-6 py-3.5 shadow-lg hover:bg-gold-400 transition-colors"
            >
              <Smartphone weight="Bold" className="h-5 w-5" />
              ابدأ التحميل الآن
            </a>
            <a
              href="#steps"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 text-white font-semibold px-6 py-3.5 hover:bg-white/15 transition-colors"
            >
              كيف أثبّته؟
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-primary-100 text-sm">
            {HIGHLIGHTS.map((h) => (
              <span key={h.label} className="inline-flex items-center gap-1.5">
                <h.icon weight="Bold" className="h-4 w-4 text-gold" />
                {h.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-extrabold text-ink text-center mb-3">كل ما تحتاجه للعقار في مكان واحد</h2>
        <p className="text-muted text-center mb-10 max-w-2xl mx-auto">
          تطبيق مسكني يجمع البحث والتواصل والخدمات والمجتمع في تجربة واحدة سلسة على هاتفك.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl card-shadow p-5">
              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <f.icon weight="Bold" className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-ink">{f.title}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why install — persuasion / loyalty */}
      <section className="bg-gradient-to-b from-primary to-primary-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-balance">
            لماذا التطبيق أفضل من المتصفّح؟
          </h2>
          <p className="text-primary-100 text-center mt-3 max-w-2xl mx-auto leading-relaxed">
            في سوق سريع، السبق يصنع الفرق. التطبيق يبقى معك في جيبك ويعمل نيابةً عنك — فلا تفوتك فرصة.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 ring-1 ring-white/10">
                <div className="w-11 h-11 rounded-xl bg-gold/20 flex items-center justify-center mb-4">
                  <w.icon weight="Bold" className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-bold text-white">{w.title}</h3>
                <p className="text-sm text-primary-100 mt-1.5 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-white/10 ring-1 ring-white/10 p-6 sm:p-7 text-center max-w-3xl mx-auto">
            <p className="text-lg sm:text-xl font-bold text-white leading-relaxed text-balance">
              مسكني ليس تطبيقاً تفتحه مرّة وتنساه — بل مجتمعك العقاري الذي تتابع فيه، وتُتابَع،
              وتبني سمعتك وثقة الآخرين بك يوماً بعد يوم.
            </p>
            <a
              href={OPT_IN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-gold text-ink font-bold px-7 py-3.5 mt-6 shadow-lg hover:bg-gold-400 transition-colors"
            >
              <Smartphone weight="Bold" className="h-5 w-5" />
              نزّل مسكني الآن مجاناً
            </a>
          </div>
        </div>
      </section>

      {/* Install steps */}
      <section id="steps" className="bg-white border-y border-border scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary text-xs font-bold px-3 py-1.5 mb-3">
              <UsersGroupRounded weight="Bold" className="h-4 w-4" />
              الإصدار حالياً في الاختبار المغلق
            </span>
            <h2 className="text-2xl font-extrabold text-ink">ثبّت التطبيق بثلاث خطوات</h2>
            <p className="text-muted mt-2">أكملها مرّة واحدة بنفس حساب Google، ثم حدّث التطبيق تلقائياً من المتجر.</p>
          </div>

          {/* الطريقة الأسرع — تفعيل تلقائي (يظهر فقط عند تفعيل الميزة) */}
          <TesterEnroll />

          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-cream rounded-2xl p-5 flex items-start gap-4">
                <div className="w-9 h-9 shrink-0 rounded-full bg-primary text-white font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink">{s.title}</h3>
                  <p className="text-sm text-muted mt-1">{s.desc}</p>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 rounded-xl bg-primary text-white font-semibold text-sm px-4 py-2 hover:bg-primary-600 transition-colors"
                  >
                    {s.cta} ↗
                  </a>
                </div>
              </li>
            ))}
          </ol>

          <p className="text-center text-sm text-muted mt-8">
            نسخة iPhone (iOS) قيد التطوير وستتوفّر قريباً. حتى ذلك الحين يمكنك استخدام{" "}
            <Link href="/" className="text-primary font-semibold hover:underline">
              النسخة الكاملة عبر الويب
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Web fallback CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
        <h2 className="text-xl font-extrabold text-ink mb-2">لا تريد التثبيت الآن؟</h2>
        <p className="text-muted mb-6">كل ميزات مسكني متاحة مباشرةً من متصفّحك — بدون تحميل.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary text-white font-bold px-6 py-3 hover:bg-primary-600 transition-colors"
          >
            <Buildings2 weight="Bold" className="h-5 w-5" />
            تصفّح العقارات
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-2xl bg-white text-primary font-bold px-6 py-3 card-shadow hover:bg-primary-50 transition-colors"
          >
            <CaseMinimalistic weight="Bold" className="h-5 w-5" />
            الخدمات
          </Link>
        </div>
      </section>
    </div>
  );
}
