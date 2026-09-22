"use client";

/**
 * إعدادات المنصّة — الحقول العامّة التي يقرأها المنتج ولا يملك أحدٌ تعبئتها.
 *
 * ⚠️ **سبب وجود هذه الشاشة**: `general_phone` بقي فارغاً منذ إنشائه، وزرّ
 * واتساب في صفحة المكاتب (`/offices`) مشروطٌ به — فكانت الصفحة المبنيّة لجذب
 * المكاتب العقارية **بلا وسيلة تواصل أصلاً**. الحقل الذي يقرؤه المنتج ولا
 * يُكتب من الواجهة حقلٌ ميّت.
 *
 * ⚠️ **وضع الصيانة يُغلق المنصّة على الجميع** — لذلك يقف خلف تأكيد صريح لا
 * مفتاح يُلمس سهواً.
 */

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Settings, Phone, DangerTriangle, Smartphone, Bell, BellOff } from "@solar-icons/react";
import { toast } from "sonner";

interface AlertType {
  key: string;
  label: string;
  group: string;
  high_volume: boolean;
  enabled: boolean;
}

interface Config {
  muted_admin_alerts: string[];
  admin_alert_types?: AlertType[];
  general_phone: string;
  latest_version: string;
  mandatory_update_after_opens: number;
  maintenance_mode: boolean;
  maintenance_return_time: string;
  updated_at?: string;
}

export default function AdminSettingsPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Config>(ep.admin.siteConfig);
      setCfg(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (body: Partial<Config>) => {
    setSaving(true);
    try {
      const { data } = await api.patch<Config>(ep.admin.siteConfig, body);
      setCfg(data);
      toast.success("حُفظ");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  if (!cfg) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const set = <K extends keyof Config>(k: K, v: Config[K]) =>
    setCfg((p) => (p ? { ...p, [k]: v } : p));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader icon={<Settings />} title="إعدادات المنصّة"
        subtitle="حقول عامّة يقرأها الموقع والتطبيقات" />

      {/* ── إشعارات الإدارة ──
          ⚠️ **الأنواع تأتي من الخادم لا من قائمةٍ هنا.** لو كُتبت في هذا
          الملفّ لانفصلت عن الخادم عند أوّل نوعٍ جديد: يصل الإشعار ولا يظهر
          له مفتاحٌ يُسكته. المصدر الواحد `notifications/admin_catalog.py`. */}
      <AdminAlertsSection cfg={cfg} saving={saving} onToggle={(key, on) => {
        const muted = new Set(cfg.muted_admin_alerts || []);
        if (on) muted.delete(key); else muted.add(key);
        patch({ muted_admin_alerts: [...muted] });
      }} />

      {/* ── التواصل ── */}
      <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5 space-y-4">
        <h2 className="text-h3 text-ink flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" /> رقم التواصل العام
        </h2>
        <p className="text-caption text-muted leading-relaxed">
          يظهر كزرّ واتساب في صفحة المكاتب العقارية <code dir="ltr">/offices</code>.
          بلا رقم لا يظهر الزرّ إطلاقاً — والصفحة تفقد غرضها.
        </p>
        <Input value={cfg.general_phone} dir="ltr" placeholder="+967716080096"
          onChange={(e) => set("general_phone", e.target.value)} />
        <Button loading={saving} onClick={() => patch({ general_phone: cfg.general_phone.trim() })}>
          حفظ الرقم
        </Button>
      </section>

      {/* ── التطبيقات ── */}
      <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5 space-y-4">
        <h2 className="text-h3 text-ink flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" /> إصدار التطبيق
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="أحدث إصدار" value={cfg.latest_version} dir="ltr"
            onChange={(e) => set("latest_version", e.target.value)} placeholder="1.0.12" />
          <Input label="فتحات قبل إجبار التحديث" type="number"
            value={String(cfg.mandatory_update_after_opens)}
            onChange={(e) => set("mandatory_update_after_opens", Number(e.target.value))} />
        </div>
        <Button variant="outline" loading={saving}
          onClick={() => patch({
            latest_version: cfg.latest_version.trim(),
            mandatory_update_after_opens: cfg.mandatory_update_after_opens,
          })}>
          حفظ إعدادات التطبيق
        </Button>
      </section>

      {/* ── الصيانة ── */}
      <section className={`rounded-2xl p-5 space-y-4 ring-1 ${cfg.maintenance_mode ? "bg-warning-50 ring-warning-200" : "bg-white ring-ink/[0.06]"}`}>
        <h2 className="text-h3 text-ink flex items-center gap-2">
          <DangerTriangle className="h-5 w-5 text-warning-600" /> وضع الصيانة
        </h2>
        <p className="text-caption text-muted leading-relaxed">
          تفعيله يُغلق المنصّة أمام **كل** المستخدمين ويعرض رسالة انتظار. لا
          تُفعّله إلا أثناء عمل يستدعيه فعلاً.
        </p>
        <Input label="موعد العودة (نصّ يُعرض للمستخدم)" value={cfg.maintenance_return_time}
          onChange={(e) => set("maintenance_return_time", e.target.value)}
          placeholder="خلال ساعة إن شاء الله" />
        <Button variant={cfg.maintenance_mode ? "primary" : "danger"} loading={saving}
          onClick={() => (cfg.maintenance_mode
            ? patch({ maintenance_mode: false, maintenance_return_time: cfg.maintenance_return_time })
            : setConfirmMaintenance(true))}>
          {cfg.maintenance_mode ? "إنهاء وضع الصيانة" : "تفعيل وضع الصيانة"}
        </Button>
      </section>

      <ConfirmDialog
        open={confirmMaintenance}
        icon={<DangerTriangle className="h-6 w-6 text-danger-500" />}
        title="إغلاق المنصّة للصيانة؟"
        message="سيُمنع كل المستخدمين من الدخول حتى تُنهي الوضع بنفسك."
        variant="danger" confirmLabel="أغلق المنصّة" loading={saving}
        onConfirm={() => {
          setConfirmMaintenance(false);
          patch({ maintenance_mode: true, maintenance_return_time: cfg.maintenance_return_time });
        }}
        onCancel={() => setConfirmMaintenance(false)}
      />
    </div>
  );
}


/** قسم إشعارات الإدارة — مفتاحٌ لكل نوع، مجموعةً مجموعة. */
function AdminAlertsSection({
  cfg, saving, onToggle,
}: {
  cfg: Config;
  saving: boolean;
  onToggle: (key: string, enabled: boolean) => void;
}) {
  const types = cfg.admin_alert_types ?? [];
  if (!types.length) return null;

  const groups = types.reduce<Record<string, AlertType[]>>((acc, t) => {
    (acc[t.group] ||= []).push(t);
    return acc;
  }, {});
  const onCount = types.filter((t) => t.enabled).length;

  return (
    <section className="bg-white rounded-2xl ring-1 ring-ink/[0.06] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="flex items-center gap-2 text-body font-bold text-ink">
            <Bell className="h-4 w-4 text-primary" />
            إشعارات الإدارة
          </h2>
          <p className="text-caption text-muted mt-1">
            تصل كل حساب مشرف على أجهزته، ولها سجلّ دائم في الإشعارات.
          </p>
        </div>
        <span className="text-caption text-muted-500">
          {onCount} مفعّل من {types.length}
        </span>
      </div>

      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="space-y-2">
          <p className="text-caption font-bold text-muted-600">{group}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {items.map((t) => (
              <button
                key={t.key}
                type="button"
                disabled={saving}
                onClick={() => onToggle(t.key, !t.enabled)}
                className={`flex items-start gap-2.5 text-right p-3 rounded-xl ring-1 transition-colors disabled:opacity-60 ${
                  t.enabled
                    ? "ring-primary/30 bg-primary/[0.04] hover:bg-primary/[0.08]"
                    : "ring-muted-200 bg-muted-50 hover:bg-muted-100"
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${t.enabled ? "text-primary" : "text-muted"}`}>
                  {t.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-body font-medium text-ink">{t.label}</span>
                  {/* ⚠️ الوسم تحذيرٌ لا منع: المالك يقرّر، لكن لا يُفاجأ. */}
                  {t.high_volume && (
                    <span className="block text-micro text-warning-700 mt-0.5">
                      عالي التواتر — قد يصل بالمئات يومياً
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
