"use client";

// صفحة Cloudflare — النطاق والحماية: حركة الأسبوع، نسبة التخزين المؤقت،
// التهديدات المحجوبة، وسجلّات DNS لكل نطاق.

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Series, StatePill, Table, formatBytes, formatNumber,
} from "@/components/admin/service-metrics";
import { Badge } from "@/components/ui/Badge";
import { Shield } from "@solar-icons/react";

interface Record_ { type: string; name: string; content: string; proxied: boolean }
interface Day { date: string; requests: number; bytes: number; threats: number; cached: number; uniques: number | null }
interface Analytics { days: Day[]; requests: number; bytes: number; threats: number; cache_hit_pct: number | null }
interface Zone {
  name: string; id: string; status: string; plan: string;
  records: Record_[]; records_count: number; analytics: Analytics | null;
}
interface Cf extends ServiceData {
  zones: Zone[]; records_total: number;
  requests_7d: number; bandwidth_7d: number; threats_7d: number;
}

export default function CloudflarePage() {
  return (
    <ServiceShell<Cf> serviceKey="cloudflare" icon={Shield}>
      {(d) => {
        const zones = d.zones ?? [];
        const main = zones.find((z) => z.analytics) ?? zones[0];
        const a = main?.analytics;
        return (
          <>
            <MetricGrid>
              <Metric label="الطلبات (7 أيام)" value={formatNumber(d.requests_7d)} />
              <Metric label="النطاق الترددي" value={formatBytes(d.bandwidth_7d)} sub="7 أيام" />
              <Metric
                label="تهديدات محجوبة"
                value={formatNumber(d.threats_7d)}
                tone={d.threats_7d > 0 ? "warn" : "good"}
                sub="7 أيام"
              />
              <Metric label="سجلّات DNS" value={formatNumber(d.records_total)} sub={`${zones.length} نطاق`} />
            </MetricGrid>

            <MetricGrid>
              <Gauge
                label="نسبة التقديم من الكاش"
                pct={a?.cache_hit_pct ?? null}
                invert
                warn={50}
                danger={25}
                caption="كلما ارتفعت خفّ الحمل عن خادمنا"
              />
              <Metric
                label="الزوّار الفريدون"
                value={formatNumber((a?.days ?? []).reduce((s, x) => s + (x.uniques ?? 0), 0))}
                sub="7 أيام"
              />
            </MetricGrid>

            <div className="grid lg:grid-cols-2 gap-4">
              <Series
                title="الطلبات اليومية"
                points={(a?.days ?? []).map((x) => ({ date: x.date, count: x.requests }))}
                unit="طلب"
              />
              <Series
                title="النطاق الترددي اليومي"
                points={(a?.days ?? []).map((x) => ({ date: x.date, count: x.bytes }))}
                unit="بايت"
                color="#0ea5e9"
              />
            </div>

            {zones.map((z) => (
              <Panel
                key={z.id}
                title={z.name}
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{z.plan}</Badge>
                    <StatePill state={z.status} />
                  </div>
                }
              >
                <Table<Record_>
                  rows={z.records ?? []}
                  cols={[
                    { key: "type", header: "النوع" },
                    { key: "name", header: "الاسم" },
                    { key: "content", header: "الوجهة" },
                    {
                      key: "proxied",
                      header: "عبر الوكيل",
                      render: (r) => (
                        <Badge variant={r.proxied ? "success" : "default"}>
                          {r.proxied ? "نعم" : "DNS فقط"}
                        </Badge>
                      ),
                    },
                  ]}
                />
              </Panel>
            ))}

            <Note>
              الويب يمرّ عبر وكيل Cloudflare (Proxied) بينما سجلّ <code>api</code> مباشر إلى
              خادم AWS — هذا التقسيم هو ما أصلح وصول اليمن للموقع.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
