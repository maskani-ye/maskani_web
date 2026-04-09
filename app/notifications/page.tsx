"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Bell, CheckCircle } from "@solar-icons/react";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">الإشعارات</h1>
            {unread > 0 && <p className="text-xs text-primary font-medium">{unread} غير مقروء</p>}
          </div>
        </div>
        {unread > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm">
            <CheckCircle className="h-4 w-4" /> تعليم الكل مقروء
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-gray-200" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-gray-900 ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, total)} من {total}</span>
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
