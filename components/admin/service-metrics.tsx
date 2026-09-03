"use client";

// ─── طقم مقاييس الخدمات ─────────────────────────────────────────────────────
// لبنات مشتركة لصفحات «البنية والخدمات»: مقياس نسبة بعتبات لونية، سلسلة زمنية،
// شبكة أرقام، وشارات حالة. الهدف أن تُبنى صفحة كل خدمة من هذه اللبنات فتتشابه
// لغة العرض وتختلف المحتويات.

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChartCard } from "@/components/ui/ChartCard";
import { cn, NUMERIC_LOCALE } from "@/lib/utils";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";

/* ── تنسيقات ───────────────────────────────────────────────────────────── */

export function formatBytes(bytes?: number | null): string {
  if (bytes == null) return "—";
  const units = ["بايت", "ك.ب", "م.ب", "ج.ب", "ت.ب"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatNumber(n?: number | null): string {
  return n == null ? "—" : n.toLocaleString(NUMERIC_LOCALE, { maximumFractionDigits: 2 });
}

/** «قبل ٣ ساعات» — الأعمار أنفع من الطوابع الزمنية في لوحة مراقبة. */
export function timeAgo(iso?: string | number | null): string {
  if (iso == null) return "—";
  const then = typeof iso === "number" ? iso : Date.parse(iso);
  if (Number.isNaN(then)) return "—";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.round(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  return `قبل ${Math.round(days / 30)} شهر`;
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)} ثانية`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m} د ${s} ث` : `${m} دقيقة`;
}

/* ── مقياس نسبة ────────────────────────────────────────────────────────── */

/** لون العتبة: أخضر مريح، كهرماني تحذير، أحمر ضغط. القيم افتراضية تناسب
 *  استهلاك موارد (قرص/ذاكرة/اتصالات) ويمكن قلبها بـ`invert` لمقاييس «كلما زاد
 *  كان أفضل» مثل نسبة إصابة الكاش. */
function levelColor(pct: number, warn: number, danger: number, invert: boolean) {
  const bad = invert ? pct <= danger : pct >= danger;
  const warning = invert ? pct <= warn : pct >= warn;
  if (bad) return { bar: "bg-red-500", text: "text-red-600" };
  if (warning) return { bar: "bg-gold", text: "text-amber-600" };
  return { bar: "bg-emerald-500", text: "text-emerald-600" };
}

export function Gauge({
  label,
  pct,
  caption,
  warn = 70,
  danger = 90,
  invert = false,
}: {
  label: string;
  pct?: number | null;
  caption?: ReactNode;
  warn?: number;
  danger?: number;
  invert?: boolean;
}) {
  const value = pct ?? 0;
  const c = levelColor(value, warn, danger, invert);
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-body font-medium text-muted-500">{label}</p>
        <p className={cn("text-h3 font-extrabold tabular-nums", c.text)}>
          {pct == null ? "—" : `${value.toFixed(1)}%`}
        </p>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-muted-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", c.bar)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {caption && <p className="mt-2 text-caption text-muted">{caption}</p>}
    </Card>
  );
}

/* ── رقم مفرد ──────────────────────────────────────────────────────────── */

export function Metric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    default: "text-ink",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-red-600",
  }[tone];
  return (
    <Card className="p-4">
      <p className="text-body font-medium text-muted-500">{label}</p>
      <p className={cn("mt-1 text-h2 font-extrabold truncate tabular-nums", toneClass)}>
        {value ?? "—"}
      </p>
      {sub && <p className="mt-1 text-caption text-muted">{sub}</p>}
    </Card>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>;
}

/* ── سلسلة زمنية ───────────────────────────────────────────────────────── */

export interface SeriesPoint {
  t?: string;
  date?: string;
  v?: number;
  count?: number;
}

/** رسم مساحي لسلسلة نقاط. يقبل شكلَي النقطة القادمَين من الخادم:
 *  `{t,v}` (مقاييس البنية) و`{date,count}` (تجميعات قاعدتنا). */
export function Series({
  title,
  subtitle,
  points,
  unit,
  color = "#403B9B",
  height = 200,
}: {
  title: string;
  subtitle?: string;
  points?: SeriesPoint[] | null;
  unit?: string;
  color?: string;
  height?: number;
}) {
  const data = (points ?? []).map((p) => ({
    x: p.t ?? p.date ?? "",
    y: p.v ?? p.count ?? 0,
  }));
  const short = (x: string) =>
    x.length > 10 && x.includes("T")
      ? x.slice(11, 16)
      : x.slice(5, 10);
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={data.length === 0}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis dataKey="x" tickFormatter={short} tick={{ fontSize: 11, fill: "#9ca3af" }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} width={44} />
        <Tooltip
          labelFormatter={(x) => String(x).replace("T", " ").slice(0, 16)}
          formatter={(v) => [`${formatNumber(Number(v))}${unit ? ` ${unit}` : ""}`, title]}
        />
        <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={`url(#g-${title})`} />
      </AreaChart>
    </ChartCard>
  );
}

/* ── جدول بسيط ─────────────────────────────────────────────────────────── */

export interface Col<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="font-bold text-ink">{title}</p>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function Table<T>({ cols, rows }: { cols: Col<T>[]; rows: T[] }) {
  if (!rows.length) return <p className="text-body text-muted">لا توجد بيانات.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body">
        <thead>
          <tr className="text-muted text-caption">
            {cols.map((c) => (
              <th key={c.key} className="text-right font-normal pb-2 px-2 whitespace-nowrap">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-muted-100">
              {cols.map((c) => (
                <td key={c.key} className="py-2 px-2 text-muted-700 whitespace-nowrap">
                  {c.render
                    ? c.render(r)
                    : ((r as Record<string, unknown>)[c.key] as ReactNode) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── شارات ─────────────────────────────────────────────────────────────── */

/** حالة نصّية → شارة ملوّنة. تعرف مفردات المزوّدين (RUNNING/READY/success…). */
export function StatePill({ state }: { state?: string | null }) {
  if (!state) return <span className="text-muted">—</span>;
  const s = state.toLowerCase();
  const good = ["running", "ready", "success", "active", "completed", "available"];
  const bad = ["error", "failure", "stopped", "terminated", "cancelled", "failed"];
  const variant = good.includes(s) ? "success" : bad.includes(s) ? "danger" : "default";
  return <Badge variant={variant}>{state}</Badge>;
}

/** ملاحظة صريحة عمّا لا يوفّره المزوّد — أصدق من عرض صفر بلا تفسير. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption text-muted leading-relaxed bg-muted-50 rounded-xl p-3">{children}</p>
  );
}
