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
import { Settings, Phone, DangerTriangle, Smartphone } from "@solar-icons/react";
import { toast } from "sonner";

interface Config {
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
