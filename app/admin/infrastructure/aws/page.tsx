"use client";

// صفحة AWS EC2 — خادم التطبيق. المعالج والشبكة من CloudWatch، أمّا القرص
// والذاكرة والحِمل فمقروءة من الخادم نفسه (CloudWatch لا يبلّغهما بلا وكيل).

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Series, StatePill, Table, formatBytes, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { ServerSquare } from "@solar-icons/react";

interface Instance {
  name: string; id: string; type: string; state: string;
  public_ip: string | null; launched: string | null;
}
interface Aws extends ServiceData {
  region: string;
  instances: Instance[];
  running: number;
  month_to_date_cost: { amount: number; unit: string } | null;
  metrics: Record<string, { unit: string; points: { t: string; v: number }[]; latest: number; avg: number; max: number }>;
  host: {
    disk?: { total_gb: number; used_gb: number; free_gb: number; used_pct: number };
    memory?: { total_mb: number; used_mb: number; used_pct: number };
    load?: { "1m": number; "5m": number; "15m": number };
  };
}

export default function AwsPage() {
  return (
    <ServiceShell<Aws> serviceKey="aws" icon={ServerSquare}>
      {(d) => {
        const m = d.metrics ?? {};
        const h = d.host ?? {};
        const cost = d.month_to_date_cost;
        const failed = m.status_failed?.max ?? 0;
        return (
          <>
            <MetricGrid>
              <Metric label="المنطقة" value={d.region} sub={`${d.running} مثيل يعمل`} />
              <Metric
                label="تكلفة الشهر حتى الآن"
                value={cost ? `${cost.amount.toFixed(2)} ${cost.unit}` : "غير متاحة"}
                sub={cost ? undefined : "صلاحية Cost Explorer غير مفعّلة"}
              />
              <Metric
                label="فحوص الحالة الفاشلة"
                value={formatNumber(failed)}
                tone={failed > 0 ? "bad" : "good"}
                sub="آخر 24 ساعة"
              />
              <Metric
                label="حِمل المعالج"
                value={h.load ? `${h.load["1m"]} / ${h.load["5m"]} / ${h.load["15m"]}` : "—"}
                sub="دقيقة / ٥ / ١٥"
              />
            </MetricGrid>

            <MetricGrid>
              <Gauge label="المعالج (آخر قراءة)" pct={m.cpu?.latest} caption={`المتوسط ${m.cpu?.avg ?? "—"}% · الذروة ${m.cpu?.max ?? "—"}%`} />
              <Gauge
                label="القرص"
                pct={h.disk?.used_pct}
                caption={h.disk ? `${h.disk.used_gb} من ${h.disk.total_gb} ج.ب · متبقٍ ${h.disk.free_gb} ج.ب` : undefined}
              />
              <Gauge
                label="الذاكرة"
                pct={h.memory?.used_pct}
                caption={h.memory ? `${h.memory.used_mb} من ${h.memory.total_mb} م.ب` : undefined}
              />
              <Metric
                label="حركة الشبكة (24 ساعة)"
                value={formatBytes(
                  (m.network_in?.points ?? []).reduce((s, p) => s + p.v, 0) +
                    (m.network_out?.points ?? []).reduce((s, p) => s + p.v, 0),
                )}
                sub="وارد + صادر"
              />
            </MetricGrid>

            <div className="grid lg:grid-cols-2 gap-4">
              <Series title="المعالج — 24 ساعة" points={m.cpu?.points} unit="%" />
              <Series title="الشبكة الواردة" points={m.network_in?.points} unit="بايت" color="#0ea5e9" />
              <Series title="الشبكة الصادرة" points={m.network_out?.points} unit="بايت" color="#10b981" />
            </div>

            <Panel title="المثيلات">
              <Table<Instance>
                rows={d.instances ?? []}
                cols={[
                  { key: "name", header: "الاسم" },
                  { key: "id", header: "المعرّف" },
                  { key: "type", header: "النوع" },
                  { key: "state", header: "الحالة", render: (r) => <StatePill state={r.state} /> },
                  { key: "public_ip", header: "العنوان العام" },
                  { key: "launched", header: "يعمل منذ", render: (r) => timeAgo(r.launched) },
                ]}
              />
            </Panel>

            <Note>
              المعالج والشبكة وفحوص الحالة من CloudWatch (تجميع كل 15 دقيقة). القرص والذاكرة
              والحِمل مقروءة من الخادم مباشرةً — CloudWatch لا يوفّرهما دون تثبيت وكيل.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
