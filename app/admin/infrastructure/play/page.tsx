"use client";

// صفحة Google Play — نشر التطبيقين: أيّ إصدار على أيّ مسار؟

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import { Metric, MetricGrid, Note, Panel, StatePill, Table, formatNumber } from "@/components/admin/service-metrics";
import { Smartphone } from "@solar-icons/react";

interface Track { track: string; versions: string[]; status: string | null }
interface App { package: string; tracks?: Track[]; error?: string }
interface Play extends ServiceData { apps: App[] }

const LABEL: Record<string, string> = {
  "ar.dev.maskani": "تطبيق المستخدمين",
  "ar.dev.maskani.admin": "تطبيق الإدارة",
};

export default function PlayPage() {
  return (
    <ServiceShell<Play> serviceKey="play" icon={Smartphone}>
      {(d) => {
        const apps = d.apps ?? [];
        const failing = apps.filter((a) => a.error).length;
        return (
          <>
            <MetricGrid>
              <Metric label="التطبيقات" value={formatNumber(apps.length)} />
              <Metric
                label="تعذّرت قراءته"
                value={formatNumber(failing)}
                tone={failing ? "bad" : "good"}
              />
              <Metric
                label="المسارات المنشورة"
                value={formatNumber(apps.reduce((s, a) => s + (a.tracks?.length ?? 0), 0))}
              />
              <Metric
                label="أعلى إصدار"
                value={formatNumber(
                  Math.max(
                    0,
                    ...apps.flatMap((a) => (a.tracks ?? []).flatMap((t) => t.versions.map(Number))),
                  ),
                )}
              />
            </MetricGrid>

            {apps.map((a) => (
              <Panel key={a.package} title={`${LABEL[a.package] ?? a.package} — ${a.package}`}>
                {a.error ? (
                  <p className="text-body text-danger-600">{a.error}</p>
                ) : (
                  <Table<Track>
                    rows={a.tracks ?? []}
                    cols={[
                      { key: "track", header: "المسار" },
                      { key: "status", header: "الحالة", render: (r) => <StatePill state={r.status ?? undefined} /> },
                      { key: "versions", header: "الإصدارات", render: (r) => r.versions.join("، ") || "—" },
                    ]}
                  />
                )}
              </Panel>
            ))}

            <Note>
              التوزيع الفعلي للمستخدمين يجري عبر ملفّ APK موقّع على R2 (صفحة التنزيل)، وليس
              عبر مسار الاختبار في Play — لكنّ حالة المسارات تبقى مفيدة لمتابعة النشر.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
