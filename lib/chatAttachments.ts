import { api } from "@/lib/api";
import type { Attachment, AttachmentType, AttachmentUploadResult } from "@/types";

// ─── أدوات مساعدة لمرفقات الدردشة (كشف النوع، الرفع، حمولة السوكِت، التنسيق) ──
// نظير `messaging_remote_data_source`/`messaging_models` في عميل فلاتر — نفس العقد.

/** يستنتج نوع المرفق من نوع MIME للملف. */
export function detectAttachmentType(file: File): AttachmentType {
  const mime = file.type || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

/** أبعاد صورة من ملف (لتمريرها مع الرفع) — يتجاهل الفشل بهدوء. */
export function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims.width && dims.height ? dims : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export interface UploadMeta {
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
}

/**
 * يرفع مرفقاً عبر REST (multipart) لمحادثة، ويرجّع upload_token + بيانات الملف.
 * ترويسة JWT تُضاف تلقائياً عبر معترِض `lib/api.ts`.
 */
export async function uploadAttachment(
  conversationId: number | string,
  file: File,
  type: AttachmentType,
  meta: UploadMeta = {},
): Promise<AttachmentUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  if (meta.durationMs != null) form.append("duration_ms", String(Math.round(meta.durationMs)));
  if (meta.width != null) form.append("width", String(meta.width));
  if (meta.height != null) form.append("height", String(meta.height));

  const res = await api.post<AttachmentUploadResult>(
    `/chat/conversations/${conversationId}/upload/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

/** يبني حمولة المرفق داخل رسالة السوكِت (`attachments[]`) من نتيجة الرفع. */
export function uploadToSocketAttachment(upload: AttachmentUploadResult): Record<string, unknown> {
  return {
    type: upload.type,
    upload_token: upload.upload_token,
    ...(upload.mime_type != null && { mime_type: upload.mime_type }),
    ...(upload.size_bytes != null && { size_bytes: upload.size_bytes }),
    ...(upload.width != null && { width: upload.width }),
    ...(upload.height != null && { height: upload.height }),
    ...(upload.duration_ms != null && { duration_ms: upload.duration_ms }),
  };
}

/** يطبّع مرفقاً قادماً من السوكِت/REST إلى نوع `Attachment`. */
export function normalizeAttachment(raw: Record<string, unknown>): Attachment {
  const rawType = String(raw.type ?? "file");
  const type: AttachmentType =
    rawType === "image" || rawType === "audio" || rawType === "video" ? rawType : "file";
  const num = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    id: num(raw.id) ?? -Date.now(),
    type,
    url: String(raw.url ?? ""),
    mime_type: raw.mime_type != null ? String(raw.mime_type) : null,
    size_bytes: num(raw.size_bytes),
    width: num(raw.width),
    height: num(raw.height),
    duration_ms: num(raw.duration_ms),
    thumbnail_url: raw.thumbnail_url != null ? String(raw.thumbnail_url) : null,
    status: (raw.status as Attachment["status"]) ?? "ready",
  };
}

// ─── التنسيق ───────────────────────────────────────────────────────────────

/** حجم بالبايت → نص مقروء (KB/MB). */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** مدة بالثواني → mm:ss. */
export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** اسم ملف من رابط (يزيل معاملات الاستعلام). */
export function fileNameFromUrl(url: string): string {
  if (!url) return "ملف";
  const clean = url.split("?")[0];
  const name = clean.split("/").pop() ?? "";
  try {
    return decodeURIComponent(name) || "ملف";
  } catch {
    return name || "ملف";
  }
}
