"use client";

// صفحة Porkbun — تسجيل النطاقات: متى ينتهي كلّ نطاق وهل التجديد تلقائي؟

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Metric, MetricGrid, Note, Panel, StatePill, Table, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { Badge } from "@/components/ui/Badge";
import { Global } from "@solar-icons/react";

interface Domain {
  domain: string; expires: string; days_left: number | null;
  auto_renew: string | number | boolean | null; status: string; created: string | null;
}
interface Pb extends ServiceData {
  domains: Domain[]; domains_count: number;
  soonest_expiry_days: number | null; expiring_soon: boolean;
}

/** التجديد التلقائي يعود من الواجهة كنصّ أو رقم — نوحّده هنا. */
function isAuto(v: Domain["auto_renew"]): boolean {
  return v === 1 || v === "1" || v === true || v === "true";
}

export default function PorkbunPage() {
  return (
    <ServiceShell<Pb> serviceKey="porkbun" icon={Global}>
      {(d) => (
        <>
          <MetricGrid>
            <Metric label="النطاقات" value={formatNumber(d.domains_count)} />
            <Metric
              label="أقرب انتهاء"
              value={d.soonest_expiry_days != null ? `${d.soonest_expiry_days} يوم` : "—"}
              tone={d.expiring_soon ? "bad" : "good"}
            />
            <Metric
              label="تجديد تلقائي"
              value={formatNumber((d.domains ?? []).filter((x) => isAuto(x.auto_renew)).length)}
              sub={`من ${d.domains_count} نطاق`}
            />
            <Metric label="حالة التسجيل" value={d.expiring_soon ? "يحتاج تجديداً" : "مستقرّة"} tone={d.expiring_soon ? "warn" : "good"} />
          </MetricGrid>

          <Panel title="النطاقات">
            <Table<Domain>
              rows={d.domains ?? []}
              cols={[
                { key: "domain", header: "النطاق" },
                { key: "expires", header: "ينتهي", render: (r) => r.expires?.slice(0, 10) ?? "—" },
                {
                  key: "days_left",
                  header: "المتبقّي",
                  render: (r) => (
                    <span className={r.days_left != null && r.days_left < 30 ? "text-danger-600 font-bold" : ""}>
                      {r.days_left != null ? `${r.days_left} يوم` : "—"}
                    </span>
                  ),
                },
                {
                  key: "auto_renew",
                  header: "تجديد تلقائي",
                  render: (r) => (
                    <Badge variant={isAuto(r.auto_renew) ? "success" : "warning"}>
                      {isAuto(r.auto_renew) ? "مفعّل" : "معطّل"}
                    </Badge>
                  ),
                },
                { key: "status", header: "الحالة", render: (r) => <StatePill state={r.status} /> },
                { key: "created", header: "سُجّل", render: (r) => timeAgo(r.created) },
              ]}
            />
          </Panel>

          <Note>
            خوادم الأسماء موجّهة إلى Cloudflare، فالتحكّم بالسجلّات يجري هناك؛ Porkbun يبقى
            جهة التسجيل والتجديد فقط.
          </Note>
        </>
      )}
    </ServiceShell>
  );
}
