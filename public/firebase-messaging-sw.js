/* eslint-disable no-undef */
// Service Worker لإشعارات FCM على الويب (خلفية + نقر). يعمل خارج نطاق حزمة
// Next، لذا يُهيّئ Firebase عبر compat SDK ويُضمّن config العام (نفس مشروع
// maskani-d808a). لا يحتاج مفتاح VAPID هنا (يُستخدم فقط عند getToken في العميل).
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCS_uvUhFln6R_S3OfN3V3WAQ3OVN1uIeg",
  authDomain: "maskani-d808a.firebaseapp.com",
  projectId: "maskani-d808a",
  storageBucket: "maskani-d808a.firebasestorage.app",
  messagingSenderId: "949638322663",
  appId: "1:949638322663:web:3849afb86795ec47620542",
});

const messaging = firebase.messaging();

// يطابق منطق راوتر الإشعارات في فلاتر (type + معرّف الكيان) → مسار ويب.
function routeForData(data) {
  data = data || {};
  const url = data.url;
  if (url && url !== "#" && url.indexOf("/") === 0) return url;

  const pick = (...keys) => {
    for (const k of keys) if (data[k]) return data[k];
    return undefined;
  };

  switch (data.type) {
    case "new_message": {
      const c = pick("conversation_id", "conversation");
      return c ? "/chat/" + c : "/chat";
    }
    case "new_property":
    case "new_comment":
    case "property_interest": {
      const l = pick("property_id", "property");
      return l ? "/properties/" + l : "/properties";
    }
    case "new_offer":
    case "request_offer":
    case "offer_accepted": {
      const r = pick("request_id", "request", "service_request_id");
      return r ? "/requests/" + r : "/requests";
    }
    case "report_updated":
    case "fraud_report_update": {
      const rep = pick("report_id", "fraud_report_id", "report");
      return rep ? "/reports/" + rep : "/reports";
    }
    case "new_follower":
    case "new_rating": {
      const u = pick("user_id", "user", "follower_id", "rater_id");
      return u ? "/users/" + u : "/notifications";
    }
    case "verification_approved":
    case "verification_rejected":
      return "/profile";
    default:
      return "/notifications";
  }
}

// رسائل الخلفية (data-only) → إظهار إشعار نظام.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title =
    (payload.notification && payload.notification.title) || data.title || "مسكني";
  const body =
    (payload.notification && payload.notification.body) || data.body || "";

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    dir: "rtl",
    lang: "ar",
    data: { url: routeForData(data) },
  });
});

// النقر على الإشعار → فتح/تركيز المسار المناسب.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(target);
      }),
  );
});
