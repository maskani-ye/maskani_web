import { oxfileUrl, pickBannerTool, type BannerTool } from "@/lib/fileTools";

// بانر ترويجيّ لأداةٍ من OxFile (موقعٌ شقيق) — ليس وحدة AdSense.
// ⚠️ يُكتب «من أدوات OxFile» صراحةً: إعلانٌ داخليّ بلا تسمية يخدع القارئ.
export function OxFileBanner({
  medium,
  topic,
  tool,
  className = "",
}: {
  /** مكان البانر — يظهر في تحليلات OxFile (`utm_medium`) */
  medium: string;
  /** نصّ الصفحة (عنوان، وسوم) لاختيار الأداة الأنسب */
  topic?: (string | undefined | null)[];
  tool?: BannerTool;
  className?: string;
}) {
  const t = tool ?? pickBannerTool(...(topic ?? []));
  return (
    <a
      href={oxfileUrl(t.path, medium)}
      target="_blank"
      rel="noopener"
      className={`group block rounded-2xl bg-ink text-white p-5 sm:p-6 hover:shadow-e3 transition-shadow ${className}`}
    >
      <span className="block text-micro font-semibold text-white/60 mb-2">من أدوات OxFile — موقع شقيق</span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <p className="font-extrabold text-h3 leading-snug">{t.headline}</p>
          <p className="text-white/75 text-body mt-1 leading-relaxed">{t.pitch}</p>
        </div>
        <span className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gold text-ink font-bold px-5 py-2.5 group-hover:bg-gold/90 transition-colors">
          افتح الأداة ↗
        </span>
      </div>
    </a>
  );
}
