import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, itemList, SITE_URL } from "@/lib/seo";
import { TOOLS } from "@/lib/toolsMeta";

export const metadata: Metadata = {
  title: "أدوات وحاسبات عقارية | حاسبة البناء والعائد والأقساط",
  description:
    "حاسبات عقارية مجّانية من مسكني: تكلفة البناء، العائد الإيجاريّ، أقساط الشراء، القدرة على الإيجار، ومحوّل مساحة الأراضي — أدوات عملية للسوق اليمنيّ.",
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight">أدوات وحاسبات عقارية</h1>
        <p className="text-gray-600 mt-3 leading-relaxed max-w-3xl">
          مجموعة أدوات مجّانية تساعدك على اتّخاذ قرارات عقارية أذكى في السوق اليمنيّ — من تقدير تكلفة البناء وحساب العائد الإيجاريّ والأقساط، إلى تحويل وحدات مساحة الأراضي. كلّها فورية وتعمل من متصفّحك مباشرة.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary hover:shadow-card-hover transition-all group"
          >
            <h2 className="font-bold text-ink text-lg group-hover:text-primary transition-colors">{t.cardTitle}</h2>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{t.cardDesc}</p>
            <span className="inline-block mt-3 text-primary text-sm font-semibold">افتح الأداة ←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
