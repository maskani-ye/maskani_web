"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { getPushToken } from "@/lib/push";
import { toast } from "sonner";
import { Bell, CheckCircle } from "@solar-icons/react";

// اشتراك الزائر في تنبيهات مدينة — بلا تسجيل دخول.
//
// الأرقام التي أوجبته: 2,335 زيارة أسبوعياً · مستخدم واحد عاد · صفر بحث محفوظ
// (لأن حفظ البحث يشترط حساباً). هذا الزرّ يطلب إذن المتصفّح فقط: نقرة واحدة،
// بلا اسم ولا هاتف ولا بريد — ويعود الزائر من تلقائه حين ينزل عقار يخصّه.
export default function CityAlertButton({
  cityId, cityName, offerType,
}: { cityId: number | string; cityName: string; offerType?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function subscribe() {
    setState("busy");
    const token = await getPushToken();
    if (!token) {
      // الرفض قرارُ مستخدم لا عطل — نوضّح بلا لوم ولا تكرار للطلب.
      toast.error("لتفعيل التنبيه اسمح بالإشعارات من إعدادات المتصفّح");
      setState("idle");
      return;
    }
    try {
      await api.post("/notifications/guest-alerts/", {
        registration_id: token, city: cityId, offer_type: offerType || "",
      });
      toast.success(`سنُنبّهك بأي عقار جديد في ${cityName}`);
      setState("done");
    } catch {
      toast.error("تعذّر تفعيل التنبيه، حاول مرّة أخرى");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
        <CheckCircle weight="Bold" className="h-4 w-4" />
        التنبيه مُفعَّل لـ{cityName}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={state === "busy"}
      className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
    >
      <Bell className="h-4 w-4" />
      {state === "busy" ? "جارٍ التفعيل…" : `نبّهني بأي عقار جديد في ${cityName}`}
    </button>
  );
}
