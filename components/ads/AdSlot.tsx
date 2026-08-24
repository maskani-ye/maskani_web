"use client";

// ─── وحدة إعلان AdSense ─────────────────────────────────────────────────────
// سياسة الكثافة مقصودة: **خفيفة** في صفحات المنصّة (إعلان واحد أسفل القائمة لا
// يزاحم العقارات ولا يكسر الثقة)، و**كثيفة** داخل المدونة (أعلى المقال ووسطه
// وأسفله) لأن قارئ المقال جاء ليقرأ لا ليتصفّح عقاراً، وهو المكان الذي يدرّ
// فعلاً في المحتوى الطويل.
//
// الوحدة لا تعرض شيئاً بلا معرّف شريحة (`slot`) — فبقاء متغيّر البيئة فارغاً
// يعني «لا إعلان» بهدوء، لا مربّعاً فارغاً في الصفحة.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AD_CLIENT, adsEnabled, isAdFreePath } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * وحدة إعلانية.
 *
 * ⚠️ **`hasContent` ليست خياراً تجميلياً بل شرط سياسة.** تمنع سياسات ناشري جوجل
 * صراحةً عرض الإعلانات على «شاشات بلا محتوى ناشر أو بمحتوى قليل القيمة» — وقد
 * عوقب بها موقعٌ آخر في الحساب نفسه بالحرف: «الإعلانات التي تعرضها Google على
 * الشاشات بدون محتوى الناشر، محتوى غير ذي قيمة».
 *
 * كنّا نعرض وحدةً أسفل قائمة العقارات **حتى حين لا نتيجة فيها** — أي إعلانٌ على
 * صفحة فارغة حرفياً. فصار المكوّن يرفض الظهور ما لم يُصرّح المستدعي بوجود محتوى.
 *
 * القاعدة: مرّر `hasContent={items.length > 0 && !loading}` — ولا تمرّر `true`
 * ثابتةً إلّا في صفحة محتواها مضمون (مقال، صفحة تفاصيل).
 */
export function AdSlot({
  slot,
  format = "auto",
  layout,
  className = "",
  label = true,
  hasContent = true,
}: {
  /** معرّف الشريحة من لوحة AdSense — بدونه لا يُعرض شيء */
  slot?: string;
  format?: string;
  /** in-article للوحدة داخل نصّ المقال */
  layout?: string;
  className?: string;
  /** إظهار كلمة «إعلان» فوق الوحدة — شفافية تحفظ ثقة القارئ */
  label?: boolean;
  /** هل في الصفحة محتوى فعليّ الآن؟ لا إعلان على شاشة فارغة أو قيد التحميل. */
  hasContent?: boolean;
}) {
  const pathname = usePathname();
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || !adsEnabled || !hasContent || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* حاجب إعلانات أو سكربت لم يُحمَّل — لا شيء نفعله */
    }
  }, [slot, hasContent]);

  if (!slot || !adsEnabled || !hasContent || isAdFreePath(pathname)) return null;

  return (
    <div className={`my-6 ${className}`}>
      {label && (
        <p className="text-[10px] text-gray-400 mb-1 text-center tracking-wide">إعلان</p>
      )}
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { "data-ad-layout": layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
}
