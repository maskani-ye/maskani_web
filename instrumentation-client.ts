// تهيئة Sentry في المتصفّح — تلتقط أخطاء الواجهة التي لا يراها الخادم.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production",
    tracesSampleRate: 0.1,
    // لا إعادة تشغيل للجلسات: تستهلك الحصّة المجانية بسرعة.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    /**
     * أخطاء سكربت جوجل للهوية (GSI) ليست أخطاءنا ولا نملك إصلاحها.
     *
     * `Error: oa` على Mobile Safari مثالها: سكربت مُصغَّر تابع لجوجل يفشل بسبب
     * قيود المتصفّح على الطرف الثالث. تركُها يُغرق الحصّة المجانية بضجيج خارجيّ
     * ويُخفي أخطاءنا الحقيقية بينه — وهي نفس علّة `DisallowedHost` في الخادم.
     * نُسقطها فقط حين تأتي **كل** إطاراتها من نطاق جوجل، فلا نُخفي خطأً لنا
     * مرّ عبر السكربت.
     */
    beforeSend(event) {
      const frames = event.exception?.values?.flatMap(
        (v) => v.stacktrace?.frames ?? []
      );
      if (frames?.length) {
        const external = /gsi\/client|accounts\.google\.com|gstatic\.com|googletagmanager|googlesyndication/;
        if (frames.every((f) => external.test(f.filename ?? ""))) return null;
      }
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
