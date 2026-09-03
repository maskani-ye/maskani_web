"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { Bell, CheckCircle } from "@solar-icons/react";

const PREF_CATEGORIES: { key: string; label: string }[] = [
  { key: "messages", label: "الرسائل" },
  { key: "offers", label: "العروض" },
  { key: "social", label: "التفاعل الاجتماعي" },
  { key: "properties", label: "العقارات" },
  { key: "reports", label: "البلاغات" },
  { key: "verification", label: "التوثيق" },
  { key: "system", label: "إشعارات النظام" },
];

/** يشتقّ وجهة الإشعار من نوعه + بياناته (يحاكي notification_router في الفلاتر).
 *  ملاحظة: طلبات الخدمات (jobs/service_request_id) بلا صفحة ويب → يسقط للاحتياطي. */
function routeForNotification(n: Notification): string | null {
  const d = n.data || {};
  const pick = (...keys: string[]) => keys.map((k) => d[k]).find(Boolean) ?? null;
  const conv = pick("conversation_id", "conversation");
  const property = pick("property_id", "property");
  const job = pick("service_request_id");
  const request = pick("request_id", "request");
  const report = pick("report_id", "fraud_report_id", "report");
  const user = pick("user_id", "user", "follower_id", "rater_id");
  switch (n.notification_type) {
    case "new_message": if (conv) return `/chat/${conv}`; break;
    case "new_property":
    case "new_comment":
    case "property_interest": if (property) return `/properties/${property}`; break;
    // مطابقة عكسية: الوجهة صفحة العقار حيث يظهر قسم «طلبات تطابق عقارك».
    case "demand_match":
    case "property_expiring": if (property) return `/properties/${property}`; break;
    case "new_service_request": if (job) return `/jobs/${job}`; break;
    case "new_offer":
    case "request_offer":
    case "offer_accepted":
      if (job) return `/jobs/${job}`;
      if (request) return `/requests/${request}`;
      break;
    case "report_updated":
    case "fraud_report_update": if (report) return `/reports/${report}`; break;
    case "new_follower":
    case "new_rating": if (user) return `/users/${user}`; break;
    case "verification_approved":
    case "verification_rejected": return "/profile";
  }
  if (conv) return `/chat/${conv}`;
  if (property) return `/properties/${property}`;
  if (job) return `/jobs/${job}`;
  if (request) return `/requests/${request}`;
  if (report) return `/reports/${report}`;
  if (user) return `/users/${user}`;
  return null;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean> | null>(null);
  const LIMIT = 20;

  const openPrefs = async () => {
    setPrefsOpen(true);
    if (prefs) return;
    try {
      const { data } = await api.get<Record<string, boolean>>("/notifications/preferences/");
      setPrefs(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const togglePref = async (key: string) => {
    if (!prefs) return;
    const next = !prefs[key];
    setPrefs((p) => (p ? { ...p, [key]: next } : p));
    try {
      await api.put("/notifications/preferences/", { [key]: next });
    } catch (err) {
      setPrefs((p) => (p ? { ...p, [key]: !next } : p));
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!authLoading && !user) requireAuth(undefined, () => router.push("/"));
  }, [user, authLoading, router]);

  const fetchNotifications = async (off = 0) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Notification>>("/notifications/", {
        params: { offset: off, limit: LIMIT },
      });
      setNotifications(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authLoading && user) fetchNotifications(0);
  }, [authLoading, user]);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/mark-read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("تم تعليم الكل كمقروء");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const markRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/mark-read/`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <PageHeader icon={<Bell />} title="الإشعارات"
          subtitle={unread > 0 ? `${unread} غير مقروء` : undefined}
          actions={<>
            {unread > 0 && (
              <Button onClick={markAllRead} variant="outline" size="sm">
                <CheckCircle className="h-4 w-4" /> تعليم الكل مقروء
              </Button>
            )}
            <Button onClick={openPrefs} variant="ghost" size="sm">التفضيلات</Button>
          </>} />
      </div>

      {prefsOpen && (
        <div className="bg-white rounded-2xl card-shadow p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-ink">تفضيلات الإشعارات</h2>
            <button onClick={() => setPrefsOpen(false)} className="text-body text-muted hover:text-muted-600">إغلاق</button>
          </div>
          <p className="text-caption text-muted-500 mb-3">تحكّم بأنواع الإشعارات التي تصلك (الكتم يوقف إشعار الدفع فقط، ويبقى الإشعار داخل التطبيق).</p>
          {prefs === null ? (
            <div className="h-40 bg-muted-100 animate-pulse rounded-xl" />
          ) : (
            <div className="divide-y divide-muted-50">
              {PREF_CATEGORIES.map((c) => (
                <div key={c.key} className="flex items-center justify-between py-2.5">
                  <span className="text-body text-muted-700">{c.label}</span>
                  <button
                    type="button"
                    onClick={() => togglePref(c.key)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${prefs[c.key] ? "bg-primary" : "bg-muted-200"}`}
                    aria-pressed={prefs[c.key]}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs[c.key] ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Bell className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-body">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-muted-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  const route = routeForNotification(n);
                  if (route) router.push(route);
                }}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-muted-50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-muted-200" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-body font-medium text-ink ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                  <p className="text-body text-muted-600 mt-0.5">{n.body}</p>
                  <p className="text-caption text-muted mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-muted-100">
            <span className="text-caption text-muted-500">{offset + 1}–{Math.min(offset + LIMIT, total)} من {total}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => fetchNotifications(offset - LIMIT)}>السابق</Button>
              <Button size="sm" variant="outline" disabled={offset + LIMIT >= total} onClick={() => fetchNotifications(offset + LIMIT)}>التالي</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
