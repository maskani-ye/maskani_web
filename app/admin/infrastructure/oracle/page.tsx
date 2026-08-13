"use client";

// صفحة Oracle Cloud — خادم قاعدة البيانات. أهم ما يُقاس هنا ضغط الموارد على
// المثيل (معالج/ذاكرة/شبكة) وصحّة Postgres نفسه (الحجم، الاتصالات، الكاش).

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Series, StatePill, Table, formatBytes, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { Database } from "@solar-icons/react";

interface Instance {
  name: string; state: string; shape: string;
  ocpus: number | null; memory_gb: number | null; created: string | null;
}
interface Metrics {
  [k: string]: { points: { t: string; v: number }[]; latest: number; avg: number; max: number };
}
interface Db {
  size_mb?: number; name?: string; version?: string;
  connections?: { active: number; total: number; max: number; usage_pct: number | null };
  cache_hit_pct?: number | null;
  transactions?: { commits: number; rollbacks: number };
  largest_tables?: { table: string; size_mb: number; rows: number | null }[];
  error?: string;
}
interface Oracle extends ServiceData {
  region: string; instances: Instance[]; instance_count: number; running: number;
  metrics: Metrics; database: Db;
}

export default function OraclePage() {
  return (
    <ServiceShell<Oracle> serviceKey="oracle" icon={Database}>
      {(d) => {
        const m = d.metrics ?? {};
        const db = d.database ?? {};
        const conn = db.connections;
        return (
          <>
            <MetricGrid>
              <Metric label="المنطقة" value={d.region} sub={`${d.running} من ${d.instance_count} يعمل`} />
              <Metric
                label="حجم القاعدة"
                value={`${formatNumber(db.size_mb)} م.ب`}
                sub={db.name}
              />
              <Metric
                label="نسخة Postgres"
                value={db.version?.replace("PostgreSQL ", "") ?? "—"}
              />
              <Metric
                label="المعاملات"
                value={formatNumber(db.transactions?.commits)}
                sub={`${formatNumber(db.transactions?.rollbacks)} تراجُع`}
              />
            </MetricGrid>

            <MetricGrid>
              <Gauge label="المعالج (آخر قراءة)" pct={m.cpu?.latest} caption={`المتوسط ${m.cpu?.avg ?? "—"}% · الذروة ${m.cpu?.max ?? "—"}%`} />
              <Gauge label="الذاكرة" pct={m.memory?.latest} caption={`المتوسط ${m.memory?.avg ?? "—"}%`} />
              <Gauge
                label="الاتصالات المستهلكة"
                pct={conn?.usage_pct}
                caption={`${conn?.total ?? "—"} من ${conn?.max ?? "—"} · ${conn?.active ?? "—"} نشط`}
              />
              <Gauge
                label="إصابة ذاكرة القاعدة"
                pct={db.cache_hit_pct ?? null}
                invert
                warn={99}
                danger={95}
                caption="كلما اقتربت من 100% قلّت القراءات من القرص"
              />
            </MetricGrid>

            <div className="grid lg:grid-cols-2 gap-4">
              <Series title="المعالج — 24 ساعة" points={m.cpu?.points} unit="%" />
              <Series title="الذاكرة — 24 ساعة" points={m.memory?.points} unit="%" color="#FFC107" />
              <Series title="الشبكة الواردة" points={m.network_in?.points} unit="بايت" color="#0ea5e9" />
              <Series title="الشبكة الصادرة" points={m.network_out?.points} unit="بايت" color="#10b981" />
            </div>

            <Panel title="المثيلات">
              <Table<Instance>
                rows={d.instances ?? []}
                cols={[
                  { key: "name", header: "الاسم" },
                  { key: "state", header: "الحالة", render: (r) => <StatePill state={r.state} /> },
                  { key: "shape", header: "الشكل" },
                  { key: "ocpus", header: "المعالجات", render: (r) => formatNumber(r.ocpus) },
                  { key: "memory_gb", header: "الذاكرة", render: (r) => `${formatNumber(r.memory_gb)} ج.ب` },
                  { key: "created", header: "أُنشئ", render: (r) => timeAgo(r.created) },
                ]}
              />
            </Panel>

            <Panel title="أكبر الجداول في القاعدة">
              {db.error ? (
                <Note>تعذّرت قراءة إحصاءات الجداول: {db.error}</Note>
              ) : (
                <Table<NonNullable<Db["largest_tables"]>[number]>
                  rows={db.largest_tables ?? []}
                  cols={[
                    { key: "table", header: "الجدول" },
                    { key: "size_mb", header: "الحجم", render: (r) => formatBytes(r.size_mb * 1048576) },
                    { key: "rows", header: "الصفوف", render: (r) => formatNumber(r.rows) },
                  ]}
                />
              )}
            </Panel>

            <Note>
              مقاييس المثيل من خدمة المراقبة في أوراكل (تجميع كل 5 دقائق، آخر 24 ساعة)، وإحصاءات
              القاعدة مقروءة مباشرةً من Postgres الذي يعمل على هذا الخادم.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
