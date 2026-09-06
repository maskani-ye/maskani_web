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

// ⚠️ **الوحدة في السطر الثاني لا مع الرقم.** `StatCard` يقصّ قيمته
// (`truncate`)، و«13.8 ج.ب» في بطاقةٍ من أربع أعمدة تُقصّ إلى «13.8 ج…» —
// رقمٌ بلا وحدة أسوأ من لا شيء. فالرقم قيمةً والوحدة `sub`.
const GB = (b: number) => (b / 1e9).toFixed(1);

/**
 * رقمٌ مختصر للبطاقات — «١١٧٫٨ ألف» لا «١١٧٬٧٧٩».
 *
 * ⚠️ **`StatCard` يقصّ قيمته (`truncate`)، والجوّال عمودان.** فمليونٌ كامل في
 * بطاقةٍ عرضها نصف الشاشة يخرج «…١٣٤» — رقمٌ مقصوص من يساره يقرأ كأنّه رقمٌ
 * آخر تماماً، وهو أسوأ من تقريبٍ صريح. والدقّة الكاملة تبقى في السطر الثاني.
 */
/**
 * قيمةٌ تصغُر على الجوّال.
 *
 * ⚠️ **`StatCard` يرسم قيمته بمقاس `h2` ثابتاً مع `truncate`.** وعمودان على
 * شاشة 390px يتركان للنصّ نحو مئة بكسل — فحتى «١١٧٫٨ ألف» تُقصّ. و`value`
 * يقبل `ReactNode`، فنغلّفها بمقاسٍ أصغر يكبر عند `sm` بدل تعديل المكوّن
 * المشترك الذي تستعمله اللوحة كلّها.
 */
const V = ({ children }: { children: React.ReactNode }) => (
  <span className="text-h3 sm:text-h2">{children}</span>
);

const compact = (n: number): string => {
  // ⚠️ **حرفٌ واحد للوحدة: «ك» و«م».** قِيس على البطاقة المرسومة مرّتين:
  // «١٫٢٨ مليون» احتاجت ١١٠ بكسلاً في مربّعٍ عرضه ١٠٨، ثمّ «٤٥٨٫٣ ألف» قُصّت
  // كذلك عند مدىً مخصّص. والرقم الكامل يبقى في السطر الثاني فلا تضيع دقّة —
  // ومربّع البطاقة لا يتّسع لكلمةٍ كاملة مهما قصرت.
  if (n >= 1e6) return `${formatNumber(Number((n / 1e6).toFixed(2)))} م`;
  if (n >= 1e4) return `${formatNumber(Number((n / 1e3).toFixed(1)))} ك`;
  return formatNumber(n);
};

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
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  /**
   * ⚠️ **«أمس» ليس «يوماً واحداً من اليوم».** المدى المحسوب من اليوم يشمل
   * اليوم الجاري (ناقصاً بطبيعته)، و«أمس» يومٌ مغلقٌ ينتهي أمس. فيُرسَل مدىً
   * صريحاً `since=until=أمس` لا عدد أيام — وإلّا خلط اليومين في رقمٍ واحد.
   */
  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = {};
    if (mode === "custom") {
      if (!customFrom || !customTo) { setLoading(false); return; }
      params.since = customFrom;
      params.until = customTo;
    } else if (days <= 1) {
      // «اليوم» و«أمس» يومٌ مغلقٌ واحد — يُرسَل مدىً صريحاً لا عدد أيام.
      const d = new Date(Date.now() - (days === 0 ? 864e5 : 0)).toISOString().slice(0, 10);
      params.since = d;
      params.until = d;
    } else {
      params.days = days;
    }
    try {
      const res = await api.get<Report>(endpoints.admin.trafficReport, { params });
      setData(res.data);
    } catch {
      setData({ available: false, reason: "تعذّر الوصول إلى الخادم." });
    } finally {
      setLoading(false);
    }
  }, [days, mode, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  const series = data?.series ?? [];

  return (
    // ⚠️ **الغلاف نفسه المستعمل في بقيّة اللوحة.** كانت الصفحة بلا هوامش ولا
    // حدٍّ للعرض، فتلتصق بحافّة الشاشة وتتمدّد بلا نهاية على الشاشات العريضة —
    // بينما جاراتها (التحليلات · الفهرسة) محصورة ومتنفّسة.
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <PageHeader
          icon={<Global />}
          title="حركة النطاق"
          subtitle={
            data?.available
              ? `${data.zone} · ${data.since} → ${data.until}`
              : "قياس Cloudflare عند الحافّة"
          }
        />
        {/* ⚠️ **نفس فلتر «التحليلات» حرفياً** — لا شكلٌ ثانٍ لنفس الوظيفة:
            المستخدم يتعلّم الضابط مرّة، والاختلاف بين صفحتين متجاورتين يقرأ
            كأنّهما تطبيقان. والمدد هنا 7/30/60 لا 90، لأنّ الحزمة المجانية في
            Cloudflare تحفظ نافذةً أقصر. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap rounded-xl border border-muted-200 bg-white p-1">
            {[{ d: 1, l: "اليوم" }, { d: 0, l: "أمس" }, { d: 7, l: "7 أيام" },
              { d: 30, l: "30 يوم" }, { d: 60, l: "60 يوم" }].map(({ d, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => { setMode("preset"); setDays(d); }}
                className={`rounded-lg px-3 py-1.5 text-body font-semibold transition-colors ${
                  mode === "preset" && days === d ? "bg-primary text-white" : "text-muted-500 hover:text-primary"
                }`}
              >
                {l}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-lg px-3 py-1.5 text-body font-semibold transition-colors ${
                mode === "custom" ? "bg-primary text-white" : "text-muted-500 hover:text-primary"
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
                className="h-9 rounded-xl border border-muted-200 bg-white px-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-body text-muted">إلى</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 rounded-xl border border-muted-200 bg-white px-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => load()} loading={loading}>
            <Refresh className="h-4 w-4" /> تحديث
          </Button>
        </div>
      </div>

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

          {/* ⚠️ **عمودٌ واحد على الجوّال — قياسٌ لا ذوق.** بعمودين على شاشة
              390px يبقى للنصّ داخل `StatCard` **٧١ بكسل** (بعد حشو البطاقة
              والأيقونة والفجوة)، فيُقصّ حتى «١١٧٫٨ ألف». قِسته بـ`scrollWidth`
              مقابل `clientWidth` بدل تخمين الحجم. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="المشاهدات" value={<V>{compact(t.page_views)}</V>} icon={asIcon(ChartSquare)}
                      sub={formatNumber(t.page_views)} />
            <StatCard label="الطلبات" value={<V>{compact(t.requests)}</V>} icon={asIcon(ServerSquare)}
                      sub={formatNumber(t.requests)} />
            <StatCard label="زوّار فريدون" value={<V>{compact(t.uniques)}</V>} icon={asIcon(UsersGroupTwoRounded)}
                      sub={`${formatNumber(t.uniques)} · مجموع العدّ اليوميّ`} />
            <StatCard label="تهديدات محجوبة" value={<V>{compact(t.threats)}</V>} icon={asIcon(Shield)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="الحركة" value={<V>{GB(t.bytes)}</V>} icon={asIcon(Bill)} sub="جيجابايت" />
            <StatCard label="من الكاش"
                      value={<V>{t.cache_hit_pct === null ? "—" : `${formatNumber(t.cache_hit_pct)}٪`}</V>}
                      icon={asIcon(ServerSquare)} sub="خدمته الحافّة بلا خادمنا" />
            <StatCard label="أيام مقيسة" value={<V>{formatNumber(data.actual_days ?? 0)}</V>} icon={asIcon(Global)}
                      sub={`طُلب ${formatNumber(data.requested_days ?? 0)}`} />
            <StatCard
              label="متوسّط يوميّ"
              value={<V>{compact(Math.round(t.page_views / Math.max(1, data.actual_days ?? 1)))}</V>}
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
