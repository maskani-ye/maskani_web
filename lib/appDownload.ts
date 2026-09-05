// رابط تنزيل APK المباشر (مستضاف على Cloudflare R2، عام، يُحدَّث مع كل إصدار).
// يُقدَّم بترويسة Content-Disposition: attachment فيبدأ التنزيل فوراً بضغطة واحدة.
export const APK_URL =
  "https://pub-c0a05c2cecc548aaa3a943b5751cf25f.r2.dev/download/maskani.apk";

// نسخة التطبيق الحالية (للعرض بجانب زرّ التحميل). حدّثها مع كل رفع APK جديد.
export const APK_VERSION = "1.0.61+62";

// متجر هواوي (AppGallery) — التطبيق مُراجَع ومنشور فعلياً.
// ملاحظة مراجعة هواوي الحرفية: «التطبيق لم يدمج HMS ولا يعمل على أجهزة HMS»،
// أي أنه يعمل على أجهزة هواوي التي تحمل خدمات جوجل فقط. نضع الرابط كما هو
// لأنه منشور، ومن لا تعمل عنده يبقى أمامه التنزيل المباشر.
export const APPGALLERY_URL = "https://appgallery.huawei.com/app/C118696899";
