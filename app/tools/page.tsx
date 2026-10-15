import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, itemList, SITE_URL } from "@/lib/seo";
import { TOOLS } from "@/lib/toolsMeta";
import { FILE_TOOL_GROUPS, oxfileUrl } from "@/lib/fileTools";

export const metadata: Metadata = {
  title: "أدوات وحاسبات عقارية | حاسبة البناء والعائد والأقساط",
  description:
    "حاسبات عقارية مجّانية من مسكني: تكلفة البناء، العائد الإيجاريّ، أقساط الشراء، القدرة على الإيجار، ومحوّل مساحة الأراضي — أدوات عملية لكل أسواق المنصّة.",
  keywords: ["أدوات عقارية", "حاسبات عقارية", "حاسبة البناء", "حاسبة العائد الإيجاري", "حاسبة الأقساط", "محوّل مساحة"],
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "أدوات وحاسبات عقارية — مسكني",
    description: "حاسبة تكلفة البناء، العائد الإيجاريّ، الأقساط، القدرة على الإيجار، ومحوّل المساحة.",
    url: `${SITE_URL}/tools`,
    type: "website",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني" }],
  },
};

export default function ToolsHub() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={breadcrumbList([{ name: "الرئيسية", path: "/" }, { name: "الأدوات", path: "/tools" }])} />
      <JsonLd data={itemList("أدوات وحاسبات عقارية", TOOLS.map((t) => `/tools/${t.slug}`))} />

      <header className="mb-8">
        <h1 className="text-h2 sm:text-h1 font-extrabold text-ink leading-tight">أدوات وحاسبات عقارية</h1>
        <p className="text-muted-600 mt-3 leading-relaxed max-w-3xl">
          مجموعة أدوات مجّانية تساعدك على اتّخاذ قرارات عقارية أذكى في سوقك — من تقدير تكلفة البناء وحساب العائد الإيجاريّ والأقساط، إلى تحويل وحدات مساحة الأراضي. كلّها فورية وتعمل من متصفّحك مباشرة.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="rounded-2xl border border-muted-200 bg-white p-5 hover:border-primary hover:shadow-e3 transition-all group"
          >
            <h2 className="font-bold text-ink text-h3 group-hover:text-primary transition-colors">{t.cardTitle}</h2>
            <p className="text-muted-500 text-body mt-1.5 leading-relaxed">{t.cardDesc}</p>
            <span className="inline-block mt-3 text-primary text-body font-semibold">افتح الأداة ←</span>
          </Link>
        ))}
      </div>

      {/* أدوات الملفات — تفتح في OxFile (موقعٌ شقيق). */}
      <section className="mt-12" aria-labelledby="file-tools">
        <h2 id="file-tools" className="text-h3 sm:text-h2 font-extrabold text-ink">أدوات صور العقار والمستندات</h2>
        <p className="text-muted-600 mt-2 leading-relaxed max-w-3xl">
          جهّز صور إعلانك وعقودك قبل النشر أو الإرسال. هذه الأدوات مجّانية وتفتح في موقع OxFile.
        </p>
        {FILE_TOOL_GROUPS.map((g) => (
          <div key={g.title} className="mt-6">
            <h3 className="font-bold text-ink text-body-lg mb-3">{g.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {g.tools.map((t) => (
                <a
                  key={t.path}
                  href={oxfileUrl(t.path, "tools_hub")}
                  target="_blank"
                  rel="noopener"
                  className="rounded-2xl border border-muted-200 bg-white p-4 hover:border-primary hover:shadow-e3 transition-all group"
                >
                  <span className="block font-bold text-ink group-hover:text-primary transition-colors">{t.title}</span>
                  <span className="block text-muted-500 text-body mt-1 leading-relaxed">{t.desc}</span>
                  <span className="inline-block mt-2 text-primary text-caption font-semibold">افتح في OxFile ↗</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
