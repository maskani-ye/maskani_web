"use client";

import { useEffect, useRef } from "react";
import { campaignClickUrl, campaignImpressionUrl, type Campaign } from "@/lib/campaigns";

// بطاقة إعلان مسكني — ليست وحدة AdSense ولا تقلّدها.
// ⚠️ الوسم ظاهرٌ دائماً («إعلان» أو ما يكتبه المشرف): إعلانٌ بلا تسمية يخدع القارئ.
// الظهور يُعدّ مرّةً واحدة حين يُرى نصف البطاقة — لا عند جلبها في الخادم.
export function CampaignCard({
  campaign: c,
  className = "",
  preview = false,
}: {
  campaign: Campaign;
  className?: string;
  /** معاينة اللوحة: لا تعدّ ظهوراً ولا تفتح الرابط عبر العدّاد */
  preview?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (preview || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          fetch(campaignImpressionUrl(c.id), { method: "POST", keepalive: true }).catch(() => {});
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [c.id, preview]);

  return (
    <a
      ref={ref}
      href={preview ? c.target_url || undefined : campaignClickUrl(c.id)}
      target="_blank"
      rel="sponsored noopener"
      className={`group block rounded-2xl bg-ink text-white p-5 sm:p-6 hover:shadow-e3 transition-shadow ${className}`}
    >
      <span className="block text-micro font-semibold text-white/60 mb-2">{c.label || "إعلان"}</span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {c.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt="" width={80} height={80} loading="lazy"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-white/10" />
          )}
          <div className="min-w-0">
            <p className="font-extrabold text-h3 leading-snug">{c.headline}</p>
            {c.body && <p className="text-white/75 text-body mt-1 leading-relaxed">{c.body}</p>}
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gold text-ink font-bold px-5 py-2.5 group-hover:bg-gold/90 transition-colors">
          {c.cta_label || "اعرف أكثر"} ↗
        </span>
      </div>
    </a>
  );
}
