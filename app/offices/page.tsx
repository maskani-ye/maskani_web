import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, SITE_URL } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NUMERIC_LOCALE } from "@/lib/utils";
import {
  Buildings2, ChartSquare, ShieldCheck, Wallet, Phone,
  CheckCircle, AltArrowLeft, ClipboardList,
} from "@solar-icons/react";

/**
 * صفحة عرض للمكاتب العقارية والدلّالين — أقصر طريق إلى المخزون.
 *
 * ⚠️ **الأرقام هنا حقيقية ومُقاسة، لا تسويقية.** الدلّال يعرف سوقه ويكشف
 * المبالغة في أوّل سؤال؛ ورقمٌ صغير صادق («١١ عقاراً نالت ٢٬٦١٧ مشاهدة»)
 * أقنعُ من رقمٍ كبير غامض («٥٦ ألف زيارة» — وأغلبها زواحف لا بشر).
 *
 * ولا نكتب رقم تواصل في الشيفرة: يُدار من اللوحة، وبيانات تواصل مختلقة أسوأ
 * من غيابها.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.maskani.homes/api/v1";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "للمكاتب العقارية والدلّالين — انشر مخزونك مجّاناً | مسكني",
  description:
    "مكتبك العقاري يعرض عشرات العقارات؟ انشرها كلّها على مسكني مجّاناً، ويصلك الباحث على رقمك مباشرةً بلا وسيط وبلا عمولة. نستورد قائمتك دفعةً واحدة.",
  keywords: [
    "مكاتب عقارية اليمن", "دلال عقاري", "مكتب عقاري إب", "نشر عقارات مجاناً",
    "تسويق عقاري اليمن", "مسكني للمكاتب",
  ],
  alternates: { canonical: "/offices" },
};

async function getPhone(): Promise<string> {
  try {
    const res = await fetch(`${API}/settings/app-config/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return "";
    return ((await res.json()).general_phone || "").trim();
  } catch {
    return "";
  }
}

/** أرقامٌ مُقاسة من تحليلات المنصّة — تُحدَّث يدوياً عند كل مراجعة. */
const PROOF = [
  { value: 2617, label: "مشاهدة لصفحات العقارات", note: "في ٣٠ يوماً" },
  { value: 22, label: "محاولة تواصل مع ملّاك", note: "اتصال · واتساب · محادثة" },
  { value: 11, label: "عقاراً معروضاً فقط", note: "أي ≈٢٣٨ مشاهدة للعقار الواحد" },
];

const VALUE = [
  {
    Icon: Wallet,
    title: "مجّاناً بلا عمولة",
    body: "لا رسوم نشر ولا نسبة من الصفقة. الباحث يصلك على رقمك، والاتفاق بينكما وحدكما.",
  },
  {
    Icon: ClipboardList,
    title: "نستورد قائمتك دفعةً واحدة",
    body: "عندك عشرون عقاراً؟ أرسل جدولاً واحداً ونحن ننشرها كلّها — لا تسجيل عشرين مرّة.",
  },
  {
    Icon: ChartSquare,
    title: "تعرف أداء كل إعلان",
    body: "كم شاهد إعلانك، وكم حاول الاتصال بك، وأيّ عقار يجذب أكثر — أرقام لا تعطيها لك مجموعة واتساب.",
  },
  {
    Icon: ShieldCheck,
    title: "توثيق يرفع ثقة الباحث",
    body: "مكتبك موثّق على المنصّة، وإشارات الثقة تظهر على كل إعلان — فيفرّقك الباحث عن المجهول.",
  },
];

const STEPS = [
  { n: 1, title: "تواصل معنا", body: "رسالة واحدة على واتساب فيها اسم مكتبك ومدينتك." },
  { n: 2, title: "أرسل قائمتك", body: "جدول بسيط: العقار · النوع · المدينة · السعر · رقمك. أو أرسلها كما تكتبها في مجموعاتك ونحن نصوغها." },
  { n: 3, title: "تُنشر خلال ساعات", body: "نراجعها وننشرها باسم مكتبك وبرقمك، ويبدأ الباحثون بالوصول إليك." },
];

export default async function OfficesPage() {
  const phone = await getPhone();
  const digits = phone.replace(/\D/g, "");
  const waText = encodeURIComponent(
    "السلام عليكم، أنا صاحب مكتب عقاري وأرغب بنشر مخزوني على مسكني.",
  );

  return (
    <div className="bg-white">
      <JsonLd
        data={breadcrumbList([
          { name: "الرئيسية", path: "/" },
          { name: "للمكاتب العقارية", path: "/offices" },
        ])}
      />

      {/* ─── الصدر ─────────────────────────────────────────────────────── */}
      <section className="bg-ink text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <Breadcrumbs
            items={[{ name: "الرئيسية", href: "/" }, { name: "للمكاتب العقارية" }]}
          />
          <div className="max-w-3xl mt-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3.5 py-1.5 text-caption font-bold">
              <Buildings2 weight="Bold" className="h-4 w-4 text-gold" />
              للمكاتب العقارية والدلّالين
            </span>
            <h1 className="text-h1 md:text-display mt-5 text-balance">
              مخزونك كلّه على مسكني — مجّاناً
            </h1>
            <p className="text-body-lg text-white/75 mt-4 leading-relaxed">
              أرسل قائمة عقاراتك مرّةً واحدة وننشرها لك باسم مكتبك وبرقمك.
              الباحث يصلك مباشرةً، ولا نأخذ رسوم نشر ولا نسبة من الصفقة.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {digits && (
                <a
                  href={`https://wa.me/${digits}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-body font-bold text-ink hover:bg-white/90 transition-colors"
                >
                  <Phone weight="Bold" className="h-5 w-5" />
                  راسلنا على واتساب
                </a>
              )}
              <Link
                href="/properties/create"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/25 px-6 py-3 text-body font-bold text-white hover:bg-white/20 transition-colors"
              >
                أو انشر عقاراً بنفسك
                <AltArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── الإثبات ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h2 className="text-h2 text-ink">أرقام حقيقية لا وعود</h2>
        <p className="text-body text-muted mt-2">
          هذا ما جرى فعلاً على المنصّة في آخر ثلاثين يوماً — بمخزون صغير جدّاً.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-7">
          {PROOF.map((p) => (
            <div key={p.label} className="rounded-2xl bg-cream p-6 ring-1 ring-ink/[0.06]">
              <p className="text-display text-primary tabular-nums leading-none">
                {p.value.toLocaleString(NUMERIC_LOCALE)}
              </p>
              <p className="text-body font-semibold text-ink mt-3">{p.label}</p>
              <p className="text-caption text-muted mt-1">{p.note}</p>
            </div>
          ))}
        </div>
        <p className="text-caption text-muted mt-5 leading-relaxed max-w-2xl">
          نقولها بصراحة: مسكني منصّة جديدة ومخزونها ما زال صغيراً. لكن هذا في
          صالحك — إعلانك اليوم بين أحد عشر إعلاناً لا بين ألف، فيراه كل من يبحث.
        </p>
      </section>

      {/* ─── ماذا تكسب ─────────────────────────────────────────────────── */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <h2 className="text-h2 text-ink mb-7">ماذا يكسب مكتبك؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUE.map(({ Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 ring-1 ring-ink/[0.06]">
                <span className="w-11 h-11 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-4">
                  <Icon weight="Bold" className="h-5 w-5" />
                </span>
                <h3 className="text-h3 text-ink">{title}</h3>
                <p className="text-caption text-muted mt-1.5 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── كيف تبدأ ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h2 className="text-h2 text-ink mb-7">ثلاث خطوات وتبدأ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-2xl bg-white p-6 ring-1 ring-ink/[0.06]">
              <span className="inline-flex w-9 h-9 rounded-xl bg-primary text-white items-center justify-center text-body font-bold tabular-nums">
                {s.n.toLocaleString(NUMERIC_LOCALE)}
              </span>
              <h3 className="text-h3 text-ink mt-4">{s.title}</h3>
              <p className="text-caption text-muted mt-1.5 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── الختام ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-primary text-white p-8 sm:p-10">
          <h2 className="text-h1 text-balance">جاهز ننشر مخزونك؟</h2>
          <p className="text-body-lg text-white/75 mt-3 max-w-2xl leading-relaxed">
            أرسل لنا قائمة عقاراتك كما هي — حتى لو كانت رسائل واتساب غير مرتّبة.
            نحن نصوغها وننشرها، ونرسل لك روابط إعلاناتك.
          </p>
          <ul className="grid gap-2 mt-6 max-w-xl">
            {[
              "بلا رسوم نشر وبلا عمولة",
              "رقمك أنت على كل إعلان",
              "تعديل أو حذف أي إعلان متى شئت",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-body text-white/90">
                <CheckCircle weight="Bold" className="h-5 w-5 text-gold flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
          {digits && (
            <a
              href={`https://wa.me/${digits}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-body font-bold text-primary mt-8 hover:bg-white/90 transition-colors"
            >
              <Phone weight="Bold" className="h-5 w-5" />
              ابدأ الآن على واتساب
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
