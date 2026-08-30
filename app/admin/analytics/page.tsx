"use client";

import { useState, useEffect, useCallback } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  ChartSquare, Global, Eye, UsersGroupRounded, DangerTriangle, Refresh, Routing,
} from "@solar-icons/react";
import { toast } from "sonner";

const COLORS = ["#403B9B", "#FFC107", "#EF4444", "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"];
const axisTick = { fontSize: 11, fill: "#9ca3af" };
const tooltipStyle = { borderRadius: 12, border: "1px solid #eee", fontSize: 12 };

const SOURCE_LABELS: Record<string, string> = {
  direct: "مباشر", search: "محرّك بحث", social: "شبكة اجتماعية", referral: "إحالة", internal: "داخلي",
};
const PLATFORM_LABELS: Record<string, string> = { web: "ويب", app: "تطبيق", api: "API" };
const DEVICE_LABELS: Record<string, string> = { mobile: "جوال", desktop: "حاسوب", tablet: "لوحي", bot: "زاحف" };

interface Bucket { key: string; count: number; }
interface Target { target_type: string; target_id: number; title: string; count: number; }
interface Engagement {
  sessions: number; pages_per_session: number; bounce_rate: number;
  new_visitors: number; returning_visitors: number;
  dau: number; wau: number; mau: number; stickiness: number;
}
type Delta = number | null;
interface Summary {
  range: { from: string; to: string };
  totals: { visits: number; visitors: number; humans: number; bots: number; registered: number; events: number };
  by_day: { day: string; humans: number; bots: number }[];
  by_source: Bucket[];
  by_platform: Bucket[];
  by_device: Bucket[];
  by_browser: Bucket[];
  by_region: Bucket[];
  region_coverage: number;
  by_country: Bucket[];
  by_city: Bucket[];
  by_hour: { hour: number; count: number }[];
  by_weekday: { weekday: string; count: number }[];
  comparison: { visits_delta: Delta; visitors_delta: Delta; events_delta: Delta; prev_range: { from: string; to: string } };
  top_paths: Bucket[];
  by_event: Bucket[];
  top_targets: Target[];
  engagement: Engagement;
  by_utm_source: Bucket[];
  by_utm_campaign: Bucket[];
  crawlers: Bucket[];
}
interface Realtime {
  active_5m: number; views_30m: number; events_30m: number;
  top_paths: Bucket[]; by_country: Bucket[];
  recent_events: { event_name: string; path: string; country: string; created_at: string }[];
  pulse: { minute: number; count: number }[];
}
interface Cohort { date: string; size: number; d1: Delta; d7: Delta; }

const label = (m: Record<string, string>, k: string) => m[k] ?? (k || "غير معروف");

const EVENT_LABELS: Record<string, string> = {
  contact_click: "نقر تواصل", whatsapp_click: "واتساب", call_click: "اتصال",
  chat_started: "بدء محادثة", property_created: "إنشاء عقار", service_created: "إنشاء خدمة",
  request_created: "إنشاء طلب عقاري", job_created: "إنشاء طلب خدمة", offer_submitted: "إرسال عرض",
  favorite_added: "إضافة مفضلة", follow_user: "متابعة", search: "بحث", share_click: "مشاركة",
  review_submitted: "تقييم", report_created: "بلاغ",
};
const TARGET_LABELS: Record<string, string> = {
  property: "عقار", service: "خدمة", request: "طلب عقاري", job: "طلب خدمة", user: "مستخدم", report: "بلاغ",
};

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [funnel, setFunnel] = useState<{ key: string; label: string; sessions: number; rate_from_top: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [days, setDays] = useState(1);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [platform, setPlatform] = useState("");
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  // تحديث حيّ للنبض اللحظيّ كل 30 ثانية (لوحة مراقبة حيّة).
  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;
    const tick = () =>
      api.get<Realtime>(ep.admin.analyticsRealtime).then((r) => setRealtime(r.data)).catch(() => {});
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [authLoading, user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let params: Record<string, string>;
      if (mode === "custom") {
        if (!customFrom || !customTo) {
          setLoading(false);
          return; // ننتظر اكتمال النطاق المخصّص
        }
        params = { from: customFrom, to: customTo };
      } else {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - (days - 1));
        params = {
          from: from.toISOString().slice(0, 10),
          to: to.toISOString().slice(0, 10),
        };
      }
      if (platform) params.platform = platform;
      const [sumRes, funRes, rtRes, retRes] = await Promise.all([
        api.get<Summary>(ep.admin.analyticsSummary, { params }),
        api.get<{ stages: { key: string; label: string; sessions: number; rate_from_top: number }[] }>(
          ep.admin.analyticsFunnel, { params }),
        api.get<Realtime>(ep.admin.analyticsRealtime),
        api.get<{ cohorts: Cohort[] }>(ep.admin.analyticsRetention),
      ]);
      setData(sumRes.data);
      setFunnel(funRes.data?.stages ?? []);
      setRealtime(rtRes.data);
      setCohorts(retRes.data?.cohorts ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [mode, days, customFrom, customTo, platform]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") fetchData();
  }, [authLoading, user, fetchData]);

  const dailyData = (data?.by_day ?? []).map((d) => ({ name: d.day.slice(5), humans: d.humans, bots: d.bots }));
  const sourceData = (data?.by_source ?? []).map((b) => ({ name: label(SOURCE_LABELS, b.key), value: b.count }));
  const platformData = (data?.by_platform ?? []).map((b) => ({ name: label(PLATFORM_LABELS, b.key), value: b.count }));
  const deviceData = (data?.by_device ?? []).map((b) => ({ name: label(DEVICE_LABELS, b.key), value: b.count }));
  const countryData = (data?.by_country ?? []).map((b) => ({ name: b.key || "غير معروف", value: b.count }));
  const regionData = (data?.by_region ?? []).map((b) => ({ name: b.key || "غير محدّد", value: b.count }));
  const regionCoveragePct = Math.round((data?.region_coverage ?? 0) * 100);

  const hourData = (data?.by_hour ?? []).map((h) => ({ name: `${h.hour}`, value: h.count }));
  const cityData = (data?.by_city ?? []).map((b) => ({ name: b.key || "غير معروف", value: b.count }));

  const kpis = [
    { label: "إجمالي الزيارات", value: data?.totals.visits ?? 0, icon: Eye, color: "text-primary", delta: data?.comparison?.visits_delta ?? null },
    { label: "زوّار مختلفون", value: data?.totals.visitors ?? 0, icon: UsersGroupRounded, color: "text-blue-600", delta: data?.comparison?.visitors_delta ?? null },
    { label: "زيارات بشرية", value: data?.totals.humans ?? 0, icon: Global, color: "text-green-600", delta: null as Delta },
    { label: "زواحف (بوتات)", value: data?.totals.bots ?? 0, icon: DangerTriangle, color: "text-gold", delta: null as Delta },
    { label: "مستخدمون مسجّلون", value: data?.totals.registered ?? 0, icon: ChartSquare, color: "text-purple-600", delta: data?.comparison?.events_delta ?? null },
  ];

  const exportCsv = async () => {
    try {
      const res = await api.get(ep.admin.analyticsVisitsExport, { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "maskani_visits.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("تعذّر تصدير الملف");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <PageHeader icon={<ChartSquare />} title="التحليلات والزيارات"
          subtitle={data ? `${data.range.from} → ${data.range.to}` : "قراءة واضحة لحركة المنصّة"} />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 flex-wrap">
            {[{ d: 1, l: "اليوم" }, { d: 7, l: "7 أيام" }, { d: 30, l: "30 يوم" }, { d: 90, l: "90 يوم" }].map(({ d, l }) => (
              <button
                key={d}
                onClick={() => { setMode("preset"); setDays(d); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  mode === "preset" && days === d ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
                }`}
              >
                {l}
              </button>
            ))}
            <button
              onClick={() => setMode("custom")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "custom" ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
              }`}
            >
              مخصّص
            </button>
          </div>
          {mode === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-gray-400 text-sm">إلى</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">كل المنصّات</option>
            <option value="web">ويب</option>
            <option value="app">تطبيق</option>
            <option value="api">API</option>
          </select>
          <button
            onClick={exportCsv}
            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 hover:text-primary"
            title="تصدير الزيارات CSV"
          >
            تصدير
          </button>
          <button
            onClick={fetchData}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-primary"
            title="تحديث"
          >
            <Refresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* مباشر الآن — نبض اللحظة (يتحدّث كل 30 ثانية) */}
      {realtime && (
        <div className="bg-gradient-to-l from-primary/5 to-transparent border border-primary/15 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-x-8 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-sm font-bold text-gray-800">مباشر الآن</span>
          </div>
          <div><span className="text-2xl font-bold text-primary tabular-nums">{realtime.active_5m}</span> <span className="text-xs text-gray-500">نشط (آخر 5د)</span></div>
          <div><span className="text-lg font-bold text-gray-700 tabular-nums">{realtime.views_30m}</span> <span className="text-xs text-gray-500">مشاهدة/30د</span></div>
          <div><span className="text-lg font-bold text-gray-700 tabular-nums">{realtime.events_30m}</span> <span className="text-xs text-gray-500">حدث/30د</span></div>
          {realtime.top_paths?.[0] && (
            <div className="text-xs text-gray-500">أنشط صفحة: <span className="font-mono text-gray-700">{realtime.top_paths[0].key}</span></div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl card-shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <k.icon className={`h-5 w-5 ${k.color}`} />
              {typeof k.delta === "number" && (
                <span className={`text-xs font-bold tabular-nums ${k.delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {loading ? "…" : k.value.toLocaleString(NUMERIC_LOCALE)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Engagement & retention strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[
          { l: "أحداث تحويل", v: (data?.totals.events ?? 0).toLocaleString(NUMERIC_LOCALE) },
          { l: "الجلسات", v: (data?.engagement?.sessions ?? 0).toLocaleString(NUMERIC_LOCALE) },
          { l: "صفحات/جلسة", v: (data?.engagement?.pages_per_session ?? 0).toLocaleString(NUMERIC_LOCALE) },
          { l: "معدّل الارتداد", v: `${Math.round((data?.engagement?.bounce_rate ?? 0) * 100)}%` },
          { l: "زوّار جدد", v: (data?.engagement?.new_visitors ?? 0).toLocaleString(NUMERIC_LOCALE) },
          { l: "زوّار عائدون", v: (data?.engagement?.returning_visitors ?? 0).toLocaleString(NUMERIC_LOCALE) },
          { l: "نشِط أسبوعياً", v: (data?.engagement?.wau ?? 0).toLocaleString(NUMERIC_LOCALE) },
          { l: "نشِط شهرياً", v: (data?.engagement?.mau ?? 0).toLocaleString(NUMERIC_LOCALE) },
        ].map((m) => (
          <div key={m.l} className="bg-white rounded-2xl card-shadow p-4">
            <p className="text-xl font-bold text-gray-900 tabular-nums">{loading ? "…" : m.v}</p>
            <p className="text-xs text-gray-500 mt-1">{m.l}</p>
          </div>
        ))}
      </div>

      {/* Time series */}
      <div className="mb-6">
        <ChartCard
          title="الزيارات اليومية — بشر مقابل زواحف"
          icon={Eye}
          height={240}
          empty={!loading && dailyData.length === 0}
        >
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={axisTick} />
            <YAxis tick={axisTick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line type="monotone" name="بشر" dataKey="humans" stroke="#403B9B" strokeWidth={2} dot={false} />
            <Line type="monotone" name="زواحف" dataKey="bots" stroke="#FFC107" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
      </div>

      {/* Row: ساعات الذروة + أعلى المدن */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartCard title="نشاط اليوم بالساعة (ساعات الذروة)" icon={Eye} height={200} empty={!loading && hourData.every((h) => h.value === 0)}>
          <BarChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={axisTick} interval={2} />
            <YAxis tick={axisTick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#403B9B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="أعلى المدن" icon={Global} height={200} empty={!loading && cityData.length === 0}>
          <BarChart data={cityData} layout="vertical">
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={axisTick} width={72} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#FFC107" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Row: source / platform / device */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ChartCard title="مصادر الزيارات" icon={Routing} height={200} empty={!loading && sourceData.length === 0}>
          <PieChart>
            <Pie
              data={sourceData} cx="50%" cy="50%" outerRadius={72} dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ChartCard>

        <ChartCard title="حسب المنصّة" icon={ChartSquare} height={200} empty={!loading && platformData.length === 0}>
          <PieChart>
            <Pie data={platformData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} dataKey="value"
              label={({ name }: { name?: string }) => name ?? ""}>
              {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ChartCard>

        <ChartCard title="حسب الجهاز" icon={UsersGroupRounded} height={200} empty={!loading && deviceData.length === 0}>
          <BarChart data={deviceData} barSize={30}>
            <XAxis dataKey="name" tick={axisTick} />
            <YAxis tick={axisTick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Row: الجغرافيا — المحافظة (دقيقة، من ملف المستخدم/المدينة المختارة) هي
          الأساس؛ الدولة (IP) تقريبية وتُخطئ توطين مستخدمي اليمن فتُعرض ثانويةً. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard
          title="أعلى المحافظات"
          icon={Global}
          height={220}
          empty={!loading && regionData.length === 0}
          subtitle={`تغطية ${regionCoveragePct}% من الزيارات (من المدينة المختارة/الملف)`}
        >
          <BarChart data={regionData} layout="vertical" barSize={14}>
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={axisTick} width={70} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#403B9B" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="أعلى الدول (تقريبي — IP)"
          icon={Global}
          height={220}
          empty={!loading && countryData.length === 0}
          subtitle="حسب عنوان IP — تقريبي (قد يُخطئ توطين مستخدمي اليمن)"
        >
          <BarChart data={countryData} layout="vertical" barSize={14}>
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={axisTick} width={70} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#9CA3AF" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>

        <_ListCard title="أكثر الصفحات زيارةً" icon={Routing} items={data?.top_paths ?? []} loading={loading} />
      </div>

      {/* Row: crawlers on its own */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <_ListCard title="زواحف محرّكات البحث" icon={DangerTriangle} items={data?.crawlers ?? []} loading={loading} emptyText="لا زواحف بعد" />
        <_ListCard title="أعلى المدن (تقريبي — IP)" icon={Global} items={data?.by_city ?? []} loading={loading} emptyText="لا بيانات بعد" />
      </div>

      {/* Row: conversion events + engaged entities + campaigns (UTM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <_ListCard
          title="أحداث التحويل"
          icon={ChartSquare}
          loading={loading}
          emptyText="لا أحداث بعد"
          items={(data?.by_event ?? []).map((b) => ({ key: label(EVENT_LABELS, b.key), count: b.count }))}
        />
        <_ListCard
          title="أكثر الكيانات تفاعلاً"
          icon={Eye}
          loading={loading}
          emptyText="لا تفاعل بعد"
          items={(data?.top_targets ?? []).map((t) => ({
            key: `${label(TARGET_LABELS, t.target_type)}: ${t.title || `#${t.target_id}`}`,
            count: t.count,
          }))}
        />
        <_ListCard
          title="حملات التسويق (UTM)"
          icon={Routing}
          loading={loading}
          emptyText="لا حملات موسومة"
          items={data?.by_utm_source ?? []}
        />
      </div>

      {/* احتفاظ الأفواج (Cohorts): نسبة عودة الزوّار الجدد بعد يوم/أسبوع */}
      {cohorts.length > 0 && (
        <div className="bg-white rounded-2xl card-shadow p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3">احتفاظ الأفواج — عودة الزوّار الجدد</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs">
                  <th className="text-right py-2 px-2 font-semibold">اليوم</th>
                  <th className="text-right py-2 px-2 font-semibold">زوّار جدد</th>
                  <th className="text-right py-2 px-2 font-semibold">عودة D1</th>
                  <th className="text-right py-2 px-2 font-semibold">عودة D7</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cohorts.map((c) => (
                  <tr key={c.date}>
                    <td className="py-2 px-2 text-gray-500 tabular-nums">{c.date.slice(5)}</td>
                    <td className="py-2 px-2 font-semibold text-gray-800 tabular-nums">{c.size}</td>
                    {[c.d1, c.d7].map((v, i) => (
                      <td key={i} className="py-2 px-2">
                        {v === null ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <span className={`font-bold tabular-nums ${v >= 0.4 ? "text-green-600" : v >= 0.2 ? "text-gold" : "text-gray-500"}`}>
                            {Math.round(v * 100)}%
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversion funnel: تصفّح → تواصل → محادثة → عرض */}
      <div className="grid grid-cols-1 mt-6">
        <_ListCard
          title="قُمع التحويل (جلسات)"
          icon={Routing}
          loading={loading}
          emptyText="لا بيانات قُمع بعد"
          items={funnel.map((s) => ({
            key: `${s.label} · ${Math.round((s.rate_from_top ?? 0) * 100)}%`,
            count: s.sessions,
          }))}
        />
      </div>
    </div>
  );
}

function _ListCard({
  title, icon: Icon, items, loading, emptyText = "لا توجد بيانات بعد",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Bucket[];
  loading: boolean;
  emptyText?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="bg-white rounded-2xl card-shadow p-5 flex flex-col">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
        ))}</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 truncate max-w-[70%]" dir="ltr">{it.key || "—"}</span>
                <span className="font-semibold text-gray-900 tabular-nums">{it.count.toLocaleString(NUMERIC_LOCALE)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(it.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
