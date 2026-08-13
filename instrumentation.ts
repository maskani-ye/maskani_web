// نقطة تهيئة Sentry على الخادم — Next يستدعيها قبل أي طلب.
// التهيئة صامتة تمامًا بلا NEXT_PUBLIC_SENTRY_DSN (كما في الباك اند).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? "production",
    // عيّنة أداء منخفضة — الصندوق المجاني محدود الأحداث.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export const onRequestError = Sentry.captureRequestError;
