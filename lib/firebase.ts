// تهيئة Firebase على الويب — يقتصر على العميل (المتصفح) فقط. القيم العامة
// (config) نفسها المستخدمة في تطبيق فلاتر (firebase_options.dart) للمشروع
// maskani-d808a؛ يمكن تجاوزها عبر متغيرات البيئة. مفتاح VAPID (شهادة Web Push)
// يجب توفيره في NEXT_PUBLIC_FIREBASE_VAPID_KEY وإلا تُعطّل الإشعارات بأمان.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyDhUsPS-ckJ-k6CbUcVpDzPFVJta_OiHTw",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "maskani-d808a.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "maskani-d808a",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "maskani-d808a.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "949638322663",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:949638322663:web:3849afb86795ec47620542",
};

/// مفتاح VAPID (Web Push certificate) — من كونسول Firebase → إعدادات المشروع →
/// Cloud Messaging → Web Push certificates → Generate key pair. بوابة بشرية.
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/// يُعيد Messaging إن كان المتصفح يدعمه (SW + Push API)، وإلا null.
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  try {
    if (!(await isSupported())) return null;
    return getMessaging(getFirebaseApp());
  } catch {
    return null;
  }
}
