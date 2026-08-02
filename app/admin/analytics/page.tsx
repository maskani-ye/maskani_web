"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { ChartCard } from "@/components/ui/ChartCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  ChartSquare, Global, Eye, UsersGroupRounded, DangerTriangle, Refresh, Routing,
} from "@solar-icons/react";
import { toast } from "sonner";

const COLORS = ["#2D6A4F", "#D4A017", "#EF4444", "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"];
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
  dau: number; wau: number; mau: number;
}
interface Summary {
  range: { from: string; to: string };
  totals: { visits: number; visitors: number; humans: number; bots: number; registered: number; events: number };
  by_day: { day: string; humans: number; bots: number }[];
  by_source: Bucket[];
  by_platform: Bucket[];
  by_device: Bucket[];
  by_browser: Bucket[];
  by_country: Bucket[];
  top_paths: Bucket[];
  by_event: Bucket[];
  top_targets: Target[];
  engagement: Engagement;
  by_utm_source: Bucket[];
  by_utm_campaign: Bucket[];
  crawlers: Bucket[];
}

const label = (m: Record<string, string>, k: string) => m[k] ?? (k || "غير معروف");

const EVENT_LABELS: Record<string, string> = {
  contact_click: "نقر تواصل", whatsapp_click: "واتساب", call_click: "اتصال",
  chat_started: "بدء محادثة", listing_created: "إنشاء إعلان", service_created: "إنشاء خدمة",
  request_created: "إنشاء طلب عقاري", job_created: "إنشاء طلب خدمة", offer_submitted: "إرسال عرض",
  favorite_added: "إضافة مفضلة", follow_user: "متابعة", search: "بحث", share_click: "مشاركة",
  review_submitted: "تقييم", report_created: "بلاغ",
};
const TARGET_LABELS: Record<string, string> = {
  listing: "إعلان", service: "خدمة", request: "طلب عقاري", job: "طلب خدمة", user: "مستخدم", report: "بلاغ",
};

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [days, setDays] = useState(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

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
      const res = await api.get<Summary>(ep.admin.analyticsSummary, { params });
      setData(res.data);
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

  const kpis = [
    { label: "إجمالي الزيارات", value: data?.totals.visits ?? 0, icon: Eye, color: "text-primary" },
    { label: "زوّار مختلفون", value: data?.totals.visitors ?? 0, icon: UsersGroupRounded, color: "text-blue-600" },
    { label: "زيارات بشرية", value: data?.totals.humans ?? 0, icon: Global, color: "text-green-600" },
    { label: "زواحف (بوتات)", value: data?.totals.bots ?? 0, icon: DangerTriangle, color: "text-gold" },
    { label: "مستخدمون مسجّلون", value: data?.totals.registered ?? 0, icon: ChartSquare, color: "text-purple-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <ChartSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">التحليلات والزيارات</h1>
            <p className="text-sm text-gray-500">
              {data ? `${data.range.from} → ${data.range.to}` : "قراءة واضحة لحركة المنصّة"}
            </p>
          </div>
        </div>
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
            onClick={fetchData}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-primary"
            title="تحديث"
          >
            <Refresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl card-shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <k.icon className={`h-5 w-5 ${k.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {loading ? "…" : k.value.toLocaleString("ar-YE")}
            </p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Engagement & retention strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[
          { l: "أحداث تحويل", v: (data?.totals.events ?? 0).toLocaleString("ar-YE") },
          { l: "الجلسات", v: (data?.engagement?.sessions ?? 0).toLocaleString("ar-YE") },
          { l: "صفحات/جلسة", v: (data?.engagement?.pages_per_session ?? 0).toLocaleString("ar-YE") },
          { l: "معدّل الارتداد", v: `${Math.round((data?.engagement?.bounce_rate ?? 0) * 100)}%` },
          { l: "زوّار جدد", v: (data?.engagement?.new_visitors ?? 0).toLocaleString("ar-YE") },
          { l: "زوّار عائدون", v: (data?.engagement?.returning_visitors ?? 0).toLocaleString("ar-YE") },
          { l: "نشِط أسبوعياً", v: (data?.engagement?.wau ?? 0).toLocaleString("ar-YE") },
          { l: "نشِط شهرياً", v: (data?.engagement?.mau ?? 0).toLocaleString("ar-YE") },
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
            <Line type="monotone" name="بشر" dataKey="humans" stroke="#2D6A4F" strokeWidth={2} dot={false} />
            <Line type="monotone" name="زواحف" dataKey="bots" stroke="#D4A017" strokeWidth={2} dot={false} />
          </LineChart>
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

      {/* Row: countries + top paths + crawlers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="أعلى الدول" icon={Global} height={220} empty={!loading && countryData.length === 0}>
          <BarChart data={countryData} layout="vertical" barSize={14}>
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={axisTick} width={70} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#2D6A4F" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>

        <_ListCard title="أكثر الصفحات زيارةً" icon={Routing} items={data?.top_paths ?? []} loading={loading} />
        <_ListCard title="زواحف محرّكات البحث" icon={DangerTriangle} items={data?.crawlers ?? []} loading={loading} emptyText="لا زواحف بعد" />
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
                <span className="font-semibold text-gray-900 tabular-nums">{it.count.toLocaleString("ar-YE")}</span>
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
