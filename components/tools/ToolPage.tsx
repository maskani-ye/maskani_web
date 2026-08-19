import { ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList, SITE_URL } from "@/lib/seo";
import { Card } from "@/components/ui/Card";
import { ToolMeta, TOOLS, TOOL_ARTICLES } from "@/lib/toolsMeta";

// غلاف خادميّ لصفحة أداة — كل المحتوى (h1، المقدّمة، خطوات العمل، الأسئلة الشائعة،
// JSON-LD) مُصيَّر خادميًّا في HTML الخام للفهرسة؛ الحاسبة التفاعلية (client) تُمرَّر
// كـ children داخل بطاقة.
export function ToolPage({ tool, children }: { tool: ToolMeta; children: ReactNode }) {
  const url = `${SITE_URL}/tools/${tool.slug}`;
  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.h1,
    description: tool.metaDescription,
    url,
    applicationCategory: tool.category,
    operatingSystem: "Web",
    // لا `offers` هنا: وجود عرض بيع يجعل جوجل يفحص الصفحة كـ«مقتطف منتج»
    // فيطالبها بـ aggregateRating و review — تقييماتٍ لا نملكها ولن نختلقها.
    // `isAccessibleForFree` يقول «مجّانية» بلا استدعاء فحص المنتجات.
    isAccessibleForFree: true,
    provider: { "@type": "Organization", name: "مسكني", url: SITE_URL },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  // HowTo — الخطوات مؤهّلة لنتيجة ثرية، وتُثبّت للزاحف أن الصفحة أداة تنفيذية
  // لا مقالاً؛ هذا هو الفارق الذي يجعلها تسبق المقالات على كلمة «كيف أحسب…».
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tool.h1,
    description: tool.metaDescription,
    step: tool.how.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `الخطوة ${i + 1}`,
      text: s,
      url: `${url}#how`,
    })),
  };
  const others = TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 4);
  const articles = TOOL_ARTICLES[tool.slug] ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <JsonLd data={softwareApp} />
      <JsonLd data={faqLd} />
      <JsonLd data={howToLd} />
      <JsonLd data={breadcrumbList([
        { name: "الرئيسية", path: "/" },
        { name: "الأدوات", path: "/tools" },
        { name: tool.cardTitle, path: `/tools/${tool.slug}` },
      ])} />

      {/* مسار تنقّل */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5" aria-label="مسار التنقّل">
        <Link href="/" className="hover:text-primary">الرئيسية</Link>
        <span>›</span>
        <Link href="/tools" className="hover:text-primary">الأدوات</Link>
        <span>›</span>
        <span className="text-gray-600">{tool.cardTitle}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight">{tool.h1}</h1>
        <p className="text-gray-600 mt-3 leading-relaxed">{tool.intro}</p>
      </header>

      <Card className="p-5 sm:p-6 mb-8">{children}</Card>

      {tool.sections?.length ? (
        <div className="mb-8 space-y-6">
          {tool.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold text-ink mb-2">{s.h}</h2>
              <p className="text-gray-600 leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>
      ) : null}

      <section id="how" className="mb-8">
        <h2 className="text-lg font-bold text-ink mb-3">كيف تعمل الأداة؟</h2>
        <ol className="list-decimal pr-5 space-y-2 text-gray-600 leading-relaxed marker:text-primary marker:font-bold">
          {tool.how.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-ink mb-3">أسئلة شائعة</h2>
        <div className="space-y-3">
          {tool.faq.map((f, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
              <h3 className="font-bold text-ink text-sm mb-1">{f.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {articles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-ink mb-3">مقالات ذات صلة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {articles.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-primary transition-colors">
                <p className="font-bold text-ink text-sm leading-snug">{a.title}</p>
                <span className="inline-block mt-2 text-primary text-xs font-semibold">اقرأ المقال ←</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold text-ink mb-3">أدوات أخرى</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {others.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-primary transition-colors">
              <p className="font-bold text-ink text-sm">{t.cardTitle}</p>
              <p className="text-gray-500 text-xs mt-1 line-clamp-1">{t.cardDesc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
