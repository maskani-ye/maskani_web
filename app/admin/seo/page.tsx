"use client";

import { useState, useEffect, useCallback } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/digits";
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
interface Opportunity { query: string; page: string; impressions: number; clicks: number; position: number }
interface Bleeding {
  page: string; impressions: number; clicks: number;
  ctr: number; expected_ctr: number; position: number; lost_clicks: number;
}
interface Prev { impressions: number; clicks: number; ctr: number; position: number }
interface CountryRow { country: string; impressions: number; clicks: number; position: number }
interface DeviceRow { device: string; impressions: number; clicks: number; position: number }
interface SeoReport {
  available: boolean; site: string; error?: string;
  sitemaps: SeoSitemap[]; pages: SeoPage[]; coverage?: Coverage;
  performance: SeoPerf; trend?: TrendPoint[];
  indexed_count: number; pages_count: number;
  top_queries: TopQuery[]; top_pages?: TopPage[]; recommendations?: Rec[];
  opportunities?: Opportunity[]; ctr_bleeding?: Bleeding[]; previous?: Prev;
  reach?: { queries_count: number; pages_with_impressions: number; zero_click_queries: number; branded_impressions: number };
  zero_click?: { query: string; impressions: number; position: number }[];
  countries?: CountryRow[]; devices?: DeviceRow[];
}

//: أسماء الدول بالعربية — GSC يعيد رمز ISO ثلاثيّاً.
const COUNTRY_AR: Record<string, string> = {
  yem: "اليمن", sau: "السعودية", egy: "مصر", jor: "الأردن", irq: "العراق",
  are: "الإمارات", kwt: "الكويت", qat: "قطر", omn: "عُمان", bhr: "البحرين",
  mar: "المغرب", tun: "تونس", dza: "الجزائر", lby: "ليبيا", sdn: "السودان",
  syr: "سوريا", lbn: "لبنان", pse: "فلسطين", tur: "تركيا", usa: "أمريكا",
  gbr: "بريطانيا", deu: "ألمانيا", mys: "ماليزيا", idn: "إندونيسيا",
};
const DEVICE_AR: Record<string, string> = { MOBILE: "جوّال", DESKTOP: "حاسوب", TABLET: "لوحيّ" };

// ─── لون كل سبب في مخطّط التغطية ─────────────────────────────────────────────
const REASON_TONE: Record<string, string> = {
  indexed: "bg-emerald-500", crawled_not_indexed: "bg-amber-500",
  discovered_not_indexed: "bg-amber-400", alternate_canonical: "bg-slate-400",
  duplicate: "bg-slate-500", noindex: "bg-slate-300", redirect: "bg-sky-400",
  not_found: "bg-red-500", blocked: "bg-slate-600", unknown: "bg-slate-300",
  other: "bg-slate-300", error: "bg-red-300",
};

//: ماذا يعني كل سبب، وما العمل — لوحةٌ تعرض مصطلحات جوجل بلا ترجمتها إلى
//: إجراء تترك المشرف يقرأ ولا يعرف ماذا يفعل.
const REASON_MEANING: Record<string, string> = {
  indexed: "الصفحة في فهرس جوجل وقابلة للظهور في النتائج — لا إجراء مطلوب.",
  crawled_not_indexed: "زارها جوجل ورفض فهرستها: محتوى رقيق أو مكرّر. أضِف محتوى فريداً ثم اطلب الفهرسة.",
  discovered_not_indexed: "يعرف الرابط ولم يزره بعد: غالباً ضعف الروابط الداخلية أو ميزانية زحف مستهلَكة. اربطها من صفحات قوية.",
  alternate_canonical: "جوجل اختار نسخة أخرى كأصل. تحقّق من وسم canonical والتكرار بين المسارات.",
  duplicate: "محتواها يطابق صفحة أخرى — ادمجها أو ميّزها بمحتوى مختلف.",
  noindex: "ممنوعة الفهرسة بقرارٍ منّا (وسم robots). تأكّد أن المنع مقصود.",
  redirect: "تحوّل إلى رابط آخر — تأكّد أن الوجهة صحيحة ونهائية.",
  not_found: "ترجع 404 وهي في خريطة الموقع — أزِلها من الخريطة أو أعِد إحياء الصفحة.",
  blocked: "محجوبة بـrobots.txt — إن كان الحجب غير مقصود فأزِله.",
  unknown: "لم يُصنّفها جوجل بعد.",
  other: "حالة غير مصنّفة.",
};

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString(NUMERIC_LOCALE, { dateStyle: "medium", timeStyle: "short" }) : "—";
const shortPath = (url: string) => { try { return new URL(url).pathname || "/"; } catch { return url; } };
const nf = (n: number) => (n ?? 0).toLocaleString(NUMERIC_LOCALE);
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
  //: فلترة قائمة الفحص — 157 رابطاً بلا فلتر تعني تمريراً بلا هدف.
  const [pageFilter, setPageFilter] = useState<"all" | "indexed" | "missing">("all");
  const [pageSearch, setPageSearch] = useState("");

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
  const prev = report?.previous;
  const cov = report?.coverage;
  /** فرق النسبة عن الفترة السابقة — null حين لا مرجع (أول فترة). */
  const delta = (now?: number, before?: number) =>
    before && before > 0 && now != null ? Math.round(((now - before) / before) * 100) : null;
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
        <div className={`rounded-2xl px-4 py-3.5 text-body flex items-start gap-2.5 ${
          notice.ok ? "bg-primary/5 text-primary border border-primary/15" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {notice.ok ? <CheckCircle weight="Bold" className="h-5 w-5 shrink-0" /> : <CloseCircle weight="Bold" className="h-5 w-5 shrink-0" />}
          <span className="leading-relaxed">{notice.text}</span>
        </div>
      )}
      {error && (
        <div className="rounded-2xl px-4 py-3.5 text-body flex items-center gap-2.5 bg-red-50 text-red-700 border border-red-200">
          <CloseCircle weight="Bold" className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {loading && !report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Card key={i} className="h-24 animate-pulse bg-muted-50">{" "}</Card>)}
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
                 label="مرّات الظهور" value={nf(perf?.impressions ?? 0)} hint={`آخر ${perf?.days ?? 30} يوماً`}
                 delta={delta(perf?.impressions, prev?.impressions)} />
            <Kpi icon={<CursorSquare weight="Bold" className="h-5 w-5" />} tone="gray"
                 label="النقرات" value={nf(perf?.clicks ?? 0)}
                 hint={perf?.ctr ? `CTR ${(perf.ctr * 100).toFixed(2)}%` : undefined}
                 delta={delta(perf?.clicks, prev?.clicks)} />
            <Kpi icon={<Ranking weight="Bold" className="h-5 w-5" />} tone="gray"
                 label="متوسط الترتيب" value={perf?.position ? perf.position.toFixed(1) : "—"}
                 // الترتيب يتحسّن بالنقصان — نعكس الإشارة كي يبقى الأخضر «تحسّن».
                 delta={prev?.position && perf?.position ? Math.round(((prev.position - perf.position) / prev.position) * 100) : null} />
          </div>

          {/* ── اتّساع الظهور: كم كلمة وكم صفحة، وكم منها بلا نقرة ── */}
          {report.reach && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MiniStat label="كلمات ظهرنا بها" value={nf(report.reach.queries_count)}
                        hint={`${nf(report.reach.zero_click_queries)} منها بلا نقرة واحدة`} />
              <MiniStat label="صفحات ظهرت في البحث" value={nf(report.reach.pages_with_impressions)}
                        hint={`من ${nf(cov?.sitemap_total ?? 0)} في خريطة الموقع`} />
              <MiniStat label="ظهور باسم العلامة" value={nf(report.reach.branded_impressions)}
                        hint={perf?.impressions ? `${Math.round((report.reach.branded_impressions / perf.impressions) * 100)}% من الإجمالي — الباقي اكتشافٌ جديد` : undefined} />
              <MiniStat label="روابط الخريطة" value={nf(cov?.sitemap_total ?? 0)}
                        hint={`فُحصت عيّنة ${nf(cov?.inspected ?? 0)}`} />
            </div>
          )}

          {/* ── التغطية حسب السبب + الاتجاه ── */}
          <div className="grid lg:grid-cols-5 gap-6">
            <Card className="p-6 lg:col-span-3">
              <SectionHeader icon={<ChartSquare className="h-5 w-5" />} title="تغطية الفهرسة حسب السبب"
                             subtitle={`عيّنة ${nf(cov?.inspected ?? 0)} رابط من أصل ${nf(cov?.sitemap_total ?? 0)} في الخريطة`} />
              <div className="mt-4 space-y-3">
                {(cov?.by_reason ?? []).length === 0 && <p className="text-body text-muted-500">لا بيانات تغطية بعد.</p>}
                {(cov?.by_reason ?? []).map((b) => {
                  const total = cov?.inspected || 1;
                  const pct = Math.round((b.count / total) * 100);
                  return (
                    <div key={b.key}>
                      <div className="flex items-center justify-between text-body mb-1">
                        <span className="text-muted-700 flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${REASON_TONE[b.key] ?? "bg-slate-300"}`} />
                          {b.reason}
                        </span>
                        <span className="text-muted tabular-nums">{nf(b.count)} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted-100 overflow-hidden">
                        <div className={`h-full rounded-full ${REASON_TONE[b.key] ?? "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                      </div>
                      {REASON_MEANING[b.key] && (
                        <p className="text-[11px] text-muted mt-1 leading-relaxed">{REASON_MEANING[b.key]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <SectionHeader icon={<ChartSquare className="h-5 w-5" />} title="اتجاه الأداء"
                             subtitle={`الظهور والنقرات — آخر ${perf?.days ?? 30} يوماً`} />
              <Sparkline trend={report.trend ?? []} />
              <div className="flex items-center gap-4 mt-3 text-caption">
                <span className="flex items-center gap-1.5 text-muted-500"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> الظهور</span>
                <span className="flex items-center gap-1.5 text-muted-500"><span className="w-2.5 h-2.5 rounded-full bg-gold" /> النقرات</span>
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
              <RankedList
                rows={(report.top_pages ?? []).map((p) => ({
                  label: shortPath(p.page), impressions: p.impressions, clicks: p.clicks, position: p.position }))}
                hrefOf={(path) => `https://maskani.homes${path === "/" ? "" : path}`} />
            </Card>
            <Card className="p-6">
              <SectionHeader icon={<Magnifer className="h-5 w-5" />} title="أعلى كلمات البحث" subtitle="الكلمات التي يظهر بها موقعك" />
              <RankedList
                rows={report.top_queries.map((q) => ({
                  label: q.query, impressions: q.impressions, clicks: q.clicks, position: q.position }))}
                hrefOf={(q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`} />
            </Card>
          </div>


          {/* ── فرص قريبة: كلمات على بُعد خطوة من الصدارة ── */}
          {(report.opportunities ?? []).length > 0 && (
            <Card className="p-6">
              <SectionHeader icon={<Ranking className="h-5 w-5" />} title="فرص قريبة"
                             subtitle="كلمات ترتيبك فيها 4–20: دفعة صغيرة تنقلها إلى الثلاثة الأوائل حيث النقرات" />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full max-w-full text-body">
                  <thead>
                    <tr className="text-caption text-muted text-right">
                      <th className="pb-2 font-medium">الكلمة</th>
                      <th className="pb-2 font-medium">الصفحة</th>
                      <th className="pb-2 font-medium text-center">الترتيب</th>
                      <th className="pb-2 font-medium text-center">ظهور</th>
                      <th className="pb-2 font-medium text-center">نقرات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted-100">
                    {report.opportunities!.map((o) => (
                      <tr key={`${o.query}-${o.page}`} className="text-muted-700">
                        <td className="py-2.5 font-semibold">{o.query}</td>
                        <td className="py-2.5 text-muted text-caption" dir="ltr">
                          <a href={o.page} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                            {shortPath(o.page)}
                          </a>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-caption font-bold rounded-lg px-2 py-1 ${
                            o.position <= 10 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {o.position}
                          </span>
                        </td>
                        <td className="py-2.5 text-center tabular-nums">{nf(o.impressions)}</td>
                        <td className="py-2.5 text-center tabular-nums text-muted">{nf(o.clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── كلمات تظهر بلا نقرة واحدة ── */}
          {(report.zero_click ?? []).length > 0 && (
            <Card className="p-6">
              <SectionHeader icon={<CloseCircle className="h-5 w-5" />} title="كلمات تظهر بلا نقرة واحدة"
                             subtitle="ظهرنا فيها ولم ينقر أحد — إمّا الترتيب متأخّر أو العنوان لا يعد بشيء" />
              <div className="mt-4 flex flex-wrap gap-2">
                {report.zero_click!.map((z) => (
                  <a key={z.query} href={`https://www.google.com/search?q=${encodeURIComponent(z.query)}`}
                     target="_blank" rel="noopener noreferrer"
                     className="rounded-xl border border-muted-200 bg-white px-3 py-2 text-body text-muted-700 hover:border-primary hover:text-primary transition-colors">
                    {z.query}
                    <span className="text-[11px] text-muted ms-2 tabular-nums">{nf(z.impressions)} ظهور · #{z.position}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* ── نزيف النقرات: ترتيب جيّد ونقرات دون المتوقّع ── */}
          {(report.ctr_bleeding ?? []).length > 0 && (
            <Card className="p-6">
              <SectionHeader icon={<DangerTriangle className="h-5 w-5" />} title="صفحات تنزف نقرات"
                             subtitle="ترتيبها جيّد لكن نقرها أقل بكثير من المتوقّع من موضعها — عيبُ عنوان ووصف لا عيبُ ترتيب" />
              <div className="mt-4 space-y-3">
                {report.ctr_bleeding!.map((b) => (
                  <div key={b.page} className="rounded-xl border border-muted-100 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <a href={b.page} target="_blank" rel="noopener noreferrer"
                         className="text-body font-semibold text-ink hover:text-primary truncate" dir="ltr">
                        {shortPath(b.page)}
                      </a>
                      <span className="text-caption font-bold text-red-600 bg-red-50 rounded-lg px-2 py-1 shrink-0">
                        ~{nf(b.lost_clicks)} نقرة ضائعة
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-500">
                      <span>الترتيب <strong className="text-muted-700">{b.position}</strong></span>
                      <span>الظهور <strong className="text-muted-700">{nf(b.impressions)}</strong></span>
                      <span>
                        النقر الفعليّ <strong className="text-red-600">{(b.ctr * 100).toFixed(2)}%</strong>
                        {" "}مقابل متوقّع <strong className="text-muted-700">{(b.expected_ctr * 100).toFixed(1)}%</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-caption text-muted mt-4 leading-relaxed">
                العلاج: أعِد صياغة عنوان الصفحة ووصفها ليقولا للباحث ما يجده بالداخل — أرخص تحسين
                في السيو وأسرعه أثراً، ولا يحتاج تغيير ترتيب.
              </p>
            </Card>
          )}

          {/* ── الجمهور: الدول والأجهزة ── */}
          {((report.countries ?? []).length > 0 || (report.devices ?? []).length > 0) && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <SectionHeader icon={<Global className="h-5 w-5" />} title="من أين يأتي الظهور؟"
                               subtitle="توزّع مرّات الظهور حسب الدولة" />
                <div className="mt-4 space-y-3">
                  {(report.countries ?? []).map((c) => {
                    const max = Math.max(1, ...(report.countries ?? []).map((x) => x.impressions));
                    return (
                      <div key={c.country}>
                        <div className="flex items-center justify-between text-body mb-1">
                          <span className="text-muted-700">{COUNTRY_AR[c.country] ?? c.country}</span>
                          <span className="text-muted text-caption tabular-nums">
                            {nf(c.impressions)} ظهور · ترتيب {c.position}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted-100 overflow-hidden">
                          <div className="h-full rounded-full bg-primary"
                               style={{ width: `${Math.round((c.impressions / max) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <SectionHeader icon={<ChartSquare className="h-5 w-5" />} title="الأجهزة"
                               subtitle="يحدّد أين تُصرف جهود الأداء والتصميم" />
                <div className="mt-4 space-y-3">
                  {(report.devices ?? []).map((d) => {
                    const total = Math.max(1, (report.devices ?? []).reduce((s, x) => s + x.impressions, 0));
                    const pct = Math.round((d.impressions / total) * 100);
                    return (
                      <div key={d.device}>
                        <div className="flex items-center justify-between text-body mb-1">
                          <span className="text-muted-700">{DEVICE_AR[d.device] ?? d.device}</span>
                          <span className="text-muted text-caption tabular-nums">
                            {pct}% · {nf(d.impressions)} ظهور
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ── تفصيل فحص الروابط ── */}
          <Card className="p-6">
            <SectionHeader icon={<Global className="h-5 w-5" />} title="تفاصيل فحص الروابط"
                           subtitle={`حالة الفهرسة لكل رابط مفحوص (${nf(report.pages.length)})`} />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {([
                { k: "all", label: `الكل (${report.pages.length})` },
                { k: "indexed", label: `مُفهرَسة (${report.pages.filter((x) => x.indexed).length})` },
                { k: "missing", label: `غير مُفهرَسة (${report.pages.filter((x) => !x.indexed).length})` },
              ] as const).map((tab) => (
                <button key={tab.k} type="button" onClick={() => setPageFilter(tab.k)}
                  className={`text-caption rounded-xl px-3 py-1.5 font-semibold transition-colors ${
                    pageFilter === tab.k ? "bg-primary text-white" : "bg-muted-100 text-muted-600 hover:bg-muted-200"}`}>
                  {tab.label}
                </button>
              ))}
              <input value={pageSearch} onChange={(e) => setPageSearch(toEnglishDigits(e.target.value))}
                placeholder="ابحث في المسارات…" dir="ltr"
                className="ms-auto w-full sm:w-52 rounded-xl border border-muted-200 px-3 py-1.5 text-caption outline-none focus:border-primary" />
            </div>
            <div className="mt-3 divide-y divide-muted-100 max-h-[420px] overflow-y-auto">
              {report.pages
                .filter((p) => pageFilter === "all" || (pageFilter === "indexed" ? p.indexed : !p.indexed))
                .filter((p) => !pageSearch || shortPath(p.url).includes(pageSearch))
                .map((p) => (
                <div key={p.url} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    p.indexed ? "bg-emerald-50 text-emerald-600" : "bg-muted-100 text-muted"}`}>
                    {p.indexed ? <CheckCircle weight="Bold" className="h-5 w-5" /> : <CloseCircle weight="Bold" className="h-5 w-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-ink truncate" dir="ltr">{shortPath(p.url)}</p>
                    <p className="text-caption text-muted mt-0.5 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${REASON_TONE[p.reason_key] ?? "bg-slate-300"}`} />
                      {p.reason} · {fmtDate(p.last_crawl)}
                    </p>
                  </div>
                  {/* رابط مباشر لأداة فحص الروابط في Search Console — للفحص/طلب الفهرسة يدويًا. */}
                  <a href={gscInspectUrl(p.url)} target="_blank" rel="noopener noreferrer"
                     title="افحص واطلب الفهرسة في Search Console"
                     className="shrink-0 text-muted-200 hover:text-primary transition-colors">
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
              {report.sitemaps.length === 0 && <p className="text-body text-muted-500">لا sitemap مُرسَل بعد.</p>}
              {report.sitemaps.map((m) => (
                <div key={m.path} className="rounded-xl border border-muted-100 p-4">
                  <p className="font-semibold text-ink flex items-center gap-2 mb-3" dir="ltr">
                    <Global className="h-4 w-4 text-muted shrink-0" /><span className="truncate">{m.path}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.errors ? "danger" : "success"}>أخطاء: {m.errors}</Badge>
                    <Badge variant={m.warnings ? "warning" : "default"}>تحذيرات: {m.warnings}</Badge>
                    <Badge variant="info">روابط مُرسَلة: {m.submitted ?? "—"}</Badge>
                    {m.is_pending && <Badge variant="warning">قيد المعالجة</Badge>}
                    {(() => {
                      // قِدَم آخر قراءة مؤشّر صحّة: خريطةٌ لم تُقرأ منذ أسبوع تعني
                      // أن جوجل خفّض اهتمامه بالموقع أو أن الملف تعطّل.
                      const days = m.last_downloaded
                        ? Math.floor((Date.now() - new Date(m.last_downloaded).getTime()) / 86400000)
                        : null;
                      if (days == null) return null;
                      return (
                        <Badge variant={days > 7 ? "warning" : "success"}>
                          قُرئت {days === 0 ? "اليوم" : `قبل ${days} يوماً`}
                        </Badge>
                      );
                    })()}
                    <span className="text-caption text-muted ms-auto">آخر قراءة: {fmtDate(m.last_downloaded)}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-2.5 leading-relaxed">
                    عدّاد «مُفهرَسة» في هذا الجدول يُبقيه جوجل صفراً غالباً ولا يعني أن صفحاتك
                    غير مفهرسة — المرجع الصحيح هو بطاقة «تغطية الفهرسة» أعلاه المبنيّة على فحص
                    كل رابط على حدة.
                  </p>
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
  if (!trend.length) return <div className="h-24 mt-4 flex items-center justify-center text-caption text-muted">لا بيانات كافية بعد</div>;
  const W = 300, H = 90, pad = 4;
  const line = (key: "impressions" | "clicks") => {
    const max = Math.max(1, ...trend.map((t) => t[key]));
    return trend.map((t, i) => {
      const x = pad + (i * (W - pad * 2)) / Math.max(1, trend.length - 1);
      const y = H - pad - (t[key] / max) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };
  // قراءات تُغني الرسم: أفضل يوم، ومتوسّط الأسبوع الأخير مقابل ما قبله — الخطّ
  // وحده يُري الشكل ولا يُعطي رقماً يُقارَن.
  const best = trend.reduce((a, b) => (b.impressions > a.impressions ? b : a), trend[0]);
  const avg = (arr: TrendPoint[]) =>
    arr.length ? Math.round(arr.reduce((s, x) => s + x.impressions, 0) / arr.length) : 0;
  const last7 = avg(trend.slice(-7));
  const prev7 = avg(trend.slice(-14, -7));
  const trendPct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;
  const dayFmt = (s: string) => new Date(s).toLocaleDateString("ar", { day: "numeric", month: "short" });

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24 mt-4" preserveAspectRatio="none">
        <polyline points={line("impressions")} fill="none" stroke="var(--primary,#171539)" strokeWidth="2" strokeLinejoin="round" />
        <polyline points={line("clicks")} fill="none" stroke="#FFC107" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center justify-between text-[10px] text-muted-200 mt-1 tabular-nums">
        <span>{dayFmt(trend[0].date)}</span>
        <span>{dayFmt(trend[trend.length - 1].date)}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-caption">
        <div className="rounded-xl bg-muted-50 px-3 py-2">
          <p className="text-muted text-[11px]">أفضل يوم</p>
          <p className="font-bold text-ink tabular-nums">{nf(best.impressions)} <span className="font-normal text-muted text-[11px]">{dayFmt(best.date)}</span></p>
        </div>
        <div className="rounded-xl bg-muted-50 px-3 py-2">
          <p className="text-muted text-[11px]">متوسّط آخر 7 أيام</p>
          <p className="font-bold text-ink tabular-nums">
            {nf(last7)}/يوم
            {trendPct != null && trendPct !== 0 && (
              <span className={`ms-1.5 text-[11px] font-bold ${trendPct > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {trendPct > 0 ? "▲" : "▼"}{Math.abs(trendPct)}%
              </span>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

function RankedList({ rows, hrefOf }: {
  rows: { label: string; impressions: number; clicks: number; position: number }[];
  hrefOf?: (label: string) => string;
}) {
  if (!rows.length) return <p className="mt-4 text-body text-muted-500">لا بيانات بعد.</p>;
  const max = Math.max(1, ...rows.map((r) => r.impressions));
  const total = rows.reduce((s, r) => s + r.impressions, 0) || 1;
  return (
    <div className="mt-4 space-y-3">
      {rows.map((r, i) => {
        // CTR الفعليّ مقابل المتوقّع من الموضع: يميّز «ترتيب ضعيف» عن «عنوان ضعيف».
        const ctr = r.impressions ? r.clicks / r.impressions : 0;
        const share = Math.round((r.impressions / total) * 100);
        return (
          <div key={i}>
            <div className="flex items-center justify-between gap-3 text-body mb-1">
              <span className="font-medium text-ink truncate flex items-center gap-2" dir="auto">
                <span className="text-[10px] text-muted-200 tabular-nums w-4 shrink-0">{i + 1}</span>
                {hrefOf ? (
                  <a href={hrefOf(r.label)} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                    {r.label}
                  </a>
                ) : r.label}
              </span>
              <span className={`text-[11px] font-bold rounded-lg px-1.5 py-0.5 shrink-0 ${
                r.position <= 3 ? "bg-emerald-50 text-emerald-600"
                : r.position <= 10 ? "bg-amber-50 text-amber-600"
                : "bg-muted-100 text-muted-500"}`}>#{r.position}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted-100 overflow-hidden">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.round((r.impressions / max) * 100)}%` }} />
            </div>
            <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[11px] text-muted mt-1 tabular-nums">
              <span>ظهور {nf(r.impressions)}</span>
              <span>نقر {nf(r.clicks)}</span>
              <span className={ctr === 0 ? "text-red-500 font-semibold" : ""}>
                CTR {(ctr * 100).toFixed(1)}%
              </span>
              <span className="text-muted-200">{share}% من ظهور القائمة</span>
            </div>
          </div>
        );
      })}
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
          <p className="text-body font-bold text-ink">{rec.title}</p>
          <p className="text-caption text-muted-600 mt-1 leading-relaxed">{rec.detail}</p>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, hint, tone, delta }: {
  icon: React.ReactNode; label: string; value: string; hint?: string;
  tone: "primary" | "gold" | "gray"; delta?: number | null;
}) {
  const toneCls = { primary: "bg-primary/10 text-primary", gold: "bg-gold/15 text-gold", gray: "bg-muted-100 text-muted-500" }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2.5">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneCls}`}>{icon}</span>
        {delta != null && delta !== 0 && (
          <span className={`text-[11px] font-bold rounded-lg px-2 py-1 ${
            delta > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-h2 font-extrabold text-ink tabular-nums leading-none">{value}</p>
      <p className="text-caption text-muted-500 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-muted mt-0.5">{hint}</p>}
    </Card>
  );
}

/** رقمٌ مساعد بلا أيقونة — صفّ ثانٍ من المؤشّرات تحت الرئيسية. */
function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-h3 font-extrabold text-ink tabular-nums leading-none">{value}</p>
      <p className="text-caption text-muted-500 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{hint}</p>}
    </Card>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</span>
      <div>
        <h2 className="font-bold text-ink leading-tight">{title}</h2>
        {subtitle && <p className="text-caption text-muted-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
