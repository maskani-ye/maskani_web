"use client";

// صفحة Vercel — نشر الويب: هل آخر نشرة إنتاج ناجحة؟ وكم يستغرق البناء؟

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Series, StatePill, Table, formatDuration, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { Rocket } from "@solar-icons/react";

interface Deployment {
  url: string; state: string; target: string | null; created: number;
  source: string | null; creator: string | null; build_seconds: number | null;
}
interface Vercel extends ServiceData {
  deployments: Deployment[];
  last_production: Deployment | null;
  failed_recent: number;
  success_rate_pct: number | null;
  avg_build_seconds: number | null;
  production_count: number;
}

export default function VercelPage() {
  return (
    <ServiceShell<Vercel> serviceKey="vercel" icon={Rocket}>
      {(d) => {
        const deployments = d.deployments ?? [];
        // زمن البناء عبر النشرات — يكشف تضخّم الحزمة قبل أن يصبح مشكلة.
        const buildSeries = deployments
          .filter((x) => x.build_seconds)
          .slice()
          .reverse()
          .map((x) => ({ date: new Date(x.created).toISOString().slice(0, 16), count: x.build_seconds ?? 0 }));
        return (
          <>
            <MetricGrid>
              <Metric
                label="آخر نشرة إنتاج"
                value={<StatePill state={d.last_production?.state} />}
                sub={timeAgo(d.last_production?.created)}
              />
              <Metric
                label="فشل حديث"
                value={formatNumber(d.failed_recent)}
                tone={d.failed_recent ? "bad" : "good"}
                sub={`من ${deployments.length} نشرة`}
              />
              <Metric label="متوسط زمن البناء" value={formatDuration(d.avg_build_seconds)} />
              <Metric label="نشرات الإنتاج" value={formatNumber(d.production_count)} />
            </MetricGrid>

            <MetricGrid>
              <Gauge
                label="نسبة نجاح النشر"
                pct={d.success_rate_pct}
                invert
                warn={90}
                danger={70}
                caption="من آخر عشرين نشرة"
              />
            </MetricGrid>

            <Series title="زمن البناء عبر النشرات" points={buildSeries} unit="ثانية" color="#0ea5e9" />

            <Panel title="آخر النشرات">
              <Table<Deployment>
                rows={deployments}
                cols={[
                  {
                    key: "url",
                    header: "العنوان",
                    render: (r) => (
                      <a
                        href={`https://${r.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {r.url}
                      </a>
                    ),
                  },
                  { key: "state", header: "الحالة", render: (r) => <StatePill state={r.state} /> },
                  { key: "target", header: "البيئة" },
                  { key: "source", header: "المصدر" },
                  { key: "creator", header: "الناشر" },
                  { key: "build_seconds", header: "البناء", render: (r) => formatDuration(r.build_seconds) },
                  { key: "created", header: "منذ", render: (r) => timeAgo(r.created) },
                ]}
              />
            </Panel>

            <Note>
              النشر آلي: دفعة إلى فرع <code>stable</code> تُشغّل مسار GitHub Actions الذي يبني
              على Vercel نفسها (لا على المُشغّل) — لأن المُشغّل لا يصل إلى api.maskani.homes.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
