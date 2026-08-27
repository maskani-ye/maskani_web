"use client";

/**
 * ملفّ المستخدم الكامل في لوحة الويب — كل ما يعرفه النظام عن شخص واحد.
 *
 * خمسة تبويبات لأن الأسئلة خمسة ومختلفة: **من هو** (الهويّة والصلاحيات)،
 * **ماذا يفعل** (سلوك مُجمَّع)، **متى بالضبط** (سجلّ خام)، **من أين** (أجهزة)،
 * **وهل هو داخل الآن** (جلسات). خلطها في صفحة واحدة يجعل الثلاثة الأخيرة ضجيجاً
 * يُمرَّر بالتمرير، وهي التي يُحتاج إليها عند الشكّ في حساب.
 *
 * ⚠️ **الدولة تُعرض مع مصدرها دائماً**: قرار إنفاقٍ تسويقيّ يُبنى على «مفتاح
 * هاتف» ليس كقرارٍ يُبنى على مدينة اختارها المستخدم بنفسه، ومغتربٌ في الرياض
 * يحمل رقماً يمنياً يُحسَب يمنياً إن لم نقل من أين جاء الرقم.
 *
 * ⚠️ **الفراغ في «السلوك» أو «الأجهزة» ليس بالضرورة عطلاً**: الجهاز يُسجَّل عند
 * منح إذن الإشعارات فقط، والسلوك يُرصد بعد أوّل استخدام. لذلك نكتب سبب الفراغ
 * في مكانه بدل ترك المشرف يظنّ أن الرصد معطّل.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatPrice, formatNumber, NUMERIC_LOCALE } from "@/lib/utils";
import { toast } from "sonner";
import {
  AltArrowRight, Buildings2, ClipboardList, DangerTriangle, MapPoint,
  Settings, Star, UsersGroupRounded, UserPlus, CaseMinimalistic,
  CheckCircle, Global, Phone, CalendarMark, Smartphone, Login3,
  ChartSquare, Letter, ClockCircle, Eye, Bolt, Magnifer, TrashBinMinimalistic,
} from "@solar-icons/react";

// ── أنواع ──────────────────────────────────────────────────────────────────
interface Stats {
  properties: number; services: number; requests: number;
  service_requests: number; reports: number; ratings: number;
  followers: number; following: number;
  devices: number; sessions_active: number; visits: number;
}
interface RecentRow {
  id: number; title?: string; price?: string | number | null;
  currency?: string | null; status?: string; rating?: number;
  comment?: string; city_name?: string | null; created_at?: string;
}
interface Detail {
  id: number; full_name: string; phone: string; avatar: string | null;
  role: string; is_service_provider: boolean; is_verified: boolean;
  is_active: boolean; is_staff: boolean; city_name?: string | null;
  email?: string; bio?: string; has_google?: boolean;
  last_login?: string | null; last_seen_at?: string | null; updated_at?: string;
  response_rate?: number | null; response_minutes?: number | null; response_sample?: number;
  country_code?: string; country_name?: string; country_source?: string;
  created_at: string;
  stats: Stats;
  recent: Record<string, RecentRow[]>;
}
interface Behavior {
  first_seen: string | null; last_seen: string | null;
  sessions: number; views: number; events: number; active_days: number;
  contact_attempts: number; searches: number;
  by_day: { day: string; n: number }[];
  top_paths: { path: string; n: number }[];
  top_events: { event_name: string; n: number }[];
  platforms: { platform: string; n: number }[];
  devices: { device_type: string; n: number }[];
  os: { os: string; n: number }[];
  browsers: { browser: string; n: number }[];
  countries: { country: string; n: number }[];
  regions: { region: string; n: number }[];
}
interface DeviceRow {
  id: number; platform: string; device_uid: string; active: boolean;
  device_info: Record<string, unknown> | string; created_at: string; updated_at: string;
}
interface SessionRow {
  id: string; token_key: string; created: string; expiry: string | null; expired: boolean;
}
interface ActivityRow {
  id: number; path: string; kind: string; event_name: string;
  target_type: string; target_id: number | null;
  device_type: string; os: string; browser: string;
  city: string; country: string; created_at: string;
}

/** كل مصدر ودرجة ثقته — تُعرض للمشرف كي لا يبني قراراً على تخمين يظنّه حقيقة. */
const SOURCE_LABEL: Record<string, { text: string; variant: "success" | "info" | "warning" }> = {
  city: { text: "من مدينته المختارة", variant: "success" },
  phone: { text: "من مفتاح هاتفه", variant: "info" },
  visit: { text: "من آخر زيارة (IP)", variant: "warning" },
};

const EVENT_AR: Record<string, string> = {
  contact_click: "ضغط تواصل", whatsapp_click: "واتساب", call_click: "اتصال",
  chat_started: "بدأ محادثة", search: "بحث", favorite_added: "أضاف للمفضّلة",
  property_created: "نشر عقاراً", service_created: "نشر خدمة",
  request_created: "نشر طلباً", offer_submitted: "أرسل عرضاً",
  follow_user: "تابع مستخدماً", share_click: "مشاركة",
};

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString(NUMERIC_LOCALE, { year: "numeric", month: "long", day: "numeric" }) : "—";
const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString(NUMERIC_LOCALE, { dateStyle: "short", timeStyle: "short" }) : "—";

type Tab = "overview" | "behavior" | "activity" | "devices" | "sessions";

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "نظرة عامة", Icon: UsersGroupRounded },
  { key: "behavior", label: "السلوك", Icon: ChartSquare },
  { key: "activity", label: "سجلّ النشاط", Icon: ClockCircle },
  { key: "devices", label: "الأجهزة", Icon: Smartphone },
  { key: "sessions", label: "الجلسات", Icon: Login3 },
];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [u, setU] = useState<Detail | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

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
            <p className="text-caption text-muted mt-0.5">#{formatNumber(u.id)}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {u.role === "admin" && <Badge variant="warning">مشرف</Badge>}
              {u.is_verified && <Badge variant="success">موثّق</Badge>}
              {u.is_service_provider && <Badge variant="info">مزوّد خدمة</Badge>}
              {u.has_google && <Badge variant="default">حساب جوجل</Badge>}
              {!u.is_active && <Badge variant="danger">معطّل</Badge>}
              {u.stats.sessions_active > 0 && (
                <Badge variant="success">{formatNumber(u.stats.sessions_active)} جلسة حيّة</Badge>
              )}
            </div>
            {u.bio && <p className="text-caption text-muted mt-2 leading-relaxed">{u.bio}</p>}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 mt-6 pt-5 border-t border-ink/[0.06]">
          <Row Icon={Phone} label="الهاتف" value={u.phone || "لم يُكمل التسجيل"} dir="ltr" />
          <Row Icon={Letter} label="البريد" value={u.email || "—"} dir="ltr" />
          <Row Icon={MapPoint} label="المدينة" value={u.city_name || "لم يخترها"} />
          <Row
            Icon={Global}
            label="الدولة"
            value={u.country_name || "غير معروفة"}
            extra={src ? <Badge variant={src.variant}>{src.text}</Badge> : undefined}
          />
          <Row Icon={CalendarMark} label="انضمّ في" value={fmtDate(u.created_at)} />
          <Row Icon={ClockCircle} label="آخر دخول" value={fmtDateTime(u.last_login)} />
          <Row Icon={Eye} label="آخر ظهور" value={fmtDateTime(u.last_seen_at)} />
          <Row
            Icon={Bolt}
            label="سرعة الردّ"
            value={
              u.response_sample && u.response_minutes
                ? `${formatNumber(u.response_minutes)} دقيقة (${formatNumber(u.response_sample)} محادثة)`
                : "لا عيّنة كافية"
            }
          />
        </dl>
      </section>

      {/* ─── التبويبات ─────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 h-10 rounded-xl text-caption font-bold whitespace-nowrap transition-colors ${
              tab === key ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-ink/[0.06] hover:bg-primary/5"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview u={u} saving={saving} patch={patch} />}
      {tab === "behavior" && <BehaviorTab id={id} />}
      {tab === "activity" && <ActivityTab id={id} />}
      {tab === "devices" && <DevicesTab id={id} />}
      {tab === "sessions" && <SessionsTab id={id} onRevoked={load} />}
    </div>
  );
}

// ── نظرة عامة ──────────────────────────────────────────────────────────────
function Overview({ u, saving, patch }: {
  u: Detail; saving: boolean; patch: (b: Record<string, unknown>) => Promise<void>;
}) {
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
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(([label, value, Icon]) => (
          <div key={label} className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-4">
            <Icon weight="Bold" className="h-5 w-5 text-primary/60" />
            <p className="text-h2 text-ink tabular-nums mt-2">{formatNumber(value)}</p>
            <p className="text-caption text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5">
        <h2 className="text-h3 text-ink mb-4">صلاحيات وحالة</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={u.is_verified ? "outline" : "primary"} loading={saving}
            onClick={() => patch({ is_verified: !u.is_verified })}>
            <CheckCircle className="h-4 w-4" />
            {u.is_verified ? "إلغاء التوثيق" : "توثيق"}
          </Button>
          <Button size="sm" variant={u.is_service_provider ? "outline" : "primary"} loading={saving}
            onClick={() => patch({ is_service_provider: !u.is_service_provider })}>
            {u.is_service_provider ? "إلغاء صفة مزوّد خدمة" : "جعله مزوّد خدمة"}
          </Button>
          <Button size="sm" variant={u.role === "admin" ? "outline" : "primary"} loading={saving}
            onClick={() => patch({ role: u.role === "admin" ? "user" : "admin" })}>
            {u.role === "admin" ? "سحب صلاحية الإدارة" : "ترقية إلى مشرف"}
          </Button>
          <Button size="sm" variant={u.is_active ? "danger" : "primary"} loading={saving}
            onClick={() => patch({ is_active: !u.is_active })}>
            {u.is_active ? "تعطيل الحساب" : "تفعيل الحساب"}
          </Button>
        </div>
      </section>

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

// ── السلوك ─────────────────────────────────────────────────────────────────
function BehaviorTab({ id }: { id: string }) {
  const [b, setB] = useState<Behavior | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.get<Behavior>(endpoints.admin.userBehavior(id))
      .then((r) => setB(r.data))
      .catch(() => setErr(true));
  }, [id]);

  if (err) return <Empty text="تعذّر جلب تحليل السلوك" />;
  if (!b) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const nothing = b.views === 0 && b.events === 0;
  const peak = Math.max(1, ...b.by_day.map((d) => d.n));

  return (
    <div className="space-y-5">
      {nothing && (
        <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 text-caption text-amber-800 leading-relaxed">
          لا سلوك مرصود لهذا المستخدم. الرصد يبدأ من أوّل استخدام بعد تسجيل الدخول —
          فالحساب الذي أُنشئ ولم يُستعمل يظهر فارغاً، وهذا وصفٌ صحيح لا خلل.
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat Icon={Eye} label="مشاهدات" value={b.views} />
        <MiniStat Icon={Bolt} label="أحداث" value={b.events} />
        <MiniStat Icon={Login3} label="جلسات" value={b.sessions} />
        <MiniStat Icon={CalendarMark} label="أيّام نشطة" value={b.active_days} />
        <MiniStat Icon={Phone} label="محاولات تواصل" value={b.contact_attempts} tone="primary" />
        <MiniStat Icon={Magnifer} label="عمليات بحث" value={b.searches} />
        <div className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-4 col-span-2">
          <p className="text-caption text-muted">أوّل ظهور ← آخر ظهور</p>
          <p className="text-body font-semibold text-ink mt-1">
            {fmtDate(b.first_seen)} ← {fmtDate(b.last_seen)}
          </p>
        </div>
      </section>

      {b.by_day.length > 0 && (
        <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5">
          <h2 className="text-h3 text-ink mb-4">نشاطه خلال ٣٠ يوماً</h2>
          <div className="flex items-end gap-1 h-32">
            {b.by_day.map((d) => (
              <div key={d.day} className="flex-1 min-w-0 group relative">
                <div
                  className="bg-primary/70 hover:bg-primary rounded-t transition-colors"
                  style={{ height: `${Math.max(4, (d.n / peak) * 128)}px` }}
                  title={`${d.day}: ${formatNumber(d.n)}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList title="أكثر ما يفتحه" rows={b.top_paths.map((r) => [r.path, r.n])} ltr />
        <TopList title="أكثر أفعاله" rows={b.top_events.map((r) => [EVENT_AR[r.event_name] || r.event_name, r.n])} />
        <TopList title="المنصّات" rows={b.platforms.map((r) => [r.platform, r.n])} />
        <TopList title="نوع الجهاز" rows={b.devices.map((r) => [r.device_type, r.n])} />
        <TopList title="نظام التشغيل" rows={b.os.map((r) => [r.os, r.n])} ltr />
        <TopList title="المتصفّح" rows={b.browsers.map((r) => [r.browser, r.n])} ltr />
        <TopList title="الدول" rows={b.countries.map((r) => [r.country, r.n])} />
        <TopList title="المحافظات" rows={b.regions.map((r) => [r.region, r.n])} />
      </div>
    </div>
  );
}

// ── سجلّ النشاط ────────────────────────────────────────────────────────────
function ActivityTab({ id }: { id: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const LIMIT = 30;

  useEffect(() => {
    setLoading(true);
    api.get<{ count: number; results: ActivityRow[] }>(endpoints.admin.userActivity(id),
      { params: { offset, limit: LIMIT } })
      .then((r) => { setRows(r.data.results || []); setCount(r.data.count || 0); })
      .catch(() => toast.error("تعذّر جلب السجلّ"))
      .finally(() => setLoading(false));
  }, [id, offset]);

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (!rows.length) return <Empty text="لا نشاط مسجَّل لهذا المستخدم بعد" />;

  return (
    <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] overflow-hidden">
      <div className="px-5 py-3 border-b border-ink/[0.06] flex items-center justify-between">
        <h2 className="text-h3 text-ink">سجلّ النشاط</h2>
        <span className="text-caption text-muted">{formatNumber(count)} سجلّاً</span>
      </div>
      <ul className="divide-y divide-ink/[0.06]">
        {rows.map((r) => (
          <li key={r.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
            <Badge variant={r.kind === "event" ? "info" : "default"}>
              {r.kind === "event" ? EVENT_AR[r.event_name] || r.event_name : "مشاهدة"}
            </Badge>
            <span dir="ltr" className="text-caption text-ink font-mono truncate flex-1 min-w-0 text-left">
              {r.path}
            </span>
            <span className="text-caption text-muted">
              {[r.device_type, r.os, r.browser].filter(Boolean).join(" · ") || "—"}
            </span>
            <span className="text-caption text-muted">{fmtDateTime(r.created_at)}</span>
          </li>
        ))}
      </ul>
      {count > LIMIT && (
        <div className="px-5 py-3 flex items-center justify-between border-t border-ink/[0.06]">
          <Button size="sm" variant="outline" disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}>السابق</Button>
          <span className="text-caption text-muted">
            {formatNumber(offset + 1)}–{formatNumber(Math.min(offset + LIMIT, count))}
          </span>
          <Button size="sm" variant="outline" disabled={offset + LIMIT >= count}
            onClick={() => setOffset((o) => o + LIMIT)}>التالي</Button>
        </div>
      )}
    </section>
  );
}

// ── الأجهزة ────────────────────────────────────────────────────────────────
function DevicesTab({ id }: { id: string }) {
  const [rows, setRows] = useState<DeviceRow[] | null>(null);

  useEffect(() => {
    api.get<DeviceRow[]>(endpoints.admin.userDevices(id))
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRows([]));
  }, [id]);

  if (!rows) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!rows.length) {
    return (
      <Empty text="لا أجهزة مسجَّلة — الجهاز يُسجَّل حين يمنح المستخدم إذن الإشعارات فقط، فرفضُه أو تجاهلُه يترك القائمة فارغة." />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((d) => (
        <div key={d.id} className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-4 flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
            <Smartphone weight="Bold" className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body font-semibold text-ink">{d.platform || "جهاز"}</span>
              <Badge variant={d.active ? "success" : "default"}>{d.active ? "نشِط" : "غير نشِط"}</Badge>
            </div>
            <p dir="ltr" className="text-caption text-muted font-mono truncate text-left mt-0.5">
              {d.device_uid || "—"}
            </p>
            <p className="text-caption text-muted mt-1">
              سُجِّل {fmtDate(d.created_at)} · آخر تحديث {fmtDateTime(d.updated_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── الجلسات ────────────────────────────────────────────────────────────────
function SessionsTab({ id, onRevoked }: { id: string; onRevoked: () => void }) {
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get<SessionRow[]>(endpoints.admin.userSessions(id))
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRows([]));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const revoke = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete<{ revoked: number }>(endpoints.admin.userSessions(id));
      toast.success(`أُنهيت ${formatNumber(data.revoked)} جلسة`);
      setConfirm(false); load(); onRevoked();
    } catch {
      toast.error("تعذّر إنهاء الجلسات");
    } finally { setBusy(false); }
  };

  if (!rows) return <Skeleton className="h-40 w-full rounded-2xl" />;

  const live = rows.filter((r) => !r.expired);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-caption text-muted">
          {live.length
            ? `${formatNumber(live.length)} جلسة حيّة من ${formatNumber(rows.length)} — كل جلسة جهاز سجّل الدخول منه.`
            : "لا جلسات حيّة — المستخدم غير مسجَّل دخول على أي جهاز الآن."}
        </p>
        {live.length > 0 && (
          <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
            <TrashBinMinimalistic className="h-4 w-4" /> إنهاء كل الجلسات
          </Button>
        )}
      </div>

      {rows.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-4 flex items-center gap-3 flex-wrap">
          <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
            <Login3 weight="Bold" className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span dir="ltr" className="text-caption font-mono text-ink">{s.token_key}</span>
              <Badge variant={s.expired ? "default" : "success"}>{s.expired ? "منتهية" : "حيّة"}</Badge>
            </div>
            <p className="text-caption text-muted mt-0.5">
              بدأت {fmtDateTime(s.created)} · تنتهي {fmtDateTime(s.expiry)}
            </p>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={confirm}
        icon={<TrashBinMinimalistic className="h-6 w-6 text-red-500" />}
        title="إنهاء كل جلسات المستخدم؟"
        message="سيُخرَج من كل أجهزته ويحتاج تسجيل دخول جديداً. يُستعمل عند الشكّ في اختراق الحساب."
        variant="danger" confirmLabel="إنهاء الجلسات" loading={busy}
        onConfirm={revoke} onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

// ── لبنات مشتركة ───────────────────────────────────────────────────────────
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

function MiniStat({ Icon, label, value, tone }: {
  Icon: React.ElementType; label: string; value: number; tone?: "primary";
}) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-4">
      <Icon weight="Bold" className={`h-5 w-5 ${tone === "primary" ? "text-primary" : "text-primary/60"}`} />
      <p className="text-h2 text-ink tabular-nums mt-2">{formatNumber(value)}</p>
      <p className="text-caption text-muted mt-0.5">{label}</p>
    </div>
  );
}

function TopList({ title, rows, ltr }: {
  title: string; rows: [string, number][]; ltr?: boolean;
}) {
  if (!rows.length) return null;
  const peak = Math.max(...rows.map(([, n]) => n));
  return (
    <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5">
      <h2 className="text-h3 text-ink mb-3">{title}</h2>
      <ul className="space-y-2">
        {rows.map(([label, n]) => (
          <li key={label}>
            <div className="flex items-center justify-between gap-3 text-caption">
              <span className={`text-ink truncate ${ltr ? "font-mono text-left" : ""}`} dir={ltr ? "ltr" : undefined}>
                {label}
              </span>
              <span className="text-muted tabular-nums shrink-0">{formatNumber(n)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/[0.05] mt-1 overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(n / peak) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-ink/[0.06] py-12 px-6 text-center">
      <p className="text-caption text-muted leading-relaxed max-w-md mx-auto">{text}</p>
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
