"use client";

// فهرس «البنية والخدمات» — بطاقة لكل مزوّد مع رقمه الدالّ، مجمَّعة حسب دورها في
// المنصّة. كل بطاقة تفتح صفحةً مخصّصة بمقاييس تلك الخدمة.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBytes, formatNumber, timeAgo } from "@/components/admin/service-metrics";
import {
  ServerSquare, Refresh, AltArrowLeft, CheckCircle, CloseCircle, Database, Folder,
  Rocket, Shield, Global, CodeSquare, Bell, Smartphone, MagniferBug, DangerTriangle, Wallet,
} from "@solar-icons/react";
import { toast } from "sonner";
import type { ComponentType } from "react";

export interface ServiceStatus {
  key: string;
  name: string;
  role: string;
  ok: boolean;
  cached?: boolean;
  error?: string;
  [extra: string]: unknown;
}

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  oracle: Database, aws: ServerSquare, r2: Folder, neon: Database, vercel: Rocket,
  cloudflare: Shield, porkbun: Global, github: CodeSquare, firebase: Bell,
  play: Smartphone, gsc: MagniferBug, sentry: DangerTriangle, adsense: Wallet,
};

/** الأقسام تعكس دور الخدمة في المنصّة لا اسم مزوّدها. */
const GROUPS: { title: string; keys: string[] }[] = [
  { title: "البنية التحتية", keys: ["oracle", "aws", "r2", "neon"] },
  { title: "النشر والنطاق", keys: ["vercel", "cloudflare", "porkbun", "github"] },
  { title: "الرصد والدخل", keys: ["sentry", "adsense"] },
  { title: "التطبيقات والنمو", keys: ["firebase", "play", "gsc"] },
];

/** رقم واحد دالّ لكل خدمة — التفاصيل مكانها صفحة الخدمة. */
function summarize(s: ServiceStatus): string {
  if (!s.ok) return s.error ?? "غير متاح";
  switch (s.key) {
    case "oracle": {
      const db = s.database as { size_mb?: number } | undefined;
      const m = s.metrics as { cpu?: { latest: number } } | undefined;
      return `${s.running ?? 0} خادم يعمل · قاعدة ${formatNumber(db?.size_mb)} م.ب · المعالج ${m?.cpu?.latest ?? "—"}%`;
    }
    case "aws": {
      const host = s.host as { disk?: { used_pct: number }; memory?: { used_pct: number } } | undefined;
      const cost = s.month_to_date_cost as { amount: number; unit: string } | null;
      const costTxt = cost ? ` · ${cost.amount.toFixed(2)} ${cost.unit}` : "";
      return `القرص ${host?.disk?.used_pct ?? "—"}% · الذاكرة ${host?.memory?.used_pct ?? "—"}%${costTxt}`;
    }
    case "r2":
      return `${formatBytes(s.total_bytes as number)} · ${formatNumber(s.total_files as number)} ملف · آخر نسخة ${
        s.backup_age_hours != null ? `قبل ${s.backup_age_hours} ساعة` : "غير موجودة"
      }`;
    case "neon":
      return `${formatNumber(s.projects_count as number)} مشروع · ${formatNumber(s.storage_mb as number)} م.ب`;
    case "vercel": {
      const last = s.last_production as { state?: string; created?: number } | null;
      return `آخر نشر ${last?.state ?? "—"} ${timeAgo(last?.created)} · نجاح ${s.success_rate_pct ?? "—"}%`;
    }
    case "cloudflare":
      return `${formatNumber(s.requests_7d as number)} طلب · ${formatBytes(s.bandwidth_7d as number)} · ${formatNumber(
        s.threats_7d as number,
      )} تهديد محجوب`;
    case "porkbun":
      return `${formatNumber(s.domains_count as number)} نطاق · أقرب انتهاء بعد ${s.soonest_expiry_days ?? "—"} يوم`;
    case "github":
      return s.failing
        ? `${formatNumber(s.failing as number)} مستودع آخر تشغيله فاشل`
        : `${formatNumber(s.repos_count as number)} مستودع — كلها ناجحة`;
    case "firebase":
      return `${formatNumber(s.devices_active as number)} جهاز نشط · ${formatNumber(
        s.notifications_30d as number,
      )} إشعار (30 يومًا)`;
    case "play": {
      const apps = (s.apps as { error?: string }[]) ?? [];
      const bad = apps.filter((a) => a.error).length;
      return bad ? `${bad} تطبيق تعذّرت قراءته` : `${apps.length} تطبيق منشور`;
    }
    case "sentry":
      return `${formatNumber(s.errors_24h as number)} خطأ (24 ساعة) · ${formatNumber(
        s.unresolved as number,
      )} عطل مفتوح · ${s.quota_pct ?? 0}% من الحصّة`;
    case "adsense": {
      const mtd = s.month_to_date as { estimated_earnings?: number } | undefined;
      const d30 = s.last_30d as { estimated_earnings?: number; page_views?: number } | undefined;
      return `${(mtd?.estimated_earnings ?? 0).toFixed(2)} ${s.currency ?? "USD"} هذا الشهر · ${(
        d30?.estimated_earnings ?? 0
      ).toFixed(2)} في 30 يومًا · ${formatNumber(d30?.page_views)} مشاهدة`;
    }
    case "gsc":
      return `${formatNumber(s.clicks_30d as number)} نقرة · ${formatNumber(
        s.impressions_30d as number,
      )} ظهور · ترتيب ${(s.position as number)?.toFixed?.(1) ?? "—"}`;
    default:
      return "";
  }
}

function ServiceCard({ s }: { s: ServiceStatus }) {
  const Icon = ICONS[s.key] ?? ServerSquare;
  return (
    <Link
      href={`/admin/infrastructure/${s.key}`}
      className="flex items-start gap-3 bg-white rounded-2xl card-shadow p-4 border border-transparent hover:border-primary/40 transition-colors"
    >
      <span
        className={`shrink-0 grid place-items-center h-10 w-10 rounded-xl ${
          s.ok ? "bg-primary/10 text-primary" : "bg-red-50 text-red-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-ink flex items-center gap-2">
          {s.name}
          {s.ok ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <CloseCircle className="h-4 w-4 text-red-500" />
          )}
          {s.cached && <Badge variant="default">مخزَّن</Badge>}
        </p>
        <p className="text-caption text-muted">{s.role}</p>
        <p className={`text-body mt-1 truncate ${s.ok ? "text-muted-600" : "text-red-600"}`}>{summarize(s)}</p>
      </div>
      <AltArrowLeft className="h-4 w-4 text-muted-200 shrink-0 mt-1" />
    </Link>
  );
}

export default function InfrastructurePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const { data } = await api.get<{ services: ServiceStatus[] }>(ep.admin.infraServices, {
        params: refresh ? { refresh: 1 } : {},
      });
      setServices(data.services ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const healthy = services.filter((s) => s.ok).length;
  const down = services.filter((s) => !s.ok);
  const byKey = new Map(services.map((s) => [s.key, s]));
  const grouped = GROUPS.map((g) => ({
    title: g.title,
    items: g.keys.map((k) => byKey.get(k)).filter(Boolean) as ServiceStatus[],
  }));
  const ungrouped = services.filter((s) => !GROUPS.some((g) => g.keys.includes(s.key)));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <PageHeader
          icon={<ServerSquare />}
          title="الخدمات"
          subtitle={loading ? "جارٍ الفحص…" : `${healthy} من ${services.length} خدمة سليمة`}
        />
        <Button variant="outline" onClick={() => load(true)} loading={refreshing}>
          <Refresh className="h-4 w-4" /> تحديث
        </Button>
      </div>

      {!loading && down.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <p className="font-bold text-red-700 text-body">
            {down.length} خدمة متعطّلة: {down.map((s) => s.name).join("، ")}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <section key={g.title}>
              <h2 className="text-body font-bold text-muted mb-2">{g.title}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {g.items.map((s) => (
                  <ServiceCard key={s.key} s={s} />
                ))}
              </div>
            </section>
          ))}
          {ungrouped.length > 0 && (
            <section>
              <h2 className="text-body font-bold text-muted mb-2">أخرى</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {ungrouped.map((s) => (
                  <ServiceCard key={s.key} s={s} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <p className="text-caption text-muted mt-6 leading-relaxed">
        القراءة تجري في الخادم بمفاتيح المنصّة — لا تصل أي أسرار إلى المتصفّح. النتائج مخزّنة
        مؤقتًا احترامًا لحصص المزوّدين؛ زرّ التحديث يتجاوز الكاش. الذكاء الاصطناعي له صفحته
        الخاصة في هذا القسم.
      </p>
    </div>
  );
}
