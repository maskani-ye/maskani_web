"use client";

/**
 * حركة النطاق — من Cloudflare عند الحافّة.
 *
 * ⚠️ **صفحةٌ مستقلّة عن «التحليلات» عمداً، لأنّ الرقمين يقيسان شيئين.**
 * تحليلاتنا تُسجَّل من المتصفّح بمنارة JavaScript، فلا ترى: زاحفاً لا ينفّذ JS،
 * ولا طلباً ردّه كاش الحافّة قبل بلوغ الخادم، ولا زائراً يحجب البرامج النصّية.
 * وCloudflare يعدّ **كل طلبٍ يمرّ**. فدمجهما في صفحةٍ واحدة يوحي بأنّ أحدهما
 * يصحّح الآخر — وليس كذلك؛ الفجوة بينهما هي المعلومة: كم من الحركة آلة.
 *
 * ⚠️ **وليست صفحة `/admin/infrastructure/cloudflare`**: تلك تقول «هل الخدمة
 * تعمل»، وهذه تقول «كم حركة مرّت ومن أين».
 */

import { type ComponentType, useCallback, useEffect, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Bill, ChartSquare, DangerTriangle, Global, InfoCircle, Refresh,
  ServerSquare, Shield, UsersGroupTwoRounded,
} from "@solar-icons/react";

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChartCard } from "@/components/ui/ChartCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/utils";

interface Point {
  date: string; page_views: number; requests: number; bytes: number;
  threats: number; cached: number; uniques: number | null;
}
interface Named { name: string; value: number }
interface Report {
  available: boolean; reason?: string;
  zone?: string; plan?: string;
  requested_days?: number; actual_days?: number;
  since?: string | null; until?: string | null;
  totals?: {
    page_views: number; requests: number; bytes: number;
    threats: number; uniques: number; cache_hit_pct: number | null;
  };
  series?: Point[]; countries?: Named[]; statuses?: Named[]; browsers?: Named[];
}

const axisTick = { fontSize: 11, fill: "#9ca3af" };

const GB = (b: number) => `${(b / 1e9).toFixed(1)} ج.ب`;

// أيقونات Solar تُعرّف `weight` نوعاً اتحادياً، والمكوّنات المشتركة تتوقّع
// `ComponentType` أوسع. نتبع نفس التوسيع المعتمد في `app/admin/page.tsx` بدل
// تعديل المكوّنات المشتركة أو اختراع حلٍّ ثانٍ.
type IconLike = ComponentType<{ className?: string }>;
const asIcon = (I: IconLike): IconLike => I;

/** أسماء الدول بالعربية — الـAPI يعيد رمز ISO. */
const COUNTRY: Record<string, string> = {
  US: "الولايات المتحدة", SA: "السعودية", YE: "اليمن", EG: "مصر",
  JO: "الأردن", IQ: "العراق", OM: "عُمان", AE: "الإمارات", KW: "الكويت",
  DE: "ألمانيا", SG: "سنغافورة", CN: "الصين", GB: "بريطانيا", FR: "فرنسا",
  NL: "هولندا", IE: "أيرلندا", IN: "الهند", RU: "روسيا", TR: "تركيا",
};

export default function TrafficPage() {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await api.get<Report>(endpoints.admin.trafficReport, { params: { days: d } });
      setData(res.data);
    } catch {
      setData({ available: false, reason: "تعذّر الوصول إلى الخادم." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [load, days]);

  const t = data?.totals;
  const series = data?.series ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="حركة النطاق"
        subtitle={
          data?.available
            ? `${data.zone} · خطّة ${data.plan} · ${data.since} → ${data.until}`
            : "قياس Cloudflare عند الحافّة"
        }
        icon={<Global className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-xl ring-1 ring-muted-200">
              {[7, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-2 text-caption font-semibold transition-colors ${
                    days === d ? "bg-primary text-white" : "bg-white text-muted-600 hover:bg-muted-50"
                  }`}
                >
                  {formatNumber(d)} يوم
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => load(days)} loading={loading}>
              <Refresh className="h-4 w-4" /> تحديث
            </Button>
          </div>
        }
      />

      {/* ⚠️ الغياب يُشرح ولا يُترك فراغاً صامتاً. */}
      {data && !data.available && (
        <Card className="flex items-start gap-3 border-warning-200 bg-warning-50">
          <DangerTriangle weight="Bold" className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" />
          <div>
            <p className="font-bold text-ink">تحليلات Cloudflare غير متاحة</p>
            <p className="mt-1 text-body text-muted-600">{data.reason}</p>
          </div>
        </Card>
      )}

      {data?.available && t && (
        <>
          {/* ⚠️ المدى الفعليّ لا المطلوب: الحزمة المجانية تحفظ ٢٧ يوماً. */}
          {data.actual_days !== undefined && data.requested_days !== undefined
            && data.actual_days < data.requested_days && (
            <Card className="flex items-start gap-3 border-info-200 bg-info-50">
              <InfoCircle weight="Bold" className="mt-0.5 h-5 w-5 shrink-0 text-info-700" />
              <p className="text-body text-muted-700">
                طُلب {formatNumber(data.requested_days)} يوماً وتوفّر{" "}
                {formatNumber(data.actual_days)} — الحزمة المجانية في Cloudflare
                تحفظ نافذةً محدودة، والأرقام أدناه تخصّ المدى المتوفّر وحده.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="مشاهدات الصفحات" value={formatNumber(t.page_views)} icon={asIcon(ChartSquare)} />
            <StatCard label="الطلبات" value={formatNumber(t.requests)} icon={asIcon(ServerSquare)} />
            <StatCard label="زوّار فريدون" value={formatNumber(t.uniques)} icon={asIcon(UsersGroupTwoRounded)}
                      sub="مجموع العدّ اليوميّ" />
            <StatCard label="تهديدات محجوبة" value={formatNumber(t.threats)} icon={asIcon(Shield)} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="الحركة" value={GB(t.bytes)} icon={asIcon(Bill)} />
            <StatCard label="من الكاش"
                      value={t.cache_hit_pct === null ? "—" : `${formatNumber(t.cache_hit_pct)}٪`}
                      icon={asIcon(ServerSquare)} sub="ما خدمته الحافّة بلا خادمنا" />
            <StatCard label="أيام مقيسة" value={formatNumber(data.actual_days ?? 0)} icon={asIcon(Global)} />
            <StatCard
              label="متوسّط يوميّ"
              value={formatNumber(Math.round(t.page_views / Math.max(1, data.actual_days ?? 1)))}
              icon={asIcon(ChartSquare)} sub="مشاهدة/يوم"
            />
          </div>

          <ChartCard title="مشاهدات الصفحات يومياً" icon={asIcon(ChartSquare)} height={260}
                     subtitle="القياس عند الحافّة — يشمل الزواحف"
                     empty={series.length === 0}>
            {/* ⚠️ **`ChartCard` يغلّف أبناءه بـ`ResponsiveContainer` من Recharts.**
                فأعمدةٌ مرسومة بـ`div` تخرج فارغةً بلا خطأ — بُنيت أوّلاً هكذا
                فظهر المخطّط أبيض، ولم يُكشف إلا برؤيته مرسوماً. */}
            <AreaChart data={series} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#403B9B" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#403B9B" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false}
                     tickFormatter={(d) => String(d).slice(5)} minTickGap={18} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={52}
                     tickFormatter={(v) => formatNumber(Number(v))} />
              <Tooltip
                labelFormatter={(d) => String(d)}
                formatter={(v) => [formatNumber(Number(v)), "مشاهدة"]}
                contentStyle={{ fontFamily: "IBM Plex Sans Arabic", fontSize: 12,
                                borderRadius: 12, border: "1px solid #E5E7EB" }}
              />
              <Area type="monotone" dataKey="page_views" stroke="#403B9B" strokeWidth={2}
                    fill="url(#pv)" />
            </AreaChart>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <Breakdown title="الدول" icon={asIcon(Global)} rows={data.countries ?? []}
                       label={(n) => COUNTRY[n] ?? n} />
            <Breakdown title="المتصفّحات والزواحف" icon={asIcon(UsersGroupTwoRounded)}
                       rows={data.browsers ?? []} />
            <Breakdown title="رموز الاستجابة" icon={asIcon(ServerSquare)} rows={data.statuses ?? []} />
          </div>

          {/* ⚠️ الفرق بين الرقمين ليس خطأً — يُشرح في مكانه لا في ذهن القارئ. */}
          <Card className="flex items-start gap-3">
            <InfoCircle weight="Bold" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="text-body leading-relaxed text-muted-700">
              <p className="font-bold text-ink">لماذا يختلف هذا عن صفحة «التحليلات»؟</p>
              <p className="mt-1">
                هنا القياس عند <strong>حافّة Cloudflare</strong>: كل طلبٍ يمرّ، بشراً كان أم
                زاحفاً. وهناك القياس من <strong>المتصفّح</strong> بمنارة JavaScript، فلا يرى
                زاحفاً لا ينفّذ النصوص، ولا طلباً ردّه الكاش قبل بلوغ خادمنا. فالرقمان لا
                يتناقضان — <strong>الفجوة بينهما تقول كم من حركتنا آلة وكم بشر</strong>.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Breakdown({
  title, icon: Icon, rows, label,
}: {
  title: string;
  icon: ComponentType<{ className?: string; weight?: "Bold" }>;
  rows: Named[];
  label?: (name: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-h3 text-ink">
        <Icon weight="Bold" className="h-5 w-5 text-primary" /> {title}
      </h3>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-body text-muted-500">لا بيانات</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-caption">
                <span className="min-w-0 truncate font-semibold text-ink">
                  {label ? label(r.name) : r.name}
                </span>
                <span className="shrink-0 tabular-nums text-muted-600">{formatNumber(r.value)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted-100">
                <div className="h-full rounded-full bg-primary"
                     style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
