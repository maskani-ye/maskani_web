"use client";

// صفحة AdSense — أرباح المنصّة الإعلانية داخل اللوحة، بلا فتح حساب جوجل.

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Metric, MetricGrid, Note, Panel, Series, StatePill, Table, formatNumber,
} from "@/components/admin/service-metrics";
import { Wallet } from "@solar-icons/react";

interface Totals {
  estimated_earnings?: number;
  page_views?: number;
  impressions?: number;
  clicks?: number;
  page_views_rpm?: number;
  impressions_ctr?: number;
  currency?: string;
}
interface Day { date: string; earnings: number; page_views: number }
interface PageRow { page: string; earnings: number; page_views: number; clicks: number }
interface Site { domain: string; state: string; auto_ads?: boolean }
interface Unit { name: string; slot: string; state: string }
interface AdSense extends ServiceData {
  account: string;
  currency: string;
  today: Totals;
  last_7d: Totals;
  month_to_date: Totals;
  last_30d: Totals;
  daily: Day[];
  top_pages: PageRow[];
  sites: Site[];
  ad_units: Unit[];
  note: string;
}

/** المبلغ بعملة الحساب — الأرباح رقم يُقرأ لا يُقرّب بإفراط. */
function money(v: number | undefined, currency: string) {
  if (v == null) return "—";
  return `${v.toFixed(2)} ${currency}`;
}

export default function AdSensePage() {
  return (
    <ServiceShell<AdSense> serviceKey="adsense" icon={Wallet}>
      {(d) => {
        const cur = d.currency || "USD";
        const notReady = (d.sites ?? []).filter((s) => s.state !== "READY");
        return (
          <>
            <MetricGrid>
              <Metric label="أرباح اليوم" value={money(d.today?.estimated_earnings, cur)} />
              <Metric label="آخر 7 أيام" value={money(d.last_7d?.estimated_earnings, cur)} />
              <Metric
                label="الشهر حتى الآن"
                value={money(d.month_to_date?.estimated_earnings, cur)}
                tone="good"
              />
              <Metric label="آخر 30 يومًا" value={money(d.last_30d?.estimated_earnings, cur)} />
            </MetricGrid>

            <MetricGrid>
              <Metric
                label="مشاهدات الصفحات (30 يومًا)"
                value={formatNumber(d.last_30d?.page_views)}
              />
              <Metric label="ظهور الإعلانات" value={formatNumber(d.last_30d?.impressions)} />
              <Metric label="النقرات" value={formatNumber(d.last_30d?.clicks)} />
              <Metric
                label="عائد الألف مشاهدة (RPM)"
                value={money(d.last_30d?.page_views_rpm, cur)}
              />
            </MetricGrid>

            {notReady.length > 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4">
                <p className="font-bold text-warning-700 text-body">
                  {notReady.length} موقع لا يعرض إعلانات بعد
                </p>
                <p className="text-body text-warning-700 mt-1 leading-relaxed">
                  {notReady.map((s) => `${s.domain} (${s.state})`).join("، ")} — الأرباح تبقى صفرًا
                  حتى تنتقل الحالة إلى READY.
                </p>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              <Series
                title="الأرباح اليومية"
                points={(d.daily ?? []).map((x) => ({ date: x.date, count: x.earnings }))}
                unit={cur}
              />
              <Series
                title="مشاهدات الصفحات يوميًا"
                points={(d.daily ?? []).map((x) => ({ date: x.date, count: x.page_views }))}
                unit="مشاهدة"
                color="#0ea5e9"
              />
            </div>

            <Panel title="أعلى الصفحات دخلًا (30 يومًا)">
              <Table<PageRow>
                rows={d.top_pages ?? []}
                cols={[
                  { key: "page", header: "الصفحة" },
                  { key: "earnings", header: "الأرباح", render: (r) => money(r.earnings, cur) },
                  { key: "page_views", header: "مشاهدات", render: (r) => formatNumber(r.page_views) },
                  { key: "clicks", header: "نقرات", render: (r) => formatNumber(r.clicks) },
                ]}
              />
            </Panel>

            <div className="grid lg:grid-cols-2 gap-4">
              <Panel title="المواقع">
                <Table<Site>
                  rows={d.sites ?? []}
                  cols={[
                    { key: "domain", header: "النطاق" },
                    { key: "state", header: "الحالة", render: (r) => <StatePill state={r.state} /> },
                    {
                      key: "auto_ads",
                      header: "إعلانات تلقائية",
                      render: (r) => (r.auto_ads ? "مفعّلة" : "معطّلة"),
                    },
                  ]}
                />
              </Panel>
              <Panel title="الوحدات الإعلانية">
                <Table<Unit>
                  rows={d.ad_units ?? []}
                  cols={[
                    { key: "name", header: "الوحدة" },
                    { key: "slot", header: "معرّف الشريحة" },
                    { key: "state", header: "الحالة", render: (r) => <StatePill state={r.state} /> },
                  ]}
                />
              </Panel>
            </div>

            <Note>
              {d.note} · الحساب {d.account}. الأرقام تتأخّر ساعات عند جوجل، لذا تُخزَّن هنا نصف
              ساعة — التحديث الأسرع لا يعطي معلومة جديدة.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
