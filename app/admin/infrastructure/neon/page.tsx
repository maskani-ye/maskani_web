"use client";

// صفحة Neon — النسخة الساخنة من القاعدة (تُحدَّث 01:15 يومياً).

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Metric, MetricGrid, Note, Panel, Table, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { Database } from "@solar-icons/react";

interface Project {
  project: string; id: string; region: string; pg: number;
  storage_mb: number; compute_hours_lifetime: number; cpu_hours_lifetime: number;
  last_active: string | null; quota_reset_at: string | null; created_at: string | null;
}
interface Neon extends ServiceData {
  projects: Project[];
  projects_count: number;
  storage_mb: number;
  compute_hours_quota_monthly: number;
  note: string;
}

export default function NeonPage() {
  return (
    <ServiceShell<Neon> serviceKey="neon" icon={Database}>
      {(d) => {
        const newest = (d.projects ?? [])
          .slice()
          .sort((a, b) => (b.last_active ?? "").localeCompare(a.last_active ?? ""))[0];
        return (
          <>
            <MetricGrid>
              <Metric label="المشاريع" value={formatNumber(d.projects_count)} />
              <Metric label="إجمالي التخزين" value={`${formatNumber(d.storage_mb)} م.ب`} />
              <Metric
                label="الحصّة الشهرية"
                value={`${formatNumber(d.compute_hours_quota_monthly)} ساعة`}
                sub="حوسبة في الخطة المجانية"
              />
              <Metric
                label="آخر إيقاظ"
                value={timeAgo(newest?.last_active)}
                sub="يُفترض مرّة يومياً وقت النسخ"
              />
            </MetricGrid>

            <Panel title="المشاريع">
              <Table<Project>
                rows={d.projects ?? []}
                cols={[
                  { key: "project", header: "المشروع" },
                  { key: "id", header: "المعرّف" },
                  { key: "region", header: "المنطقة" },
                  { key: "pg", header: "Postgres" },
                  { key: "storage_mb", header: "التخزين", render: (r) => `${formatNumber(r.storage_mb)} م.ب` },
                  {
                    key: "compute_hours_lifetime",
                    header: "حوسبة (تراكمي)",
                    render: (r) => `${formatNumber(r.compute_hours_lifetime)} ساعة`,
                  },
                  { key: "last_active", header: "آخر نشاط", render: (r) => timeAgo(r.last_active) },
                  { key: "created_at", header: "أُنشئ", render: (r) => timeAgo(r.created_at) },
                ]}
              />
            </Panel>

            <Note>
              {d.note} — لذلك تُعرض الساعات موصوفةً بأنها تراكمية منذ إنشاء المشروع، والنسبة
              الشهرية الدقيقة تبقى في لوحة Neon. الوركرات لا توقظ Neon إلّا وقت النسخة (01:15).
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
