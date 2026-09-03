"use client";

// صفحة Sentry — رصد الأخطاء: ماذا انكسر خلال 24 ساعة، وأين، وكم بقي من الحصّة.

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Table, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { Badge } from "@/components/ui/Badge";
import { DangerTriangle } from "@solar-icons/react";

interface Project { project: string; platform: string | null; unresolved: number; errors_24h: number }
interface Issue {
  project: string; title: string; level: string; count: number;
  users: number | null; last_seen: string; permalink: string;
}
interface Sentry extends ServiceData {
  org: string;
  projects: Project[];
  projects_count: number;
  errors_24h: number;
  unresolved: number;
  events_30d: number;
  events_quota: number;
  quota_pct: number;
  dropped_30d: number;
  top_issues: Issue[];
}

export default function SentryPage() {
  return (
    <ServiceShell<Sentry> serviceKey="sentry" icon={DangerTriangle}>
      {(d) => (
        <>
          <MetricGrid>
            <Metric
              label="أخطاء 24 ساعة"
              value={formatNumber(d.errors_24h)}
              tone={d.errors_24h ? "bad" : "good"}
            />
            <Metric
              label="أعطال مفتوحة"
              value={formatNumber(d.unresolved)}
              tone={d.unresolved ? "warn" : "good"}
            />
            <Metric label="المشاريع المراقَبة" value={formatNumber(d.projects_count)} />
            <Metric
              label="أحداث مرفوضة"
              value={formatNumber(d.dropped_30d)}
              tone={d.dropped_30d ? "warn" : "good"}
              sub="تجاوز حدّ المعدّل — 30 يومًا"
            />
          </MetricGrid>

          <MetricGrid>
            <Gauge
              label="من الحصّة الشهرية"
              pct={d.quota_pct}
              caption={`${formatNumber(d.events_30d)} من ${formatNumber(d.events_quota)} حدث`}
            />
          </MetricGrid>

          <Panel title="المشاريع">
            <Table<Project>
              rows={d.projects ?? []}
              cols={[
                { key: "project", header: "المشروع" },
                {
                  key: "platform",
                  header: "المنصّة",
                  render: (r) => <Badge variant="default">{r.platform ?? "—"}</Badge>,
                },
                {
                  key: "errors_24h",
                  header: "أخطاء 24 ساعة",
                  render: (r) => (
                    <span className={r.errors_24h ? "text-danger-600 font-bold" : "text-success-600"}>
                      {formatNumber(r.errors_24h)}
                    </span>
                  ),
                },
                { key: "unresolved", header: "أعطال مفتوحة", render: (r) => formatNumber(r.unresolved) },
              ]}
            />
          </Panel>

          <Panel title="أكثر الأعطال تكرارًا">
            <Table<Issue>
              rows={d.top_issues ?? []}
              cols={[
                {
                  key: "title",
                  header: "العطل",
                  render: (r) => (
                    <a
                      href={r.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline block max-w-md truncate"
                      title={r.title}
                    >
                      {r.title}
                    </a>
                  ),
                },
                { key: "project", header: "المشروع" },
                { key: "count", header: "التكرار", render: (r) => formatNumber(r.count) },
                { key: "users", header: "متأثّرون", render: (r) => formatNumber(r.users) },
                { key: "last_seen", header: "آخر ظهور", render: (r) => timeAgo(r.last_seen) },
              ]}
            />
          </Panel>

          <Note>
            الباك اند يرسل عبر تكاملَي Django وCelery، والويب عبر @sentry/nextjs خادمًا
            ومتصفّحًا. نسبة عيّنة الأداء 10% حفاظًا على الحصّة، ولا تُرسَل بيانات شخصية —
            وقد تحجب بعض مانعات الإعلانات أحداث المتصفّح، فأرقام الخادم هي المرجع.
          </Note>
        </>
      )}
    </ServiceShell>
  );
}
