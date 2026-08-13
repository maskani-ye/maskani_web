"use client";

// صفحة Firebase FCM — الإشعارات: الأجهزة المسجّلة وما أرسلناه فعلاً.
// أرقام الإرسال من قاعدتنا لا من جوجل (لا تنشرها واجهة عامة).

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Series, Table, formatNumber,
} from "@/components/admin/service-metrics";
import { Badge } from "@/components/ui/Badge";
import { Bell } from "@solar-icons/react";

interface Firebase extends ServiceData {
  credentials_present: boolean;
  devices_total: number;
  devices_active: number;
  devices_by_platform: { platform: string; count: number }[];
  notifications_30d: number;
  unread: number;
  read_rate_pct: number | null;
  by_type: { notification_type: string; count: number }[];
  daily: { date: string; count: number }[];
  send_stats_note: string;
}

export default function FirebasePage() {
  return (
    <ServiceShell<Firebase> serviceKey="firebase" icon={Bell}>
      {(d) => (
        <>
          <MetricGrid>
            <Metric
              label="الاعتماد"
              value={d.credentials_present ? "مضبوط" : "مفقود"}
              tone={d.credentials_present ? "good" : "bad"}
            />
            <Metric label="أجهزة نشطة" value={formatNumber(d.devices_active)} sub={`من ${formatNumber(d.devices_total)} مسجّل`} />
            <Metric label="إشعارات (30 يومًا)" value={formatNumber(d.notifications_30d)} />
            <Metric label="غير مقروءة" value={formatNumber(d.unread)} tone={d.unread ? "warn" : "good"} />
          </MetricGrid>

          <MetricGrid>
            <Gauge
              label="نسبة القراءة"
              pct={d.read_rate_pct}
              invert
              warn={40}
              danger={20}
              caption="من إشعارات آخر 30 يومًا"
            />
            {(d.devices_by_platform ?? []).map((p) => (
              <Metric key={p.platform || "unknown"} label={`أجهزة ${p.platform || "غير محدّدة"}`} value={formatNumber(p.count)} />
            ))}
          </MetricGrid>

          <Series title="الإشعارات المُنشأة يوميًا" points={d.daily} unit="إشعار" />

          <Panel title="التوزيع حسب النوع">
            <Table<{ notification_type: string; count: number }>
              rows={d.by_type ?? []}
              cols={[
                { key: "notification_type", header: "النوع", render: (r) => <Badge variant="default">{r.notification_type}</Badge> },
                { key: "count", header: "العدد", render: (r) => formatNumber(r.count) },
                {
                  key: "share",
                  header: "الحصّة",
                  render: (r) => (
                    <div className="flex items-center gap-2 min-w-32">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${d.notifications_30d ? (r.count / d.notifications_30d) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Panel>

          <Note>{d.send_stats_note} — لذا الأرقام أعلاه من قاعدتنا: ما أنشأناه وأرسلناه، لا ما سلّمته جوجل.</Note>
        </>
      )}
    </ServiceShell>
  );
}
