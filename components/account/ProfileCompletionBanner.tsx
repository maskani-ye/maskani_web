"use client";

// ─── ProfileCompletionBanner ─────────────────────────────────────────────────
// شريط ترغيب لطيف (لا إجبار) يظهر للمستخدم المسجّل الذي لم يُكمل هاتفه/مدينته،
// ويوجّهه لصفحة الملف لإكمالها. قابل للإغلاق ويُخزَّن الإغلاق في sessionStorage
// حتى لا يتكرّر في الجلسة نفسها.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MapPoint, CloseCircle } from "@solar-icons/react";

const DISMISS_KEY = "maskani_profile_banner_dismissed";

export function ProfileCompletionBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!user || !user.profile_incomplete || dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* تجاهل */
    }
    setDismissed(true);
  };

  return (
    <div className="bg-primary/5 border-b border-primary/10">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-2.5 text-body">
        <MapPoint className="h-4 w-4 text-primary shrink-0" />
        <p className="text-muted-700 flex-1">
          أكمل رقم هاتفك ومدينتك ليتمكّن أصحاب العقارات من التواصل معك — اختياري.
        </p>
        <Link
          href="/profile"
          className="text-primary font-semibold whitespace-nowrap hover:underline"
        >
          إكمال الملف
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="إغلاق"
          className="text-muted hover:text-muted-600 shrink-0"
        >
          <CloseCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
