"use client";

/**
 * تفاصيل المستخدم في لوحة الويب — مطابقة لشاشة تطبيق الإدارة في المحتوى.
 *
 * ⚠️ **الدولة هي سبب وجود هذه الصفحة**: يحتاج المشرف بلد كل مستخدم ليبني حملة
 * تسويقية موجّهة. وهي تُستنتج من ثلاثة مصادر مختلفة الثقة، فنعرض **مصدرها
 * صراحةً** بجانبها: قرار إنفاقٍ يُبنى على «مفتاح هاتف» ليس كقرارٍ يُبنى على
 * مدينة اختارها المستخدم بنفسه، ومغتربٌ في الرياض يحمل رقماً يمنياً يُحسَب
 * يمنياً إن لم نقل من أين جاء الرقم.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice, NUMERIC_LOCALE } from "@/lib/utils";
import { toast } from "sonner";
import {
  AltArrowRight, Buildings2, ClipboardList, DangerTriangle, MapPoint,
  Settings, Star, UsersGroupRounded, UserPlus, CaseMinimalistic,
  CheckCircle, Global, Phone, CalendarMark,
} from "@solar-icons/react";

interface Stats {
  properties: number; services: number; requests: number;
  service_requests: number; reports: number; ratings: number;
  followers: number; following: number;
}
interface RecentRow {
  id: number; title?: string; price?: string | number | null;
  currency?: string | null; status?: string; rating?: number;
  comment?: string; city_name?: string | null; created_at?: string;
}
interface Detail {
  id: number; full_name: string; phone: string; avatar: string | null;
  role: string; is_service_provider: boolean; is_verified: boolean;
  is_active: boolean; city_name?: string | null;
  country_code?: string; country_name?: string; country_source?: string;
  created_at: string;
  stats: Stats;
  recent: Record<string, RecentRow[]>;
}

/** كل مصدر ودرجة ثقته — تُعرض للمشرف كي لا يبني قراراً على تخمين يظنّه حقيقة. */
const SOURCE_LABEL: Record<string, { text: string; variant: "success" | "info" | "warning" }> = {
  city: { text: "من مدينته المختارة", variant: "success" },
  phone: { text: "من مفتاح هاتفه", variant: "info" },
  visit: { text: "من آخر زيارة (IP)", variant: "warning" },
};

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString(NUMERIC_LOCALE, {
    year: "numeric", month: "long", day: "numeric",
  }) : "—";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [u, setU] = useState<Detail | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Detail>(endpoints.admin.user(id));
      setU(data);
    } catch {
      toast.error("تعذّر تحميل بيانات المستخدم");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api.patch(endpoints.admin.user(id), body);
      toast.success("حُفظ التعديل");
      await load();
    } catch {
      toast.error("تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (!u) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const src = u.country_source ? SOURCE_LABEL[u.country_source] : null;

  const STATS: Array<[string, number, React.ElementType]> = [
    ["العقارات", u.stats.properties, Buildings2],
    ["الخدمات", u.stats.services, Settings],
    ["طلبات عقارية", u.stats.requests, ClipboardList],
    ["طلبات الخدمة", u.stats.service_requests, CaseMinimalistic],
    ["البلاغات", u.stats.reports, DangerTriangle],
    ["التقييمات", u.stats.ratings, Star],
    ["المتابِعون", u.stats.followers, UsersGroupRounded],
    ["يتابع", u.stats.following, UserPlus],
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 text-caption font-bold text-primary hover:gap-2.5 transition-all"
      >
        <AltArrowRight className="h-4 w-4" />
        المستخدمون
      </button>

      {/* ─── الهوية ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-6">
        <div className="flex items-start gap-4">
          {u.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center">
              <UsersGroupRounded weight="Bold" className="h-7 w-7" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-h2 text-ink">{u.full_name || "بلا اسم"}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {u.role === "admin" && <Badge variant="warning">مشرف</Badge>}
              {u.is_verified && <Badge variant="success">موثّق</Badge>}
              {u.is_service_provider && <Badge variant="info">مزوّد خدمة</Badge>}
              {!u.is_active && <Badge variant="danger">معطّل</Badge>}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 mt-6 pt-5 border-t border-ink/[0.06]">
          <Row Icon={Phone} label="الهاتف" value={u.phone || "—"} dir="ltr" />
          <Row Icon={MapPoint} label="المدينة" value={u.city_name || "لم يخترها"} />
          <Row
            Icon={Global}
            label="الدولة"
            value={u.country_name || "غير معروفة"}
            extra={src ? <Badge variant={src.variant}>{src.text}</Badge> : undefined}
          />
          <Row Icon={CalendarMark} label="انضمّ في" value={fmtDate(u.created_at)} />
        </dl>
      </section>

      {/* ─── الأرقام ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(([label, value, Icon]) => (
          <div key={label} className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-4">
            <Icon weight="Bold" className="h-5 w-5 text-primary/60" />
            <p className="text-h2 text-ink tabular-nums mt-2">
              {value.toLocaleString(NUMERIC_LOCALE)}
            </p>
            <p className="text-caption text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </section>

      {/* ─── التحكّم ───────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5">
        <h2 className="text-h3 text-ink mb-4">صلاحيات وحالة</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={u.is_verified ? "outline" : "primary"}
            loading={saving}
            onClick={() => patch({ is_verified: !u.is_verified })}
          >
            <CheckCircle className="h-4 w-4" />
            {u.is_verified ? "إلغاء التوثيق" : "توثيق"}
          </Button>
          <Button
            size="sm"
            variant={u.is_service_provider ? "outline" : "primary"}
            loading={saving}
            onClick={() => patch({ is_service_provider: !u.is_service_provider })}
          >
            {u.is_service_provider ? "إلغاء صفة مزوّد خدمة" : "جعله مزوّد خدمة"}
          </Button>
          <Button
            size="sm"
            variant={u.is_active ? "danger" : "primary"}
            loading={saving}
            onClick={() => patch({ is_active: !u.is_active })}
          >
            {u.is_active ? "تعطيل الحساب" : "تفعيل الحساب"}
          </Button>
        </div>
      </section>

      {/* ─── أحدث ما نشره ─────────────────────────────────────────── */}
      <RecentBlock title="أحدث عقاراته" rows={u.recent.properties} href={(r) => `/properties/${r.id}`}
        render={(r) => `${r.title} — ${formatPrice(r.price, r.currency)}`} />
      <RecentBlock title="أحدث طلباته العقارية" rows={u.recent.requests} href={(r) => `/requests/${r.id}`}
        render={(r) => r.title || `طلب #${r.id}`} />
      <RecentBlock title="خدماته" rows={u.recent.services} href={(r) => `/services/${r.id}`}
        render={(r) => r.title || `خدمة #${r.id}`} />
      <RecentBlock title="بلاغاته" rows={u.recent.reports} href={(r) => `/reports/${r.id}`}
        render={(r) => r.title || `بلاغ #${r.id}`} />
      <RecentBlock title="تقييمات تلقّاها" rows={u.recent.ratings}
        render={(r) => `${r.rating}/5 — ${r.comment || "بلا تعليق"}`} />
    </div>
  );
}

function Row({ Icon, label, value, extra, dir }: {
  Icon: React.ElementType; label: string; value: string;
  extra?: React.ReactNode; dir?: "ltr";
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted mt-1 flex-shrink-0" />
      <div className="min-w-0">
        <dt className="text-caption text-muted">{label}</dt>
        <dd className="text-body font-semibold text-ink flex items-center gap-2 flex-wrap" dir={dir}>
          {value}
          {extra}
        </dd>
      </div>
    </div>
  );
}

function RecentBlock({ title, rows, render, href }: {
  title: string;
  rows?: RecentRow[];
  render: (r: RecentRow) => string;
  href?: (r: RecentRow) => string;
}) {
  if (!rows?.length) return null;
  return (
    <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5">
      <h2 className="text-h3 text-ink mb-3">{title}</h2>
      <ul className="divide-y divide-ink/[0.06]">
        {rows.map((r) => {
          const text = render(r);
          return (
            <li key={r.id} className="py-2.5 text-body text-ink">
              {href ? (
                <Link href={href(r)} className="hover:text-primary transition-colors line-clamp-1">
                  {text}
                </Link>
              ) : (
                <span className="line-clamp-1">{text}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
