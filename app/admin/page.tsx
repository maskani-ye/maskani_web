"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  UsersGroupRounded, Buildings2, ShieldWarning, PenNewSquare,
  Eye, GraphNewUp, Bell, CheckCircle, MapPoint, AltArrowUp,
} from "@solar-icons/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────

interface AdminStats {
  users_count: number;
  listings_count: number;
  fraud_count: number;
  pending_fraud: number;
  verified_fraud: number;
  rejected_fraud: number;
  requests_count: number;
  services_count: number;
  new_users_7d: number;
  new_listings_7d: number;
  new_fraud_7d: number;
  roles: { role: string; count: number }[];
  offer_types: { offer_type: string; count: number }[];
  property_types: { property_type: string; count: number }[];
  top_cities: { city__name_ar: string; count: number }[];
  daily_users: { day: string; count: number }[];
}

const COLORS = ["#2D6A4F", "#D4A017", "#EF4444", "#3B82F6", "#8B5CF6"];

const roleLabels: Record<string, string> = {
  user: "مستخدم", admin: "مشرف",
};
const offerLabels: Record<string, string> = {
  sale: "بيع", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي",
};
const propertyLabels: Record<string, string> = {
  apartment: "شقة", house: "منزل", land: "أرض", commercial: "تجاري",
};

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [broadcast, setBroadcast] = useState({ title: "", body: "", role: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/"); return; }
    if (!authLoading && user?.role === "admin") {
      api.get<AdminStats>("/admin/stats/")
        .then((r) => setStats(r.data))
        .catch((err) => toast.error(getErrorMessage(err)));
    }
  }, [user, authLoading, router]);

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.body) { toast.error("العنوان والمحتوى مطلوبان"); return; }
    setSending(true);
    try {
      await api.post("/notifications/broadcast/", broadcast);
      toast.success("تم إرسال الإشعار بنجاح");
      setBroadcast({ title: "", body: "", role: "" });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  if (!stats) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl card-shadow p-5 h-28 animate-pulse" />
        ))}
      </div>
    </div>
  );

  // ── بيانات الكروت ──────────────────────────────────────────────────────
  const statCards = [
    { label: "إجمالي المستخدمين", value: stats.users_count, sub: `+${stats.new_users_7d} هذا الأسبوع`, icon: UsersGroupRounded, color: "bg-primary/10 text-primary" },
    { label: "الإعلانات النشطة",   value: stats.listings_count, sub: `+${stats.new_listings_7d} هذا الأسبوع`, icon: Buildings2, color: "bg-gold/10 text-gold" },
    { label: "بلاغات الاحتيال",    value: stats.fraud_count, sub: `+${stats.new_fraud_7d} هذا الأسبوع`, icon: ShieldWarning, color: "bg-red-100 text-red-600" },
    { label: "بلاغات قيد المراجعة", value: stats.pending_fraud, sub: `${stats.verified_fraud} موثّق • ${stats.rejected_fraud} مرفوض`, icon: Eye, color: "bg-yellow-100 text-yellow-600" },
    { label: "طلبات العملاء",       value: stats.requests_count, sub: "", icon: PenNewSquare, color: "bg-blue-100 text-blue-600" },
    { label: "مزودو الخدمة",        value: stats.services_count, sub: "", icon: GraphNewUp, color: "bg-purple-100 text-purple-600" },
  ];

  // ── بيانات الرسوم البيانية ─────────────────────────────────────────────
  const rolesData = stats.roles.map((r) => ({ name: roleLabels[r.role] ?? r.role, value: r.count }));
  const offersData = stats.offer_types.map((o) => ({ name: offerLabels[o.offer_type] ?? o.offer_type, value: o.count }));
  const propertyData = stats.property_types.map((p) => ({ name: propertyLabels[p.property_type] ?? p.property_type, value: p.count }));
  const citiesData = stats.top_cities.map((c) => ({ name: c.city__name_ar, value: c.count }));
  const dailyData = stats.daily_users.map((d) => ({ name: d.day?.slice(5), value: d.count }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
          <p className="text-gray-500 text-sm mt-1">مرحباً {user?.full_name}</p>
        </div>
        <div className="text-xs text-gray-400 bg-green-50 text-green-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium">
          <CheckCircle className="h-3.5 w-3.5" /> البيانات مباشرة من الخادم
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl card-shadow p-4">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value.toLocaleString("ar-YE")}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
              {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Daily registrations */}
        <div className="md:col-span-2 bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AltArrowUp className="h-4 w-4 text-primary" />
            تسجيلات المستخدمين — آخر 30 يوم
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontFamily: "Cairo", fontSize: 11 }} />
              <YAxis tick={{ fontFamily: "Cairo", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Cairo", borderRadius: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#2D6A4F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Roles pie */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">توزيع المستخدمين</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={rolesData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {rolesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "Cairo", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Offer types */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">الإعلانات حسب نوع العرض</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={offersData} barSize={32} layout="vertical">
              <XAxis type="number" tick={{ fontFamily: "Cairo", fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontFamily: "Cairo", fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ fontFamily: "Cairo", borderRadius: 12 }} />
              <Bar dataKey="value" fill="#D4A017" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property types */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">أنواع العقارات</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={propertyData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontFamily: "Cairo", fontSize: 11 }} />
              <YAxis tick={{ fontFamily: "Cairo", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Cairo", borderRadius: 12 }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top cities */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">أكثر المدن نشاطاً</h3>
          <div className="space-y-3">
            {citiesData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-700">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(c.value / (citiesData[0]?.value || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pending Reports */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ShieldWarning className="h-5 w-5 text-red-500" />
            إدارة البلاغات
          </h3>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 text-center bg-yellow-50 rounded-xl p-2">
              <p className="text-lg font-bold text-yellow-700">{stats.pending_fraud}</p>
              <p className="text-xs text-yellow-600">قيد المراجعة</p>
            </div>
            <div className="flex-1 text-center bg-green-50 rounded-xl p-2">
              <p className="text-lg font-bold text-green-700">{stats.verified_fraud}</p>
              <p className="text-xs text-green-600">موثّق</p>
            </div>
            <div className="flex-1 text-center bg-red-50 rounded-xl p-2">
              <p className="text-lg font-bold text-red-700">{stats.rejected_fraud}</p>
              <p className="text-xs text-red-600">مرفوض</p>
            </div>
          </div>
          <Button onClick={() => router.push("/admin/reports")} variant="outline" fullWidth>
            مراجعة البلاغات
          </Button>
        </div>

        {/* Cities */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPoint className="h-5 w-5 text-primary" />
            إدارة المدن والدول
          </h3>
          <p className="text-gray-500 text-sm mb-4">إضافة وتعديل المدن والدول المتاحة في المنصة</p>
          <Button onClick={() => router.push("/admin/cities")} variant="outline" fullWidth>
            إدارة المدن
          </Button>
        </div>

        {/* Users */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <UsersGroupRounded className="h-5 w-5 text-primary" />
            إدارة المستخدمين
          </h3>
          <p className="text-gray-500 text-sm mb-4">عرض وتعديل وتوثيق وتعليق حسابات المستخدمين</p>
          <Button onClick={() => router.push("/admin/users")} variant="outline" fullWidth>
            إدارة المستخدمين
          </Button>
        </div>

        {/* Broadcast */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            إشعار جماعي
          </h3>
          <div className="space-y-2">
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
              <option value="user">المستخدمون</option>
              <option value="admin">المشرفون</option>
            </select>
            <Button onClick={handleBroadcast} loading={sending} fullWidth>
              <Bell className="h-4 w-4" /> إرسال
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
