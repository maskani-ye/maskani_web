"use client";

// ─── مشغّل يوتيوب ───────────────────────────────────────────────────────────
// نمط الواجهة المؤجّلة (facade): نعرض صورة الفيديو مع زرّ تشغيل، ولا نُحمّل
// iframe يوتيوب إلّا عند النقر. تضمين المشغّل مباشرةً يجلب ~1.5 م.ب من سكربتات
// وكوكيز طرف ثالث في كل صفحة عقار — يقتل زمن التحميل ومؤشّرات Core Web Vitals
// التي تدخل ترتيب البحث. نستعمل نطاق nocookie فلا يُتتبَّع الزائر قبل التشغيل.

import { useState } from "react";
import { Play } from "@solar-icons/react";

/** معرّف الفيديو من أي صيغة رابط يوتيوب — يطابق منطق الخادم (core/video.py). */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?[^ ]*\bv=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function YouTubePlayer({
  url,
  title = "فيديو",
  className = "",
}: {
  url?: string | null;
  title?: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(url);
  if (!id) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-black aspect-video ${className}`}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`تشغيل ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* الصورة من يوتيوب مباشرةً — لا تُحمَّل عبر مُحسِّن الصور لأنها
              خارجية ومتغيّرة، وحجمها صغير أصلاً. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-black/60 text-white transition-transform group-hover:scale-110">
              <Play className="h-7 w-7" weight="Bold" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
