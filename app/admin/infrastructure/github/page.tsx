"use client";

// صفحة GitHub — المستودعات ومسارات النشر الآلي: أيّ مستودع آخر تشغيل له فاشل؟

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, StatePill, Table, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { CodeSquare } from "@solar-icons/react";

interface Run {
  name: string; status: string; conclusion: string | null;
  branch: string; created: string; url: string; actor: string | null;
}
interface Repo {
  repo: string; runs: Run[]; last_conclusion: string | null;
  last_run_at: string | null; success_rate_pct: number | null; error?: string;
}
interface Gh extends ServiceData {
  repos: Repo[]; repos_count: number; failing: number; success_rate_pct: number | null;
}

export default function GithubPage() {
  return (
    <ServiceShell<Gh> serviceKey="github" icon={CodeSquare}>
      {(d) => (
        <>
          <MetricGrid>
            <Metric label="المستودعات" value={formatNumber(d.repos_count)} />
            <Metric
              label="مستودعات متعثّرة"
              value={formatNumber(d.failing)}
              tone={d.failing ? "bad" : "good"}
              sub="آخر تشغيل فاشل"
            />
            <Metric label="متوسط نجاح المسارات" value={d.success_rate_pct != null ? `${d.success_rate_pct}%` : "—"} />
            <Metric
              label="آخر تشغيل"
              value={timeAgo(
                (d.repos ?? [])
                  .map((r) => r.last_run_at)
                  .filter(Boolean)
                  .sort()
                  .reverse()[0],
              )}
            />
          </MetricGrid>

          <MetricGrid>
            {(d.repos ?? []).map((r) => (
              <Gauge
                key={r.repo}
                label={r.repo}
                pct={r.success_rate_pct}
                invert
                warn={90}
                danger={60}
                caption={`آخر تشغيل ${timeAgo(r.last_run_at)}`}
              />
            ))}
          </MetricGrid>

          {(d.repos ?? []).map((r) => (
            <Panel
              key={r.repo}
              title={r.repo}
              action={<StatePill state={r.last_conclusion ?? undefined} />}
            >
              <Table<Run>
                rows={r.runs ?? []}
                cols={[
                  {
                    key: "name",
                    header: "المسار",
                    render: (x) => (
                      <a href={x.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {x.name}
                      </a>
                    ),
                  },
                  { key: "branch", header: "الفرع" },
                  {
                    key: "conclusion",
                    header: "النتيجة",
                    render: (x) => <StatePill state={x.conclusion ?? x.status} />,
                  },
                  { key: "actor", header: "المُشغِّل" },
                  { key: "created", header: "منذ", render: (x) => timeAgo(x.created) },
                ]}
              />
            </Panel>
          ))}

          <Note>
            دفعة إلى فرع <code>stable</code> في الباك اند أو الويب تُشغّل النشر تلقائياً؛ أمّا
            فرع <code>main</code> فيشغّل الفحص (CI) فقط.
          </Note>
        </>
      )}
    </ServiceShell>
  );
}
