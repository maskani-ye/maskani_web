"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ServerSquare, Refresh, AltArrowLeft, CheckCircle, CloseCircle } from "@solar-icons/react";
import { toast } from "sonner";

export interface ServiceStatus {
  key: string;
  name: string;
  role: string;
  ok: boolean;
  cached?: boolean;
  error?: string;
  [extra: string]: unknown;
}

/** سطر ملخّص لكل خدمة — رقم واحد دالّ بدل حشو الصفحة بالتفاصيل. */
function summarize(s: ServiceStatus): string {
  if (!s.ok) return s.error ?? "غير متاح";
  switch (s.key) {
    case "oracle":
      return `${s.running ?? 0} خادم يعمل من ${s.instance_count ?? 0}`;
    case "aws": {
      const cost = s.month_to_date_cost as { amount: number; unit: string } | null;
      const costTxt = cost ? ` · ${cost.amount.toFixed(2)} ${cost.unit}` : "";
      return `${s.running ?? 0} مثيل يعمل${costTxt}`;
    }
    case "r2": {
      const mb = ((s.total_bytes as number) ?? 0) / 1048576;
      return `${s.total_files ?? 0} ملف · ${mb.toFixed(1)} م.ب · ${s.backups_count ?? 0} نسخة احتياطية`;
    }
    case "neon":
      return `${s.projects_count ?? 0} مشروع · ${s.storage_mb ?? 0} م.ب تخزين · الحصّة الشهرية ${s.compute_hours_quota_monthly ?? 0} ساعة`;
    case "vercel": {
      const last = s.last_production as { state?: string } | null;
      return `آخر نشر: ${last?.state ?? "—"} · ${s.failed_recent ?? 0} فشل حديث`;
    }
    case "cloudflare": {
      const zones = (s.zones as { name: string }[]) ?? [];
      return `${zones.length} نطاق مُدار`;
    }
    case "porkbun": {
      const d = ((s.domains as { domain: string; expires: string }[]) ?? [])[0];
      return d ? `${d.domain} — ينتهي ${d.expires?.slice(0, 10)}` : "—";
    }
    case "github": {
      const repos = (s.repos as { last_conclusion?: string }[]) ?? [];
      const failed = repos.filter((r) => r.last_conclusion === "failure").length;
      return failed ? `${failed} مستودع آخر تشغيله فاشل` : `${repos.length} مستودع — كلها ناجحة`;
    }
    case "openrouter": {
      const bal = s.balance as { remaining?: number } | null;
      const rem = bal?.remaining != null ? `${bal.remaining.toFixed(2)}$ متبقٍ · ` : "";
      return `${rem}${s.requests_30d ?? 0} طلب · ${s.tokens_30d ?? 0} توكن (30 يومًا)`;
    }
    case "firebase":
      return `${s.devices_active ?? 0} جهاز نشط · ${s.notifications_30d ?? 0} إشعار (30 يومًا)`;
    case "play": {
      const apps = (s.apps as { package: string; error?: string }[]) ?? [];
      const bad = apps.filter((a) => a.error).length;
      return bad ? `${bad} تطبيق تعذّرت قراءته` : `${apps.length} تطبيق منشور`;
    }
    case "gsc":
      return `${s.clicks_30d ?? 0} نقرة · ${s.impressions_30d ?? 0} ظهور (30 يومًا)`;
    default:
      return "";
  }
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

  useEffect(() => { load(); }, [load]);

  const healthy = services.filter((s) => s.ok).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          icon={<ServerSquare />}
          title="البنية والخدمات"
          subtitle={loading ? "جارٍ الفحص…" : `${healthy} من ${services.length} خدمة سليمة`}
        />
        <Button variant="outline" onClick={() => load(true)} loading={refreshing}>
          <Refresh className="h-4 w-4" /> تحديث
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <Link
              key={s.key}
              href={`/admin/infrastructure/${s.key}`}
              className="flex items-center gap-4 bg-white rounded-2xl card-shadow p-4 hover:border-primary/40 border border-transparent transition-colors"
            >
              {s.ok ? (
                <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
              ) : (
                <CloseCircle className="h-6 w-6 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink flex items-center gap-2">
                  {s.name}
                  <span className="text-xs font-normal text-gray-400">{s.role}</span>
                </p>
                <p className={`text-sm mt-0.5 truncate ${s.ok ? "text-gray-600" : "text-red-600"}`}>
                  {summarize(s)}
                </p>
              </div>
              {s.cached && <Badge variant="default">مخزَّن</Badge>}
              <AltArrowLeft className="h-4 w-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 leading-relaxed">
        القراءة تجري في الخادم بمفاتيح المنصّة — لا تصل أي أسرار إلى المتصفّح.
        النتائج مخزّنة مؤقتًا خمس دقائق احترامًا لحصص المزوّدين؛ زرّ التحديث يتجاوز الكاش.
      </p>
    </div>
  );
}
