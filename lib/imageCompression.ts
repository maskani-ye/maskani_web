import imageCompression from "browser-image-compression";

/**
 * يضغط صورة قبل رفعها للخادم مع التحكم بالجودة والأبعاد — يقلّل الحجم وزمن الرفع.
 * يتجاوز الملفات غير الصورية (PDF مثلاً) ويعيد الأصل عند أي فشل، فلا يكسر الرفع.
 */
export async function compressImage(
  file: File,
  opts?: { maxSizeMB?: number; maxWidthOrHeight?: number; quality?: number },
): Promise<File> {
  if (!file.type.startsWith("image/")) return file; // PDF وغيرها تمرّ كما هي
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: opts?.maxSizeMB ?? 1,
      maxWidthOrHeight: opts?.maxWidthOrHeight ?? 1280,
      initialQuality: opts?.quality ?? 0.72,
      useWebWorker: true,
    });
    // الحفاظ على الاسم الأصلي (المكتبة قد تُبدّله).
    return new File([compressed], file.name, {
      type: compressed.type,
      lastModified: Date.now(),
    });
  } catch {
    return file; // لا نكسر الرفع أبدًا بسبب فشل الضغط
  }
}

/** يضغط قائمة صور بالتوازي (يُبقي غير الصور كما هي). */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f)));
}
