import { afterEach, describe, expect, it, vi } from "vitest";

const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: { post } }));

import {
  detectAttachmentType,
  fileNameFromUrl,
  formatBytes,
  formatClock,
  normalizeAttachment,
  readImageDimensions,
  uploadAttachment,
  uploadToSocketAttachment,
} from "@/lib/chatAttachments";

const file = (type: string, name = "f") => new File(["x"], name, { type });

afterEach(() => {
  vi.useRealTimers();
});

describe("detectAttachmentType", () => {
  it("يستنتج النوع من بادئة MIME", () => {
    expect(detectAttachmentType(file("image/webp"))).toBe("image");
    expect(detectAttachmentType(file("video/mp4"))).toBe("video");
    expect(detectAttachmentType(file("audio/webm;codecs=opus"))).toBe("audio");
  });

  it("المجهول والفارغ ملفٌّ عامّ", () => {
    expect(detectAttachmentType(file("application/pdf"))).toBe("file");
    expect(detectAttachmentType(file(""))).toBe("file");
  });
});

describe("readImageDimensions", () => {
  it("خارج المتصفّح أو لغير الصور null بلا رمي", async () => {
    expect(await readImageDimensions(file("image/png"))).toBeNull();
    expect(await readImageDimensions(file("text/plain"))).toBeNull();
  });
});

describe("uploadAttachment", () => {
  it("يرفع multipart إلى مسار المحادثة بالبيانات المتوفّرة وحدها", async () => {
    post.mockResolvedValueOnce({ data: { upload_token: "t", type: "audio", url: "u" } });
    const f = file("audio/webm");
    const out = await uploadAttachment(7, f, "audio", { durationMs: 1234.6, width: null });
    expect(out).toEqual({ upload_token: "t", type: "audio", url: "u" });

    const [path, form, cfg] = post.mock.calls[0];
    expect(path).toBe("/chat/conversations/7/upload/");
    expect(cfg).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    const fd = form as FormData;
    expect(fd.get("type")).toBe("audio");
    expect(fd.get("duration_ms")).toBe("1235");
    expect(fd.has("width")).toBe(false);
    expect(fd.has("height")).toBe(false);
    expect((fd.get("file") as File).type).toBe("audio/webm");
  });

  it("الصفر قيمةٌ تُرسَل لا غياب", async () => {
    post.mockResolvedValueOnce({ data: {} });
    await uploadAttachment("9", file("image/png"), "image", { width: 0, height: 0, durationMs: 0 });
    const fd = post.mock.calls[0][1] as FormData;
    expect([fd.get("width"), fd.get("height"), fd.get("duration_ms")]).toEqual(["0", "0", "0"]);
  });
});

describe("uploadToSocketAttachment", () => {
  it("يحمل النوع والتوكن ويحذف الغائب ويُبقي الصفر، بلا رابط", () => {
    expect(
      uploadToSocketAttachment({
        upload_token: "tok",
        type: "image",
        url: "https://r2/x.webp",
        mime_type: null,
        size_bytes: 0,
        width: 640,
        height: undefined,
      }),
    ).toEqual({ type: "image", upload_token: "tok", size_bytes: 0, width: 640 });
  });
});

describe("normalizeAttachment", () => {
  it("يحوّل الأرقام النصّية ويُسقط غير الصالح إلى null", () => {
    const a = normalizeAttachment({
      id: "12", type: "video", url: "u", size_bytes: "2048", width: "abc", duration_ms: 5000,
    });
    expect(a).toMatchObject({ id: 12, type: "video", size_bytes: 2048, width: null, height: null, duration_ms: 5000 });
  });

  it("النوع المجهول ملفّ، والحالة الافتراضية جاهز، والنصوص الغائبة null", () => {
    const a = normalizeAttachment({ id: 1, type: "sticker" });
    expect(a).toMatchObject({ type: "file", url: "", mime_type: null, thumbnail_url: null, status: "ready" });
  });

  it("بلا معرّف يأخذ معرّفاً مؤقّتاً سالباً لا يصطدم بمعرّفات الخادم", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);
    expect(normalizeAttachment({ type: "image" }).id).toBe(-1_700_000_000_000);
    expect(normalizeAttachment({ id: "x" }).id).toBe(-1_700_000_000_000);
  });
});

describe("formatBytes", () => {
  it("الصفر والسالب والغائب نصٌّ فارغ", () => {
    for (const v of [0, -5, null, undefined]) expect(formatBytes(v)).toBe("");
  });

  it("منزلة عشرية دون العشرة وبلا كسور فوقها", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10 * 1024)).toBe("10 KB");
    expect(formatBytes(5 * 1024 ** 2)).toBe("5.0 MB");
  });

  it("لا يتجاوز GB", () => {
    expect(formatBytes(2048 * 1024 ** 3)).toBe("2048 GB");
  });
});

describe("formatClock", () => {
  it("دقائق:ثوانٍ بخانتين", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(59.9)).toBe("0:59");
    expect(formatClock(3600)).toBe("60:00");
  });

  it("القيم غير الصالحة صفر", () => {
    for (const v of [-3, Number.NaN, Infinity]) expect(formatClock(v)).toBe("0:00");
  });
});

describe("fileNameFromUrl", () => {
  it("يزيل الاستعلام ويفكّ الترميز", () => {
    expect(fileNameFromUrl("https://r2/chat/%D8%B9%D9%82%D8%AF.pdf?X-Amz=1")).toBe("عقد.pdf");
  });

  it("الفارغ والمنتهي بشرطة «ملف»، والترميز المعطوب يُعاد خاماً", () => {
    expect(fileNameFromUrl("")).toBe("ملف");
    expect(fileNameFromUrl("https://r2/chat/")).toBe("ملف");
    expect(fileNameFromUrl("https://r2/a%E0%A4%A.pdf")).toBe("a%E0%A4%A.pdf");
  });
});
