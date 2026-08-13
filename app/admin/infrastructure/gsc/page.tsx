"use client";

// صفحة Search Console — الفهرسة والبحث: ماذا يظهر في جوجل ومَن يصل إلينا.

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Series, Table, formatNumber,
} from "@/components/admin/service-metrics";
import { MagniferBug } from "@solar-icons/react";

interface Query { query?: string; page?: string; clicks: number; impressions: number; ctr?: number; position?: number }
interface Gsc extends ServiceData {
  site: string;
  clicks_30d: number;
  impressions_30d: number;
  ctr_pct: number | null;
  position: number | null;
  coverage: { inspected?: number; indexed?: number; not_indexed?: number; sitemap_total?: number; by_reason?: { reason: string; count: number }[] };
  trend: { date: string; clicks: number; impressions: number }[];
  sitemaps: { path?: string; submitted?: number; indexed?: number; errors?: number }[];
  top_queries: Query[];
  top_pages: Query[];
}

export default function GscPage() {
  return (
    <ServiceShell<Gsc> serviceKey="gsc" icon={MagniferBug}>
      {(d) => {
        const cov = d.coverage ?? {};
        const indexedPct = cov.inspected ? ((cov.indexed ?? 0) / cov.inspected) * 100 : null;
        return (
          <>
            <MetricGrid>
              <Metric label="النقرات (30 يومًا)" value={formatNumber(d.clicks_30d)} />
              <Metric label="مرّات الظهور" value={formatNumber(d.impressions_30d)} />
              <Metric label="نسبة النقر" value={d.ctr_pct != null ? `${d.ctr_pct}%` : "—"} />
              <Metric
                label="متوسط الترتيب"
                value={d.position != null ? d.position.toFixed(1) : "—"}
                tone={d.position != null && d.position <= 10 ? "good" : "warn"}
              />
            </MetricGrid>

            <MetricGrid>
              <Gauge
                label="نسبة الصفحات المفهرسة"
                pct={indexedPct}
                invert
                warn={60}
                danger={30}
                caption={`${formatNumber(cov.indexed)} مفهرسة من ${formatNumber(cov.inspected)} مفحوصة`}
              />
              <Metric label="روابط خريطة الموقع" value={formatNumber(cov.sitemap_total)} />
              <Metric label="غير مفهرسة" value={formatNumber(cov.not_indexed)} tone="warn" />
              <Metric label="الموقع" value={d.site?.replace("https://", "") ?? "—"} />
            </MetricGrid>

            <div className="grid lg:grid-cols-2 gap-4">
              <Series
                title="النقرات اليومية"
                points={(d.trend ?? []).map((x) => ({ date: x.date, count: x.clicks }))}
                unit="نقرة"
              />
              <Series
                title="مرّات الظهور اليومية"
                points={(d.trend ?? []).map((x) => ({ date: x.date, count: x.impressions }))}
                unit="ظهور"
                color="#0ea5e9"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Panel title="أكثر عبارات البحث">
                <Table<Query>
                  rows={d.top_queries ?? []}
                  cols={[
                    { key: "query", header: "العبارة" },
                    { key: "clicks", header: "نقرات", render: (r) => formatNumber(r.clicks) },
                    { key: "impressions", header: "ظهور", render: (r) => formatNumber(r.impressions) },
                    { key: "position", header: "الترتيب", render: (r) => r.position?.toFixed(1) ?? "—" },
                  ]}
                />
              </Panel>
              <Panel title="أكثر الصفحات وصولاً">
                <Table<Query>
                  rows={d.top_pages ?? []}
                  cols={[
                    { key: "page", header: "الصفحة", render: (r) => (r.page ?? "").replace("https://maskani.homes", "") || "/" },
                    { key: "clicks", header: "نقرات", render: (r) => formatNumber(r.clicks) },
                    { key: "impressions", header: "ظهور", render: (r) => formatNumber(r.impressions) },
                  ]}
                />
              </Panel>
            </div>

            {(cov.by_reason ?? []).length > 0 && (
              <Panel title="أسباب عدم الفهرسة">
                <Table<{ reason: string; count: number }>
                  rows={cov.by_reason ?? []}
                  cols={[
                    { key: "reason", header: "السبب" },
                    { key: "count", header: "عدد الصفحات", render: (r) => formatNumber(r.count) },
                  ]}
                />
              </Panel>
            )}

            <Note>
              الفحص يجري بحساب خدمة مالك على الخاصية، ويُخزَّن مؤقتًا ست ساعات احترامًا لحصّة
              الواجهة. صفحة «الفهرسة وSEO» تعرض التقرير الكامل بعمق أكبر.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
