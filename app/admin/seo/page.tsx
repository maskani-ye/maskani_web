"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle, CloseCircle, MagniferBug, Refresh, Global, DocumentAdd,
  Magnifer, CursorSquare, Ranking, DangerTriangle, InfoCircle, ChartSquare, Link,
} from "@solar-icons/react";

// ─── Types (تطابق seo_service.build_seo_report) ─────────────────────────────
interface ReasonBucket { key: string; reason: string; count: number }
interface Coverage {
  inspected: number; indexed: number; not_indexed: number;
  sitemap_total: number; by_reason: ReasonBucket[];
}
interface SeoPage {
  url: string; coverage: string; reason_key: string; reason: string;
  indexed: boolean; last_crawl?: string | null;
}
interface SeoSitemap {
  path: string; last_downloaded?: string | null; errors: number; warnings: number;
  is_pending: boolean; submitted?: number | null; indexed?: number | null;
}
interface SeoPerf { impressions: number; clicks: number; ctr: number; position: number; days: number }
interface TrendPoint { date: string; impressions: number; clicks: number }
interface TopQuery { query: string; impressions: number; clicks: number; position: number }
interface TopPage { page: string; impressions: number; clicks: number; position: number }
interface Rec { level: "error" | "warn" | "info" | "ok"; title: string; detail: string }
interface SeoReport {
  available: boolean; site: string; error?: string;
  sitemaps: SeoSitemap[]; pages: SeoPage[]; coverage?: Coverage;
  performance: SeoPerf; trend?: TrendPoint[];
  indexed_count: number; pages_count: number;
  top_queries: TopQuery[]; top_pages?: TopPage[]; recommendations?: Rec[];
}

// ─── لون كل سبب في مخطّط التغطية ─────────────────────────────────────────────
const REASON_TONE: Record<string, string> = {
  indexed: "bg-emerald-500", crawled_not_indexed: "bg-amber-500",
  discovered_not_indexed: "bg-amber-400", alternate_canonical: "bg-slate-400",
  duplicate: "bg-slate-500", noindex: "bg-slate-300", redirect: "bg-sky-400",
  not_found: "bg-red-500", blocked: "bg-slate-600", unknown: "bg-slate-300",
  other: "bg-slate-300", error: "bg-red-300",
};

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" }) : "—";
const shortPath = (url: string) => { try { return new URL(url).pathname || "/"; } catch { return url; } };
const nf = (n: number) => (n ?? 0).toLocaleString("ar");
// رابط أداة فحص الروابط في Search Console (فحص فوري + زرّ «طلب الفهرسة»).
// resource_id = خاصية URL-prefix للموقع؛ id = الرابط المراد فحصه.
const gscInspectUrl = (url: string) =>
  `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent("https://maskani.homes/")}&id=${encodeURIComponent(url)}`;

export default function AdminSeoPage() {
  const [report, setReport] = useState<SeoReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<SeoReport>(endpoints.admin.seoReport);
      setReport(data);
      if (!data.available) setError(data.error || "تعذّر الاتصال بـ Search Console");
    } catch { setError("فشل جلب التقرير"); } finally { setLoading(false); }
  }, []);

  const resubmitSitemap = useCallback(async () => {
    setResubmitting(true); setNotice(null);
    try {
      const { data } = await api.post<{ ok: boolean; message?: string; error?: string }>(endpoints.admin.seoReport);
      setNotice({ ok: !!data.ok, text: data.ok ? (data.message || "أُعيد إرسال الـsitemap") : (data.error || "تعذّرت إعادة الإرسال") });
    } catch { setNotice({ ok: false, text: "فشلت إعادة إرسال الـsitemap" }); } finally { setResubmitting(false); }
  }, []);

  useEffect(() => { run(); }, [run]);

  const perf = report?.performance;
  const cov = report?.coverage;
  const coveragePct = cov && cov.inspected ? Math.round((cov.indexed / cov.inspected) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        icon={<MagniferBug />}
        title="الفهرسة ومحركات البحث"
        subtitle="رؤية شاملة لحالة الموقع في Google Search Console"
        actions={
          <>
            <Button onClick={resubmitSitemap} loading={resubmitting} variant="primary" size="sm">
              <DocumentAdd className="h-4 w-4" /> إعادة إرسال الخريطة
            </Button>
            <Button onClick={run} loading={loading} variant="outline" size="sm">
              <Refresh className="h-4 w-4" /> تحديث
            </Button>
          </>
        }
      />

      {notice && (
        <div className={`rounded-2xl px-4 py-3.5 text-sm flex items-start gap-2.5 ${
          notice.ok ? "bg-primary/5 text-primary border border-primary/15" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {notice.ok ? <CheckCircle weight="Bold" className="h-5 w-5 shrink-0" /> : <CloseCircle weight="Bold" className="h-5 w-5 shrink-0" />}
          <span className="leading-relaxed">{notice.text}</span>
        </div>
      )}
      {error && (
        <div className="rounded-2xl px-4 py-3.5 text-sm flex items-center gap-2.5 bg-red-50 text-red-700 border border-red-200">
          <CloseCircle weight="Bold" className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {loading && !report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Card key={i} className="h-24 animate-pulse bg-gray-50">{" "}</Card>)}
        </div>
      )}

      {report?.available && (
        <>
          {/* ── مؤشّرات رئيسية ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={<CheckCircle weight="Bold" className="h-5 w-5" />} tone="primary"
                 label="نسبة الفهرسة" value={`${coveragePct}%`}
                 hint={`${nf(cov?.indexed ?? report.indexed_count)} من ${nf(cov?.inspected ?? report.pages_count)} مفحوصة`} />
            <Kpi icon={<Magnifer weight="Bold" className="h-5 w-5" />} tone="gold"
                 label="مرّات الظهور" value={nf(perf?.impressions ?? 0)} hint={`آخر ${perf?.days ?? 30} يوماً`} />
            <Kpi icon={<CursorSquare weight="Bold" className="h-5 w-5" />} tone="gray"
                 label="النقرات" value={nf(perf?.clicks ?? 0)}
                 hint={perf?.ctr ? `CTR ${(perf.ctr * 100).toFixed(1)}%` : undefined} />
            <Kpi icon={<Ranking weight="Bold" className="h-5 w-5" />} tone="gray"
                 label="متوسط الترتيب" value={perf?.position ? perf.position.toFixed(1) : "—"} />
          </div>

          {/* ── التغطية حسب السبب + الاتجاه ── */}
          <div className="grid lg:grid-cols-5 gap-6">
            <Card className="p-6 lg:col-span-3">
              <SectionHeader icon={<ChartSquare className="h-5 w-5" />} title="تغطية الفهرسة حسب السبب"
                             subtitle={`عيّنة ${nf(cov?.inspected ?? 0)} رابط من أصل ${nf(cov?.sitemap_total ?? 0)} في الخريطة`} />
              <div className="mt-4 space-y-3">
                {(cov?.by_reason ?? []).length === 0 && <p className="text-sm text-gray-500">لا بيانات تغطية بعد.</p>}
                {(cov?.by_reason ?? []).map((b) => {
                  const total = cov?.inspected || 1;
                  const pct = Math.round((b.count / total) * 100);
                  return (
                    <div key={b.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${REASON_TONE[b.key] ?? "bg-slate-300"}`} />
                          {b.reason}
                        </span>
                        <span className="text-gray-400 tabular-nums">{nf(b.count)} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${REASON_TONE[b.key] ?? "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <SectionHeader icon={<ChartSquare className="h-5 w-5" />} title="اتجاه الأداء"
                             subtitle={`الظهور والنقرات — آخر ${perf?.days ?? 30} يوماً`} />
              <Sparkline trend={report.trend ?? []} />
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> الظهور</span>
                <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-gold" /> النقرات</span>
              </div>
            </Card>
          </div>

          {/* ── التوصيات ── */}
          {(report.recommendations ?? []).length > 0 && (
            <Card className="p-6">
              <SectionHeader icon={<InfoCircle className="h-5 w-5" />} title="توصيات لتحسين الفهرسة"
                             subtitle="إجراءات مقترحة مبنية على بيانات التقرير" />
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {report.recommendations!.map((r, i) => <RecCard key={i} rec={r} />)}
              </div>
            </Card>
          )}

          {/* ── أعلى الصفحات + أعلى الاستعلامات ── */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <SectionHeader icon={<Link className="h-5 w-5" />} title="أعلى الصفحات ظهوراً" subtitle="الصفحات الأكثر ظهوراً في البحث" />
              <RankedList rows={(report.top_pages ?? []).map((p) => ({
                label: shortPath(p.page), impressions: p.impressions, clicks: p.clicks, position: p.position }))} />
            </Card>
            <Card className="p-6">
              <SectionHeader icon={<Magnifer className="h-5 w-5" />} title="أعلى كلمات البحث" subtitle="الكلمات التي يظهر بها موقعك" />
              <RankedList rows={report.top_queries.map((q) => ({
                label: q.query, impressions: q.impressions, clicks: q.clicks, position: q.position }))} />
            </Card>
          </div>

          {/* ── تفصيل فحص الروابط ── */}
          <Card className="p-6">
            <SectionHeader icon={<Global className="h-5 w-5" />} title="تفاصيل فحص الروابط"
                           subtitle={`حالة الفهرسة لكل رابط مفحوص (${nf(report.pages.length)})`} />
            <div className="mt-4 divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
              {report.pages.map((p) => (
                <div key={p.url} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    p.indexed ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                    {p.indexed ? <CheckCircle weight="Bold" className="h-5 w-5" /> : <CloseCircle weight="Bold" className="h-5 w-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate" dir="ltr">{shortPath(p.url)}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${REASON_TONE[p.reason_key] ?? "bg-slate-300"}`} />
                      {p.reason} · {fmtDate(p.last_crawl)}
                    </p>
                  </div>
                  {/* رابط مباشر لأداة فحص الروابط في Search Console — للفحص/طلب الفهرسة يدويًا. */}
                  <a href={gscInspectUrl(p.url)} target="_blank" rel="noopener noreferrer"
                     title="افحص واطلب الفهرسة في Search Console"
                     className="shrink-0 text-gray-300 hover:text-primary transition-colors">
                    <Global className="h-4 w-4" />
                  </a>
                  <Badge variant={p.indexed ? "success" : "default"}>{p.indexed ? "مُفهرَسة" : "غير مُفهرَسة"}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* ── خرائط الموقع ── */}
          <Card className="p-6">
            <SectionHeader icon={<DocumentAdd className="h-5 w-5" />} title="خرائط الموقع" subtitle="آخر قراءة من Google لملف الـsitemap" />
            <div className="mt-4 space-y-4">
              {report.sitemaps.length === 0 && <p className="text-sm text-gray-500">لا sitemap مُرسَل بعد.</p>}
              {report.sitemaps.map((m) => (
                <div key={m.path} className="rounded-xl border border-gray-100 p-4">
                  <p className="font-semibold text-gray-800 flex items-center gap-2 mb-3" dir="ltr">
                    <Global className="h-4 w-4 text-gray-400 shrink-0" /><span className="truncate">{m.path}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.errors ? "danger" : "success"}>أخطاء: {m.errors}</Badge>
                    <Badge variant={m.warnings ? "warning" : "default"}>تحذيرات: {m.warnings}</Badge>
                    <Badge variant="info">روابط مُرسَلة: {m.submitted ?? "—"}</Badge>
                    {m.is_pending && <Badge variant="warning">قيد المعالجة</Badge>}
                    <span className="text-xs text-gray-400 ms-auto">آخر قراءة: {fmtDate(m.last_downloaded)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Sparkline (SVG، بلا مكتبات) ─────────────────────────────────────────────
function Sparkline({ trend }: { trend: TrendPoint[] }) {
  if (!trend.length) return <div className="h-24 mt-4 flex items-center justify-center text-xs text-gray-400">لا بيانات كافية بعد</div>;
  const W = 300, H = 90, pad = 4;
  const line = (key: "impressions" | "clicks") => {
    const max = Math.max(1, ...trend.map((t) => t[key]));
    return trend.map((t, i) => {
      const x = pad + (i / Math.max(1, trend.length - 1)) * (W - pad * 2);
      const y = H - pad - (t[key] / max) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24 mt-4" preserveAspectRatio="none">
      <polyline points={line("impressions")} fill="none" stroke="var(--primary,#4F2396)" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={line("clicks")} fill="none" stroke="#FFC107" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function RankedList({ rows }: { rows: { label: string; impressions: number; clicks: number; position: number }[] }) {
  if (!rows.length) return <p className="mt-4 text-sm text-gray-500">لا بيانات بعد.</p>;
  const max = Math.max(1, ...rows.map((r) => r.impressions));
  return (
    <div className="mt-4 space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-center justify-between gap-3 text-sm mb-1">
            <span className="font-medium text-gray-800 truncate" dir="auto">{r.label}</span>
            <span className="text-xs text-gray-400 tabular-nums shrink-0">ظهور {nf(r.impressions)} · نقر {nf(r.clicks)} · #{r.position}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.round((r.impressions / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecCard({ rec }: { rec: Rec }) {
  const tone = {
    error: { box: "bg-red-50 border-red-200", icon: "text-red-600", Icon: DangerTriangle },
    warn: { box: "bg-amber-50 border-amber-200", icon: "text-amber-600", Icon: DangerTriangle },
    info: { box: "bg-sky-50 border-sky-200", icon: "text-sky-600", Icon: InfoCircle },
    ok: { box: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600", Icon: CheckCircle },
  }[rec.level];
  const Icon = tone.Icon;
  return (
    <div className={`rounded-xl border p-4 ${tone.box}`}>
      <div className="flex items-start gap-2.5">
        <Icon weight="Bold" className={`h-5 w-5 shrink-0 ${tone.icon}`} />
        <div>
          <p className="text-sm font-bold text-gray-800">{rec.title}</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.detail}</p>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, hint, tone }: {
  icon: React.ReactNode; label: string; value: string; hint?: string; tone: "primary" | "gold" | "gray";
}) {
  const toneCls = { primary: "bg-primary/10 text-primary", gold: "bg-gold/15 text-gold", gray: "bg-gray-100 text-gray-500" }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2.5">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneCls}`}>{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </Card>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</span>
      <div>
        <h2 className="font-bold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
