import type { Metadata } from "next";
import Link from "next/link";
import {
  Buildings2,
  CaseMinimalistic,
  ShieldWarning,
  ChatRoundLine,
  MapPointWave,
  Magnifer,
  BellBing,
  TagPrice,
  Bookmark,
  Bolt,
  MedalStar,
  UsersGroupRounded,
  DownloadMinimalistic,
  ShieldCheck,
} from "@solar-icons/react";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, breadcrumbList } from "@/lib/seo";
import { DownloadAppBadge } from "@/components/download/DownloadAppBadge";
import { APK_URL, APK_VERSION } from "@/lib/appDownload";

export const metadata: Metadata = {
  title: "حمّل تطبيق مسكني للأندرويد | تنزيل مباشر APK",
  description:
    "حمّل تطبيق مسكني للأندرويد مباشرةً (APK) بضغطة واحدة: عقارات للبيع والإيجار، خدمات، طلبات، محادثة مباشرة، وتنبيهات فورية — بلا وسطاء ولا مدفوعات.",
  keywords:
    "تحميل تطبيق مسكني, تنزيل مسكني APK, تطبيق عقارات اليمن أندرويد, مسكني أبلكيشن, تطبيق عقارات صنعاء",
  alternates: { canonical: "/download" },
  openGraph: {
    title: "حمّل تطبيق مسكني للأندرويد",
    description: "عقارات وخدمات ومجتمع عقاري لليمن في تطبيق واحد — تنزيل مباشر بلا وسطاء.",
    url: `${SITE_URL}/download`,
    type: "website",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني" }],
  },
};

const FEATURES = [
  { icon: Buildings2, title: "عقارات للبيع والإيجار", desc: "تصفّح آلاف العقارات مع فلترة بالنوع والمدينة والسعر والمساحة." },
  { icon: CaseMinimalistic, title: "خدمات ومقاولات", desc: "اعثر على مزوّدي الخدمات العقارية وقيّمهم، أو قدّم خدماتك." },
  { icon: Magnifer, title: "طلبات عقارية", desc: "انشر ما تبحث عنه واستقبل عروضاً مباشرة من أصحاب العقارات." },
  { icon: ShieldWarning, title: "مجتمع ضدّ الاحتيال", desc: "بلاغات وتصويت مجتمعي لكشف عمليات النصب قبل وقوعها." },
  { icon: ChatRoundLine, title: "محادثة مباشرة", desc: "تواصل فوري بينك وبين صاحب العقار — بلا وسيط." },
  { icon: MapPointWave, title: "خرائط تفاعلية", desc: "استعرض العقارات على الخريطة وحدّد الموقع بدقّة." },
];

const WHY = [
  { icon: BellBing, title: "تنبيهات فورية تسبق الجميع", desc: "بمجرد نزول عقار يطابق معاييرك يصلك إشعار لحظيّ — فتكون أوّل من يتواصل." },
  { icon: TagPrice, title: "تنبيه انخفاض السعر", desc: "نُعلمك فور تخفيض سعر عقار تتابعه، لتقتنص الفرصة في وقتها." },
  { icon: Bookmark, title: "عمليات بحث محفوظة", desc: "احفظ معايير بحثك ودَع مسكني يبحث ويرشّح لك نيابةً عنك." },
  { icon: Bolt, title: "أسرع وأخفّ من المتصفّح", desc: "تصفّح سلس، فتح فوري، وتواصل بضغطة واحدة." },
  { icon: MedalStar, title: "سمعة تبنيها بمرور الوقت", desc: "تقييمات ومتابعون وثقة تتراكم مع كل تعامل." },
  { icon: UsersGroupRounded, title: "مجتمعك العقاري", desc: "تابِع من يهمّك، وكن جزءاً من مجتمع يحمي بعضه." },
];

const STEPS = [
  { n: "1", title: "اضغط «تحميل»", desc: "يبدأ تنزيل ملف التطبيق (APK) مباشرةً على جهازك — بحجم صغير وبضغطة واحدة." },
  { n: "2", title: "اسمح بالتثبيت", desc: "عند فتح الملف قد يطلب هاتفك السماح بالتثبيت من «هذا المصدر» — فعّله (خطوة لمرّة واحدة)." },
  { n: "3", title: "افتح واستمتع", desc: "ثبّت التطبيق، سجّل دخولك بحساب Google، وابدأ فوراً." },
];

export default function DownloadPage() {
  const appLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "مسكني",
    operatingSystem: "Android",
    applicationCategory: "LifestyleApplication",
    softwareVersion: APK_VERSION,
    description:
      "منصة عقارية اجتماعية لليمن: عقارات للبيع والإيجار، خدمات ومقاولات، طلبات عقارية، مجتمع ضدّ الاحتيال، ومحادثة مباشرة — بلا وسطاء ولا مدفوعات.",
    url: `${SITE_URL}/download`,
    downloadUrl: APK_URL,
    installUrl: APK_URL,
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
            العقارات الجيّدة لا تنتظر. مع تطبيق مسكني تصلك تنبيهات فورية لحظة نزول عقار يطابق بحثك
            أو انخفاض سعره — فتتواصل مع صاحبه مباشرةً قبل الجميع. بلا وسطاء ولا مدفوعات.
          </p>

          <div className="flex flex-col items-center gap-3 mt-8">
            <DownloadAppBadge variant="light" className="scale-110" />
            <span className="text-primary-100 text-xs">
              أندرويد · النسخة {APK_VERSION} · تنزيل مباشر مجّاني
            </span>
          </div>
        </div>
      </section>

      {/* Install steps */}
      <section className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl font-extrabold text-ink text-center mb-3">التثبيت في ٣ خطوات</h2>
          <p className="text-muted text-center mb-10">لا حساب متجر ولا انتظار — التطبيق يعمل خلال دقيقة.</p>
          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-cream rounded-2xl p-5 flex items-start gap-4">
                <div className="w-9 h-9 shrink-0 rounded-full bg-primary text-white font-bold flex items-center justify-center">{s.n}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink">{s.title}</h3>
                  <p className="text-sm text-muted mt-1">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col items-center gap-3">
            <DownloadAppBadge variant="dark" />
            <p className="inline-flex items-center gap-1.5 text-muted text-xs">
              <ShieldCheck weight="Bold" className="h-4 w-4 text-success" />
              ملفّ موقّع رقميّاً من مسكني — آمن تماماً
            </p>
          </div>
        </div>
      </section>

      {/* Why install — persuasion / loyalty */}
      <section className="bg-gradient-to-b from-primary to-primary-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-balance">لماذا التطبيق أفضل من المتصفّح؟</h2>
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

      {/* Web fallback CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 text-center">
        <p className="text-muted mb-6">نسخة iPhone قيد التطوير — وحتى ذلك الحين كل الميزات متاحة عبر المتصفّح.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/properties" className="inline-flex items-center gap-2 rounded-2xl bg-primary text-white font-bold px-6 py-3 hover:bg-primary-600 transition-colors">
            <Buildings2 weight="Bold" className="h-5 w-5" />
            تصفّح العقارات
          </Link>
          <a href={APK_URL} className="inline-flex items-center gap-2 rounded-2xl bg-white text-primary font-bold px-6 py-3 card-shadow hover:bg-primary-50 transition-colors">
            <DownloadMinimalistic weight="Bold" className="h-5 w-5" />
            تحميل التطبيق
          </a>
        </div>
      </section>
    </div>
  );
}
