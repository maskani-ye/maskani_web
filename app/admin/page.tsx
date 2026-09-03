"use client";

import { useState, useEffect, useCallback, useRef, type ComponentType } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import {
  UsersGroupRounded, Buildings2, ShieldWarning, PenNewSquare,
  Eye, GraphNewUp, Bell, CheckCircle, MapPoint, AltArrowUp,
  DangerTriangle, Refresh, ChartSquare, ChatRoundDots, ShieldCheck,
  Letter, UserCross, Routing,
  Case,
} from "@solar-icons/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChartCard } from "@/components/ui/ChartCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { brand, chartPalette } from "@/lib/theme";
import { toast } from "sonner";

// ─── Types (تطابق 1:1 مع GET /admin/stats/) ─────────────────────────────────

interface AdminStats {
  users_count: number;
  active_users: number;
  inactive_users: number;
  verified_count: number;
  service_providers_count: number;
  properties_count: number;   // العقارات النشطة فقط (is_active=True)
  properties_total: number;
  fraud_count: number;
  pending_fraud: number;
  verified_fraud: number;
  rejected_fraud: number;
  requests_count: number;
  service_requests_count: number;
  services_count: number;
  conversations_count: number;
  messages_count: number;
  new_users_7d: number;
  new_properties_7d: number;
  new_fraud_7d: number;
  roles: { role: string; count: number }[];
  offer_types: { offer_type: string; count: number }[];
  property_types: { property_type__name_ar: string; count: number }[];
  properties_by_status: { status: string; count: number }[];
  top_cities: { city__name_ar: string; count: number }[];
  daily_users: { day: string; count: number }[];
}

const COLORS = [...chartPalette];

const roleLabels: Record<string, string> = { user: "مستخدم", admin: "مشرف" };
const offerLabels: Record<string, string> = {
  sale: "بيع", rent_monthly: "إيجار شهري", rent_yearly: "إيجار سنوي",
};
const statusLabels: Record<string, string> = {
  available: "متاح", reserved: "محجوز", sold_rented: "مباع / مؤجّر",
};

const tooltipStyle = { fontFamily: "IBM Plex Sans Arabic", borderRadius: 12, fontSize: 12 } as const;
const axisTick = { fontFamily: "IBM Plex Sans Arabic", fontSize: 11 } as const;

// أيقونات Solar تُعرّف weight كنوع اتحادي، بينما StatCard/EmptyState تتوقّع
// ComponentType بعرض أوسع. نُوسّع النوع لأيقونة تكفيها className (وهو ما تستخدمه هذه
// المكوّنات فعلياً عند الرسم) لتفادي تعارض الأنواع دون تعديل المكوّنات المشتركة.
type IconLike = ComponentType<{ className?: string }>;
const asIcon = (I: IconLike): IconLike => I;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [broadcast, setBroadcast] = useState({ title: "", body: "", role: "" });
  const [sending, setSending] = useState(false);

  const didInitialFetch = useRef(false);

  // ── fetch (single call on mount — نفس نمط بقية صفحات /admin) ────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminStats>(ep.admin.stats);
      setStats(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── auth guard + single fetch ──────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") { router.push("/"); return; }
    if (!didInitialFetch.current) {
      didInitialFetch.current = true;
      fetchStats();
    }
  }, [user, authLoading, router, fetchStats]);

  // ── broadcast ──────────────────────────────────────────────────────────────
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-64 rounded-2xl md:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error (رسالة موحّدة {message,fields} عبر getErrorMessage + إعادة محاولة) ──
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Card className="flex flex-col items-center text-center py-16">
          <span className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
            <DangerTriangle className="h-7 w-7 text-danger-600" />
          </span>
          <h2 className="text-h3 font-bold text-ink mb-1">تعذّر تحميل الإحصائيات</h2>
          <p className="text-body text-muted-500 mb-6 max-w-sm">{error}</p>
          <Button variant="primary" onClick={fetchStats}>
            <Refresh className="h-4 w-4" /> إعادة المحاولة
          </Button>
        </Card>
      </div>
    );
  }

  // ── Empty (لا بيانات على الإطلاق) ────────────────────────────────────────────
  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <EmptyState
            icon={asIcon(ChartSquare)}
            title="لا توجد بيانات بعد"
            message="ستظهر الإحصائيات هنا فور تسجيل المستخدمين وإضافة العقارات."
          />
        </Card>
      </div>
    );
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const kpis = [
    { label: "إجمالي المستخدمين", value: stats.users_count,   icon: UsersGroupRounded,
      trend: { value: `+${stats.new_users_7d}`, direction: "up" as const }, sub: "هذا الأسبوع" },
    { label: "العقارات النشطة",  value: stats.properties_count, icon: Buildings2,
      trend: { value: `+${stats.new_properties_7d}`, direction: "up" as const }, sub: "هذا الأسبوع" },
    { label: "بلاغات الاحتيال",   value: stats.fraud_count,    icon: ShieldWarning,
      trend: { value: `+${stats.new_fraud_7d}`, direction: "up" as const }, sub: "هذا الأسبوع" },
    { label: "قيد المراجعة",      value: stats.pending_fraud,  icon: Eye,
      sub: `${stats.verified_fraud} موثّق • ${stats.rejected_fraud} مرفوض` },
    { label: "طلبات عقارية",     value: stats.requests_count, icon: PenNewSquare },
    { label: "طلبات الخدمة",      value: stats.service_requests_count, icon: Case },
    { label: "مزودو الخدمة",      value: stats.services_count, icon: GraphNewUp },
  ];

  // ── بيانات الرسوم (من الحقول الفعلية للـ API) ───────────────────────────────
  const rolesData    = (stats.roles ?? []).map((r) => ({ name: roleLabels[r.role] ?? r.role, value: r.count }));
  const offersData   = (stats.offer_types ?? []).map((o) => ({ name: offerLabels[o.offer_type] ?? o.offer_type, value: o.count }));
  const propertyData = (stats.property_types ?? []).map((p) => ({ name: p.property_type__name_ar ?? "غير محدد", value: p.count }));
  const citiesData   = (stats.top_cities ?? []).map((c) => ({ name: c.city__name_ar, value: c.count }));
  const dailyData    = (stats.daily_users ?? []).map((d) => ({ name: d.day?.slice(5), value: d.count }));
  const statusData   = (stats.properties_by_status ?? []).map((s) => ({ name: statusLabels[s.status] ?? s.status, value: s.count }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <PageHeader icon={<GraphNewUp />} title="لوحة الإدارة"
          subtitle={`مرحباً ${user?.full_name ?? ""}`} />
        <div className="flex items-center gap-2">
          <Link
            href="/admin/helpdesk/flow"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-body font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Routing className="h-4 w-4" /> تدفّق محادثات البوت
          </Link>
          <div className="text-caption bg-success-50 text-success-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium">
            <CheckCircle className="h-3.5 w-3.5" /> البيانات مباشرة من الخادم
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value.toLocaleString(NUMERIC_LOCALE)}
            icon={asIcon(k.icon)}
            trend={k.trend}
            sub={k.sub}
          />
        ))}
      </div>

      {/* Secondary stats — تحليلات أعمق */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="المستخدمون النشطون" value={stats.active_users.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(CheckCircle)} />
        <StatCard label="محظورون / معطّلون"  value={stats.inactive_users.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(UserCross)} />
        <StatCard label="حسابات موثّقة"       value={stats.verified_count.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(ShieldCheck)} />
        <StatCard label="مزودو الخدمة"        value={stats.service_providers_count.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(GraphNewUp)} sub="حساب مزوّد" />
        <StatCard label="المحادثات"           value={stats.conversations_count.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(ChatRoundDots)} />
        <StatCard label="الرسائل"             value={stats.messages_count.toLocaleString(NUMERIC_LOCALE)} icon={asIcon(Letter)} />
      </div>

      {/* Charts — Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ChartCard
          title="تسجيلات المستخدمين — آخر 30 يوم"
          icon={AltArrowUp}
          height={200}
          className="md:col-span-2"
          empty={dailyData.length === 0}
        >
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={axisTick} />
            <YAxis tick={axisTick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={brand.primary} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="توزيع المستخدمين حسب الدور"
          icon={UsersGroupRounded}
          height={200}
          empty={rolesData.length === 0}
        >
          <PieChart>
            <Pie
              data={rolesData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {rolesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ChartCard>
      </div>

      {/* Charts — Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ChartCard
          title="العقارات حسب الحالة"
          icon={Buildings2}
          height={180}
          empty={statusData.length === 0}
        >
          <BarChart data={statusData} barSize={32}>
            <XAxis dataKey="name" tick={axisTick} />
            <YAxis tick={axisTick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="العقارات حسب نوع العرض"
          icon={Buildings2}
          height={180}
          empty={offersData.length === 0}
        >
          <BarChart data={offersData} barSize={32} layout="vertical">
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis dataKey="name" type="category" tick={axisTick} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={brand.gold} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="العقارات حسب نوع العقار"
          icon={Buildings2}
          height={180}
          empty={propertyData.length === 0}
        >
          <BarChart data={propertyData} barSize={32}>
            <XAxis dataKey="name" tick={axisTick} />
            <YAxis tick={axisTick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        {/* أكثر المدن نشاطاً — قائمة أشرطة RTL (ليست recharts) */}
        <Card>
          <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
            <MapPoint className="h-4 w-4 text-primary" /> أكثر المدن نشاطاً
          </h3>
          {citiesData.length === 0 ? (
            <EmptyState icon={asIcon(MapPoint)} title="لا توجد مدن نشطة بعد" className="py-8" />
          ) : (
            <div className="space-y-3">
              {citiesData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-caption font-bold text-muted w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-body font-medium text-muted-700">{c.name}</span>
                      <span className="text-caption text-muted">{c.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(c.value / (citiesData[0]?.value || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pending Reports */}
        <Card>
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
            <ShieldWarning className="h-5 w-5 text-danger-500" /> إدارة البلاغات
          </h3>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 text-center bg-warning-50 rounded-xl p-2">
              <p className="text-h3 font-bold text-warning-700">{stats.pending_fraud}</p>
              <p className="text-caption text-warning-600">قيد المراجعة</p>
            </div>
            <div className="flex-1 text-center bg-success-50 rounded-xl p-2">
              <p className="text-h3 font-bold text-success-700">{stats.verified_fraud}</p>
              <p className="text-caption text-success-600">موثّق</p>
            </div>
            <div className="flex-1 text-center bg-danger-50 rounded-xl p-2">
              <p className="text-h3 font-bold text-danger-700">{stats.rejected_fraud}</p>
              <p className="text-caption text-danger-600">مرفوض</p>
            </div>
          </div>
          <Button onClick={() => router.push("/admin/reports")} variant="outline" fullWidth>
            مراجعة البلاغات
          </Button>
        </Card>

        {/* Cities */}
        <Card>
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
            <MapPoint className="h-5 w-5 text-primary" /> إدارة المدن والدول
          </h3>
          <p className="text-muted-500 text-body mb-4">إضافة وتعديل المدن والدول المتاحة في المنصة</p>
          <Button onClick={() => router.push("/admin/cities")} variant="outline" fullWidth>
            إدارة المدن
          </Button>
        </Card>

        {/* Users */}
        <Card>
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
            <UsersGroupRounded className="h-5 w-5 text-primary" /> إدارة المستخدمين
          </h3>
          <p className="text-muted-500 text-body mb-4">عرض وتعديل وتوثيق وتعليق حسابات المستخدمين</p>
          <Button onClick={() => router.push("/admin/users")} variant="outline" fullWidth>
            إدارة المستخدمين
          </Button>
        </Card>

        {/* Broadcast */}
        <Card>
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> إشعار جماعي
          </h3>
          <div className="space-y-2">
            <input
              placeholder="عنوان الإشعار"
              value={broadcast.title}
              onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))}
              className="w-full h-10 border border-muted-200 rounded-xl px-4 text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              placeholder="محتوى الإشعار"
              value={broadcast.body}
              onChange={(e) => setBroadcast((p) => ({ ...p, body: e.target.value }))}
              rows={2}
              className="w-full border border-muted-200 rounded-xl px-4 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <select
              value={broadcast.role}
              onChange={(e) => setBroadcast((p) => ({ ...p, role: e.target.value }))}
              className="w-full h-10 border border-muted-200 rounded-xl px-4 text-body focus:outline-none"
            >
              <option value="">الكل</option>
              <option value="user">المستخدمون</option>
              <option value="admin">المشرفون</option>
            </select>
            <Button onClick={handleBroadcast} loading={sending} fullWidth>
              <Bell className="h-4 w-4" /> إرسال
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
