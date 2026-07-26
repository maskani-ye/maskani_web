"use client";

// ─── MessageAttachments ──────────────────────────────────────────────────────
// يرسم مرفقات رسالة (صوت/صورة/فيديو/ملف) داخل الفقاعة. صورة → مصغّرة (نقر →
// عارض كامل)، فيديو → <video controls>، ملف → شريحة باسم/حجم/تنزيل، صوت →
// مشغّل مدمج. يعرض طبقة «قيد الرفع/فشل» فوق الصور/الفيديو أثناء الحالة المتفائلة.

import { useEffect, useState } from "react";
import { CloseCircle, DocumentText, DownloadMinimalistic, Gallery, Restart, VideoFramePlayHorizontal } from "@solar-icons/react";
import type { Attachment } from "@/types";
import { fileNameFromUrl, formatBytes } from "@/lib/chatAttachments";
import { AudioPlayer } from "./AudioPlayer";

interface MessageAttachmentsProps {
  attachments: Attachment[];
  mine: boolean;
}

export function MessageAttachments({ attachments, mine }: MessageAttachmentsProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1.5">
      {attachments.map((a, i) => (
        <AttachmentItem key={a.id ?? i} attachment={a} mine={mine} onOpenImage={setLightbox} />
      ))}
      {lightbox && <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function AttachmentItem({
  attachment,
  mine,
  onOpenImage,
}: {
  attachment: Attachment;
  mine: boolean;
  onOpenImage: (url: string) => void;
}) {
  const uploading = attachment.status === "uploading";
  const failed = attachment.status === "failed";

  if (attachment.type === "audio") {
    if (uploading || failed || !attachment.url) {
      return <AudioPlaceholder mine={mine} failed={failed} />;
    }
    return <AudioPlayer src={attachment.url} durationMs={attachment.duration_ms} mine={mine} />;
  }

  if (attachment.type === "image") {
    const preview = attachment.local_url || attachment.thumbnail_url || attachment.url;
    return (
      <StatusOverlay uploading={uploading} failed={failed}>
        <button
          type="button"
          onClick={attachment.url ? () => onOpenImage(attachment.url) : undefined}
          className="block overflow-hidden rounded-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="صورة مرفقة"
            className="max-h-56 w-auto max-w-full object-cover"
          />
        </button>
      </StatusOverlay>
    );
  }

  if (attachment.type === "video") {
    const poster = attachment.thumbnail_url || undefined;
    return (
      <StatusOverlay uploading={uploading} failed={failed}>
        {attachment.url ? (
          <video
            src={attachment.url}
            poster={poster}
            controls
            playsInline
            className="max-h-56 w-auto max-w-full rounded-xl bg-black"
          />
        ) : (
          <div className="flex h-40 w-56 items-center justify-center rounded-xl bg-black/60">
            <VideoFramePlayHorizontal className="h-10 w-10 text-white/70" />
          </div>
        )}
      </StatusOverlay>
    );
  }

  // ملف عام
  return <FileChip attachment={attachment} mine={mine} uploading={uploading} failed={failed} />;
}

// ── مشغّل صوت نائب (أثناء الرفع/الفشل) ────────────────────────────────────────
function AudioPlaceholder({ mine, failed }: { mine: boolean; failed: boolean }) {
  const base = mine ? "bg-white/15 text-white" : "bg-primary/10 text-primary";
  return (
    <div className={`flex min-w-[190px] items-center gap-2 rounded-xl px-3 py-2 text-xs ${base}`} dir="rtl">
      {failed ? (
        <span className={mine ? "text-white/80" : "text-red-600"}>تعذّر رفع المقطع</span>
      ) : (
        <>
          <Restart className="h-4 w-4 animate-spin" />
          <span className="opacity-80">جارٍ الرفع…</span>
        </>
      )}
    </div>
  );
}

// ── شريحة ملف ─────────────────────────────────────────────────────────────────
function FileChip({
  attachment,
  mine,
  uploading,
  failed,
}: {
  attachment: Attachment;
  mine: boolean;
  uploading: boolean;
  failed: boolean;
}) {
  const name = fileNameFromUrl(attachment.url) || "ملف";
  const size = formatBytes(attachment.size_bytes);
  const wrap = mine ? "bg-white/15" : "bg-primary/10";
  const text = mine ? "text-white" : "text-gray-800";
  const sub = mine ? "text-white/70" : "text-gray-500";
  const icon = mine ? "text-white" : "text-primary";

  const content = (
    <div className={`flex min-w-[180px] max-w-[240px] items-center gap-2.5 rounded-xl p-2.5 ${wrap}`} dir="rtl">
      <DocumentText className={`h-6 w-6 shrink-0 ${icon}`} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-medium ${text}`}>{name}</p>
        {(size || uploading || failed) && (
          <p className={`text-[10px] ${failed ? (mine ? "text-white/80" : "text-red-600") : sub}`}>
            {failed ? "تعذّر الرفع" : uploading ? "جارٍ الرفع…" : size}
          </p>
        )}
      </div>
      {uploading ? (
        <Restart className={`h-4 w-4 shrink-0 animate-spin ${icon}`} />
      ) : (
        !failed && attachment.url && <DownloadMinimalistic className={`h-4 w-4 shrink-0 ${icon}`} />
      )}
    </div>
  );

  if (!attachment.url || uploading) return content;
  return (
    <a href={attachment.url} target="_blank" rel="noopener noreferrer" download className="block">
      {content}
    </a>
  );
}

// ── طبقة الحالة (رفع/فشل) فوق الصور والفيديو ──────────────────────────────────
function StatusOverlay({
  uploading,
  failed,
  children,
}: {
  uploading: boolean;
  failed: boolean;
  children: React.ReactNode;
}) {
  if (!uploading && !failed) return <>{children}</>;
  return (
    <div className="relative w-fit">
      {children}
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45">
        {failed ? (
          <span className="text-xs text-white">تعذّر رفع المرفق</span>
        ) : (
          <Restart className="h-6 w-6 animate-spin text-white" />
        )}
      </div>
    </div>
  );
}

// ── عارض صورة كامل (Lightbox) ─────────────────────────────────────────────────
function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
      >
        <CloseCircle className="h-6 w-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="صورة" className="max-h-[90vh] max-w-full object-contain" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white"
      >
        <Gallery className="h-4 w-4" /> فتح / تنزيل
      </a>
    </div>
  );
}
