"use client";

// ─── AudioPlayer ─────────────────────────────────────────────────────────────
// مشغّل صوت مدمج (تشغيل/إيقاف + شريط تقدّم/بحث + المدّة) لرسائل الصوت — RTL،
// بألوان متكيّفة (رسالتي: أبيض على أخضر / الوارد: أخضر على رمادي). يعتمد على
// عنصر <audio> مخفي مع تحكّم مخصّص. المدّة تُؤخذ من `durationMs` إن توفّرت
// (مقاطع webm من MediaRecorder قد تُبلغ مدّة Infinity قبل البحث).

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@solar-icons/react";
import { formatClock } from "@/lib/chatAttachments";

interface AudioPlayerProps {
  src: string;
  durationMs?: number | null;
  mine: boolean;
}

export function AudioPlayer({ src, durationMs, mine }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationMs != null ? durationMs / 1000 : 0);

  // ألوان متكيّفة مع جهة الرسالة.
  const accent = mine ? "text-white" : "text-primary";
  const track = mine ? "bg-white/30" : "bg-primary/20";
  const fill = mine ? "bg-white" : "bg-primary";
  const btn = mine ? "bg-white/20 hover:bg-white/30 text-white" : "bg-primary/10 hover:bg-primary/20 text-primary";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrent(t);
  };

  const max = duration > 0 ? duration : 0;
  const pct = max > 0 ? (current / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[190px] max-w-[260px]" dir="rtl">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
        className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${btn}`}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="relative h-1.5 flex items-center">
          <div className={`absolute inset-0 rounded-full ${track}`} />
          <div className={`absolute inset-y-0 right-0 rounded-full ${fill}`} style={{ width: `${pct}%` }} />
          <input
            type="range"
            min={0}
            max={max || 0}
            step={0.1}
            value={Math.min(current, max || 0)}
            onChange={onSeek}
            aria-label="موضع التشغيل"
            className="absolute inset-0 w-full cursor-pointer opacity-0"
          />
        </div>
        <div className={`mt-1 text-[10px] tabular-nums ${accent} opacity-80`}>
          {formatClock(current)} / {formatClock(max)}
        </div>
      </div>
    </div>
  );
}
