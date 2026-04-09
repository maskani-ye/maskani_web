"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Users, Building2, ShieldAlert, MessageSquarePlus,
  Eye, TrendingUp, Bell, CheckCircle2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface Stats {
  users_count: number;
  listings_count: number;
  fraud_reports_count: number;
  pending_reports_count: number;
  requests_count: number;
  services_count: number;
}

const COLORS = ["#2D6A4F", "#D4A017", "#EF4444", "#3B82F6"];

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [broadcast, setBroadcast] = useState({ title: "", body: "", role: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
      return;
    }
    // نبني stats من API calls متعددة
    Promise.all([
      api.get("/auth/users/?page_size=1").catch(() => ({ data: { count: 0 } })),
      api.get("/listings/?page_size=1").catch(() => ({ data: { count: 0 } })),
      api.get("/fraud-reports/?page_size=1").catch(() => ({ data: { count: 0 } })),
      api.get("/fraud-reports/?status=pending&page_size=1").catch(() => ({ data: { count: 0 } })),
      api.get("/requests/?page_size=1").catch(() => ({ data: { count: 0 } })),
      api.get("/services/?page_size=1").catch(() => ({ data: { count: 0 } })),
    ]).then(([users, listings, fraud, pendingFraud, requests, services]) => {
      setStats({
        users_count: users.data.count,
        listings_count: listings.data.count,
        fraud_reports_count: fraud.data.count,
        pending_reports_count: pendingFraud.data.count,
        requests_count: requests.data.count,
        services_count: services.data.count,
      });
    });
  }, [user, authLoading, router]);

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.body) { toast.error("العنوان والمحتوى مطلوبان"); return; }
    setSending(true);
    try {
      await api.post("/notifications/broadcast/", broadcast);
      toast.success("تم إرسال الإشعار بنجاح");
      setBroadcast({ title: "", body: "", role: "" });
    } catch { toast.error("فشل إرسال الإشعار"); }
    finally { setSending(false); }
  };

  if (!stats) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl card-shadow p-5 h-28 animate-pulse" />
        ))}
      </div>
    </div>
  );

  const statCards = [
    { label: "إجمالي المستخدمين", value: stats.users_count, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "إجمالي الإعلانات", value: stats.listings_count, icon: Building2, color: "bg-gold/10 text-gold" },
    { label: "بلاغات الاحتيال", value: stats.fraud_reports_count, icon: ShieldAlert, color: "bg-red-100 text-red-600" },
    { label: "بلاغات قيد المراجعة", value: stats.pending_reports_count, icon: Eye, color: "bg-yellow-100 text-yellow-600" },
    { label: "طلبات العملاء", value: stats.requests_count, icon: MessageSquarePlus, color: "bg-blue-100 text-blue-600" },
    { label: "مزودو الخدمة", value: stats.services_count, icon: TrendingUp, color: "bg-purple-100 text-purple-600" },
  ];

  const pieData = [
    { name: "مستخدمون", value: stats.users_count },
    { name: "إعلانات", value: stats.listings_count },
    { name: "طلبات", value: stats.requests_count },
    { name: "بلاغات", value: stats.fraud_reports_count },
  ];

  const barData = [
    { name: "مستخدمون", value: stats.users_count },
    { name: "إعلانات", value: stats.listings_count },
    { name: "طلبات", value: stats.requests_count },
    { name: "بلاغات", value: stats.fraud_reports_count },
    { name: "خدمات", value: stats.services_count },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
          <p className="text-gray-500 text-sm mt-1">مرحباً {user?.full_name} 👋</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl card-shadow p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value.toLocaleString("ar")}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">إحصاءات عامة</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontFamily: "Cairo", fontSize: 12 }} />
              <YAxis tick={{ fontFamily: "Cairo", fontSize: 12 }} />
              <Tooltip contentStyle={{ fontFamily: "Cairo" }} />
              <Bar dataKey="value" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">توزيع البيانات</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: "#ccc" }}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "Cairo" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Reports */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            إدارة البلاغات
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            يوجد <span className="font-bold text-red-600">{stats.pending_reports_count}</span> بلاغ قيد المراجعة
          </p>
          <Button onClick={() => router.push("/admin/reports")} variant="outline" fullWidth>
            مراجعة البلاغات
          </Button>
        </div>

        {/* Broadcast Notification */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            إشعار جماعي
          </h3>
          <div className="space-y-3">
            <input
              placeholder="عنوان الإشعار"
              value={broadcast.title}
              onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))}
              className="w-full h-10 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              placeholder="محتوى الإشعار"
              value={broadcast.body}
              onChange={(e) => setBroadcast((p) => ({ ...p, body: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <select
              value={broadcast.role}
              onChange={(e) => setBroadcast((p) => ({ ...p, role: e.target.value }))}
              className="w-full h-10 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none"
            >
              <option value="">الكل</option>
              <option value="owner">الملاك</option>
              <option value="broker">الدلالون</option>
              <option value="client">العملاء</option>
              <option value="service_provider">مزودو الخدمة</option>
            </select>
            <Button onClick={handleBroadcast} loading={sending} fullWidth>
              <Bell className="h-4 w-4" /> إرسال الإشعار
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
