import type { Metadata } from "next";
import Link from "next/link";
import { isMarket } from "@/lib/markets";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { breadcrumbList, SITE_URL } from "@/lib/seo";
import { Card } from "@/components/ui/Card";
import AreaConverter from "@/components/tools/AreaConverter";

/**
 * ⚠️ درسٌ من عطل حيّ (2026-08-23): بُني الويب بينما كانت القاعدة ساقطة، فثُبِّتت
 * صفحاتٌ على **404 دائم** وزارها جوجل فسجّلها «غير موجودة». بلا `revalidate` لا
 * تُعيد الصفحة المحاولة أبداً مهما تعافى الخادم — فيتحوّل عطلٌ عابر إلى ضرر
 * دائم في نتائج البحث.
 */
export const revalidate = 3600;

import {
  ALL_UNITS, GLOBAL_UNITS, unitBySlug, unitsOfCountry, countryByCode, BASIS_LABEL,
} from "@/lib/areaUnits";

// صفحة لكل وحدة. سببها بحثيّ محض: من يبحث «القصبة الإبي كم متر» لا يبحث عن
// «محوّل مساحات» — يريد رقماً الآن. صفحةٌ عنوانها سؤاله وجوابها في أوّل سطر
// تكسب النتيجة، بينما صفحة الأداة العامة تُهزَم لأنها لا تذكر وحدته باسمها.
// وكل وحدة موسومة بدولتها، فيظهر الجواب في نتائج بلد الباحث لا في بلدٍ واحد.

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 2 : 4 });

export function generateStaticParams() {
  return ALL_UNITS.map((u) => ({ unit: u.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ unit: string }> },
): Promise<Metadata> {
  const { unit: slug } = await params;
  const u = unitBySlug(slug);
  if (!u) return {};
  const c = countryByCode(u.country);
  const where = c ? ` في ${c.name}` : "";
  const title = `${u.name} كم متر مربّع؟ = ${fmt(u.m2)} م²${where}`;
  const description = `${u.name}${where} يساوي ${fmt(u.m2)} متر مربّع (${BASIS_LABEL[u.basis]})${u.region ? ` — ${u.region}` : ""}. حوّل أي مساحة فوراً بين ${u.short} والمتر المربّع والهكتار والدونم والفدان — مجّاناً من مسكني.`;
  return {
    title,
    description,
    keywords: [
      `${u.name} كم متر`, `${u.name} كم متر مربع`, `تحويل ${u.short} إلى متر مربع`,
      `${u.short} كم متر`, "وحدات قياس الأراضي", ...(u.aliases ?? []),
    ],
    alternates: { canonical: `/tools/area-converter/${u.slug}` },
    openGraph: {
      title, description, type: "article",
      url: `${SITE_URL}/tools/area-converter/${u.slug}`,
      images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني" }],
    },
  };
}

export default async function UnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit: slug } = await params;
  const u = unitBySlug(slug);
  if (!u) notFound();

  const country = countryByCode(u.country);
  // سوق المنصّة المقابل لدولة الوحدة — الوحدات المعياريّة («*») ودولٌ لا سوق
  // لها (السودان · فلسطين …) لا تُنتج رابطاً: وعدٌ بسوقٍ لا نملكه أسوأ من صمت.
  const marketCode = isMarket(u.country.toLowerCase()) ? u.country.toLowerCase() : null;
  const siblings = u.country === "*"
    ? GLOBAL_UNITS.filter((x) => x.key !== u.key)
    : unitsOfCountry(u.country).filter((x) => x.key !== u.key);
  const quick = [1, 2, 5, 10, 20, 50, 100];
  const targets = [
    { name: "متر مربّع", m2: 1 },
    { name: "هكتار", m2: 10_000 },
    { name: "دونم", m2: 1000 },
    { name: "قدم مربّع", m2: 0.09290304 },
  ];

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${u.name} كم متر مربّع؟`,
        acceptedAnswer: { "@type": "Answer", text: `${u.name} يساوي ${fmt(u.m2)} متراً مربّعاً${u.note ? ` (${u.note})` : ""}.` },
      },
      {
        "@type": "Question",
        name: `كم ${u.short} في الهكتار؟`,
        acceptedAnswer: { "@type": "Answer", text: `الهكتار (10,000 م²) يساوي ${fmt(10000 / u.m2)} ${u.short}.` },
      },
      ...(siblings.length
        ? [{
            "@type": "Question",
            name: `هل تختلف قيمة ${u.short} بين المناطق؟`,
            acceptedAnswer: {
              "@type": "Answer",
              text: u.basis === "official"
                ? `لا — ${u.name} قيمتها ثابتة ${fmt(u.m2)} م² لا تختلف بين منطقة وأخرى.`
                : `نعم، ولهذا نعرض كل اشتقاق وحدةً مستقلّة: ${siblings.map((s) => `${s.name} = ${fmt(s.m2)} م²`).join("، ")}.`,
            },
          }]
        : []),
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={faq} />
      <JsonLd data={breadcrumbList([
        { name: "الرئيسية", path: "/" },
        { name: "الأدوات", path: "/tools" },
        { name: "محوّل المساحات", path: "/tools/area-converter" },
        { name: u.name, path: `/tools/area-converter/${u.slug}` },
      ])} />
      <Breadcrumbs items={[
        { name: "الرئيسية", href: "/" },
        { name: "الأدوات", href: "/tools" },
        { name: "محوّل المساحات", href: "/tools/area-converter" },
        { name: u.name },
      ]} />

      <header className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight">
          {u.name} كم متر مربّع؟
        </h1>
        {/* الجواب في أوّل سطر: من يبحث عن رقم لا ينتظر مقدّمة. */}
        <p className="mt-3 text-lg">
          <strong className="text-primary text-2xl font-extrabold tabular-nums">{fmt(u.m2)} م²</strong>
          <span className="text-gray-600">
            {" "}— {u.name}
            {country && country.code !== "*" ? ` في ${country.name}` : ""}
            {u.region ? ` (${u.region})` : ""}.
          </span>
        </p>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="rounded-lg bg-gray-100 text-gray-600 px-2.5 py-1 font-semibold">
            {BASIS_LABEL[u.basis]}
          </span>
          {u.note && <span className="rounded-lg bg-gray-100 text-gray-600 px-2.5 py-1">{u.note}</span>}
        </div>
      </header>

      <Card className="p-5 sm:p-6 mb-8">
        <AreaConverter
          initialCountry={u.country === "*" ? "YE" : u.country}
          initialUnit={u.key}
        />
      </Card>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-ink mb-3">جدول تحويل جاهز</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-xs text-gray-400 text-right border-b border-gray-100">
                <th className="pb-2 font-medium">{u.short}</th>
                {targets.map((t) => <th key={t.name} className="pb-2 font-medium">{t.name}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quick.map((q) => (
                <tr key={q} className="text-gray-700 tabular-nums">
                  <td className="py-2 font-bold text-ink">{q}</td>
                  {targets.map((t) => (
                    <td key={t.name} className="py-2">{fmt((q * u.m2) / t.m2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-ink mb-2">
            {u.country === "*" ? "وحدات معياريّة أخرى" : `وحدات ${country?.name} الأخرى`}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            {u.basis === "official"
              ? "قيم ثابتة لا تختلف بين منطقة وأخرى."
              : "اشتقاقات تحمل الاسم نفسه بقيم مختلفة — تأكّد أيّها المقصود في وثيقتك قبل الحساب."}
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {siblings.map((s) => (
              <Link key={s.key} href={`/tools/area-converter/${s.slug}`}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 flex items-center justify-between gap-3 hover:border-primary transition-colors">
                <span className="min-w-0">
                  <span className="text-sm font-semibold text-gray-800 block truncate">{s.name}</span>
                  {s.region && <span className="text-[11px] text-gray-400">{s.region}</span>}
                </span>
                <span className="text-sm font-bold text-primary tabular-nums shrink-0">{fmt(s.m2)} م²</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ⚠️ **22,263 ظهوراً في ثلاثين يوماً على صفحات الأدوات — و210 نقرة
          للموقع كلّه.** استعلامات «القيراط كم متر» يجيب عنها جوجل في النتيجة
          نفسها فلا يدخل الزائر، ومن يدخل لا يجد **بابا واحداً إلى العقارات**:
          الصفحة تحوّل ولا تعرض. وهذه الوحدة تعرف دولتها (`u.country`) فالسوق
          معروفٌ بلا تخمين — والرابط يمرّر سُلطة هذه الصفحات إلى صفحات البيع
          بدل أن تُهدر، ويحوّل زائراً يقيس أرضاً إلى زائرٍ يبحث عنها. */}
      {marketCode && (
        <section className="mb-8 rounded-2xl bg-primary-50 ring-1 ring-primary/10 p-5 sm:p-6">
          <h2 className="text-h3 text-ink">
            تبحث عن أرض أو عقار في {country?.name}؟
          </h2>
          <p className="mt-1.5 text-body leading-relaxed text-muted">
            حوّلتَ المساحة — والخطوة التالية أن ترى ما هو معروضٌ فعلاً بهذه المساحة
            وسعرها ورقم صاحبها مباشرةً، بلا عمولة.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href={`/${marketCode}/properties`}
              className="rounded-xl bg-primary px-5 py-2.5 text-body font-bold text-white transition-colors hover:bg-primary-600"
            >
              عقارات {country?.name}
            </Link>
            <Link
              href={`/${marketCode}/requests`}
              className="rounded-xl bg-white px-5 py-2.5 text-body font-bold text-ink ring-1 ring-ink/10 transition-colors hover:bg-cream"
            >
              من يبحث الآن
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold text-ink mb-3">وحدات دول أخرى</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_UNITS.filter((x) => x.country !== u.country).slice(0, 18).map((x) => (
            <Link key={x.key} href={`/tools/area-converter/${x.slug}`}
              className="text-xs rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-gray-600 hover:border-primary hover:text-primary transition-colors">
              {x.name}
            </Link>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          هذه القيم هي المتعامَل بها فعلياً بين المسّاحين والسوق في كل إقليم، وقد يختلف
          العرف بين مديريّة وأخرى. وعند إبرام الصفقة يبقى المرجع محضر المسّاح والوثيقة.
        </p>
      </section>
    </div>
  );
}
