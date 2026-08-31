import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marketByCode, type Market } from "@/lib/serverMarket";
import { MARKETS } from "@/lib/markets";

/**
 * مصنع صفحات أقسام السوق — **تعريفٌ واحد لأربع صفحات**.
 *
 * ⚠️ **لماذا مصنع لا نسخ**: الصفحات الأربع (`properties` · `services` ·
 * `requests` · `jobs`) كانت متطابقة في كل شيء عدا نصّها: نفس `revalidate`،
 * نفس `generateStaticParams`، نفس قاعدة `noindex` للسوق الفارغ، نفس
 * `notFound`. الجرد وجدها **مكرّرة في أربعة ملفّات**، ومعنى ذلك أن أي تصحيح في
 * قاعدة الفهرسة يحتاج أربع تعديلات — وينسى أحدها حتماً.
 *
 * الاختلاف الحقيقيّ بين الأقسام ثلاثة أشياء فقط: العنوان، الوصف، والمكوّن.
 * وهي وحدها ما يُمرَّر هنا.
 */
export interface MarketSectionConfig {
  /** المقطع في المسار: `properties` · `services` … */
  slug: string;
  /** العنوان — يستقبل اسم السوق ومدنه. */
  title: (m: Market) => string;
  /** الوصف — يستقبل اسم السوق ومدنه. */
  description: (m: Market, cities: string) => string;
  /** واجهة القسم. */
  render: () => React.ReactNode;
}

export function createMarketSection(cfg: MarketSectionConfig) {
  // ⚠️ `revalidate` و`dynamicParams` **لا تُصدَّران من هنا**: يشترط Next أن
  // يقرأهما ساكنتين في ملفّ الصفحة نفسه، فتبقيان سطرين حرفيّين هناك.

  function generateStaticParams() {
    return MARKETS.map((market) => ({ market }));
  }

  async function generateMetadata(
    { params }: { params: Promise<{ market: string }> },
  ): Promise<Metadata> {
    const { market } = await params;
    const m = await marketByCode(market);
    if (!m) return {};
    const cities = m.cities.join(" و") || m.nameAr;
    const title = cfg.title(m);
    const description = cfg.description(m, cities);
    return {
      title: { absolute: `${title} | مسكني` },
      description,
      // ⚠️ **السوق الفارغ لا يُفهرَس**: صفحة قائمة بلا عنصر واحد محتوى رقيق —
      // جوجل يردّ «اكتُشفت ولم تُفهرَس»، وملفّ أدسنس عندنا رُفض مرّة بسبب
      // «شاشات بلا محتوى ناشر». تُفتح الفهرسة تلقائياً بأوّل عنصر يُنشر.
      robots: m.count > 0 ? undefined : { index: false, follow: true },
      alternates: { canonical: `/${market}/${cfg.slug}` },
      openGraph: {
        title, description,
        url: `/${market}/${cfg.slug}`,
        siteName: "مسكني",
        locale: "ar_AR",
      },
    };
  }

  async function Page({ params }: { params: Promise<{ market: string }> }) {
    const { market } = await params;
    const m = await marketByCode(market);
    if (!m) notFound();
    return <>{cfg.render()}</>;
  }

  return { generateStaticParams, generateMetadata, Page };
}
