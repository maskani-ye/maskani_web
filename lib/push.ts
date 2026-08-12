// تسجيل جهاز الويب لاستقبال إشعارات FCM + التعامل مع رسائل المقدّمة (foreground).
// يعكس نمط فلاتر/Abber: بعد نجاح المصادقة (وعند إقلاع مستخدم مُسجَّل) نطلب الإذن،
// نجلب توكن FCM، ونسجّل الجهاز في الخادم بمعلومات جهاز غنية (نفس مفاتيح الـ19
// في shared_utils DeviceInfoManager.toFlatMap)، ثم نُحدّث توكن FCM.
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { api } from "./api";
import { getMessagingIfSupported, VAPID_KEY } from "./firebase";

const DEVICE_UID_KEY = "maskani_device_uid";

/// معرّف جهاز دائم يدوم عبر الجلسات (مقابل DeviceInfoManager.persistentId).
function getPersistentId(): string {
  let id = localStorage.getItem(DEVICE_UID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_UID_KEY, id);
  }
  return id;
}

/// اسم المتصفّح + نظام التشغيل من userAgent (أفضل تقدير للويب).
function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Web";
}

function detectOsName(ua: string): string {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/(iPhone|iPad|iPod)/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Web";
}

/// نفس مفاتيح الـ19 التي يرسلها تطبيق فلاتر (toFlatMap) — بأفضل مقابلات المتصفّح.
function buildDeviceInfo(persistentId: string): Record<string, string> {
  const nav = window.navigator;
  const ua = nav.userAgent;
  const browser = detectBrowser(ua);
  const osName = detectOsName(ua);
  return {
    persistent_id: persistentId,
    app_version: "1.0.0",
    app_build: "1",
    app_full_version: "1.0.0+1",
    app_package: "com.maskani.web",
    device_id: persistentId,
    device_brand: browser,
    device_model: browser,
    device_name: `${browser} on ${osName}`,
    device_type: "web",
    device_is_physical: "true",
    os_name: osName,
    os_version: nav.appVersion || "",
    platform: "web",
    locale: nav.language || "ar",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen_width: String(window.screen?.width ?? 0),
    screen_height: String(window.screen?.height ?? 0),
    screen_pixel_ratio: String(window.devicePixelRatio ?? 1),
  };
}

let _foregroundBound = false;

/// يطلب الإذن، يجلب توكن FCM، ويسجّل الجهاز في الخادم. آمن عند غياب الدعم/المفتاح.
export async function registerDeviceForPush(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const messaging = await getMessagingIfSupported();
    if (!messaging) return;

    if (!VAPID_KEY) {
      // بلا مفتاح VAPID لا يمكن جلب توكن الويب — نتخطّى بصمت (بوابة بشرية).
      console.warn("[push] NEXT_PUBLIC_FIREBASE_VAPID_KEY غير مضبوط — تخطّي تسجيل الإشعارات");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const swReg = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (!fcmToken) return;

    const persistentId = getPersistentId();
    await api.post("/notifications/devices/register/", {
      registration_id: fcmToken,
      platform: "web",
      device_uid: persistentId,
      device_info: buildDeviceInfo(persistentId),
    });

    // مثل registerDeviceInfo في فلاتر: نُحدّث توكن FCM على الحساب أيضاً.
    try {
      await api.post("/auth/fcm-token/", { fcm_token: fcmToken });
    } catch {
      // فشل تحديث التوكن يجب ألّا يُعطّل تدفّق الدخول.
    }

    bindForegroundMessages();
  } catch (e) {
    // التسجيل best-effort — لا يجب أن يكسر المصادقة أو الإقلاع.
    console.warn("[push] فشل تسجيل الجهاز:", e);
  }
}

/// رسائل المقدّمة (التطبيق مفتوح) → إشعار toast مع توجيه عند النقر.
async function bindForegroundMessages(): Promise<void> {
  if (_foregroundBound) return;
  const messaging = await getMessagingIfSupported();
  if (!messaging) return;
  _foregroundBound = true;

  onMessage(messaging, (payload) => {
    const data = (payload.data ?? {}) as Record<string, string>;
    const title = payload.notification?.title ?? data.title ?? "مسكني";
    const body = payload.notification?.body ?? data.body ?? "";
    const url = routeForData(data);

    toast(title, {
      description: body,
      action: url
        ? { label: "عرض", onClick: () => (window.location.href = url) }
        : undefined,
    });
  });
}

/// يطابق منطق راوتر الإشعارات في فلاتر (type + معرّف الكيان) → مسار ويب.
export function routeForData(data: Record<string, string>): string | null {
  const url = data.url;
  if (url && url !== "#" && url.startsWith("/")) return url;

  const type = data.type ?? "";
  const id = (...keys: string[]): string | undefined => {
    for (const k of keys) if (data[k]) return data[k];
    return undefined;
  };

  switch (type) {
    case "new_message": {
      const c = id("conversation_id", "conversation");
      return c ? `/chat/${c}` : "/chat";
    }
    case "new_property":
    case "new_comment":
    case "property_interest":
    case "demand_match":
    case "property_expiring": {
      const l = id("property_id", "property");
      return l ? `/properties/${l}` : "/properties";
    }
    case "new_offer":
    case "request_offer":
    case "offer_accepted": {
      const r = id("request_id", "request", "service_request_id");
      return r ? `/requests/${r}` : "/requests";
    }
    case "report_updated":
    case "fraud_report_update": {
      const rep = id("report_id", "fraud_report_id", "report");
      return rep ? `/reports/${rep}` : "/reports";
    }
    case "new_follower":
    case "new_rating": {
      const u = id("user_id", "user", "follower_id", "rater_id");
      return u ? `/users/${u}` : "/notifications";
    }
    case "verification_approved":
    case "verification_rejected":
      return "/profile";
    default:
      return "/notifications";
  }
}
