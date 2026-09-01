"use client";

/**
 * غلاف البطاقات غير العقارية — الخدمة وطلب الخدمة والطلب العقاري.
 *
 * ⚠️ **الخلل الذي يحلّه هذا الملفّ بنيويّ لا تجميليّ.** كانت الثلاث مكتوبةً
 * **صفوفاً أفقية** (نصٌّ يمين ووصفٌ يسار) ثمّ وُضعت في شبكة أعمدةٍ ضيّقة:
 *
 *   • فتزدحم — أربعة عناصر تتنازع 260 بكسلاً فيُقصّ العنوان عند عشرين حرفاً،
 *     حتى صارت خمس بطاقات تقول «عبدالرحمن يبحث…» ولا تُميَّز عن بعضها.
 *   • **وترتفع ارتفاعاتٍ مختلفة** — شارةٌ ثانية تلتفّ في بعضها فينكسر الصفّ
 *     ويبدأ الصفّ التالي متعرّجاً.
 *   • ويعلّق سهمٌ (`‹`) في منتصف الحافة بلا وظيفة — من تخطيط الصفّ الأصليّ.
 *
 * الغلاف هنا يفرض ثلاثة أشياء تمنع عودة ذلك:
 *   ① **ارتفاع موحّد**: عمودٌ مرن (`flex-col h-full`) وذيلٌ يُدفع أسفله
 *      (`CARD_FOOT`) — فتستوي البطاقات مهما اختلف نصّها.
 *   ② **مرساة بصرية**: هذه الكيانات بلا صور، فبدلها كتلةُ أيقونةٍ ملوّنة
 *      تعطي البطاقة وزناً وتفرّق الأقسام بلونها.
 *   ③ **سطح واحد** مطابق لبطاقة العقار — فتبدو الأقسام الأربعة منتجاً واحداً.
 */

import type { ReactNode } from "react";

import { formatNumber } from "@/lib/utils";

/** سطح البطاقة — نفس سطح بطاقة العقار حرفياً. */
export const CARD_SHELL =
  "group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-e1 " +
  "ring-1 ring-ink/[0.06] transition-all hover:shadow-e3 hover:ring-ink/[0.10]";
/** حشو المحتوى. */
export const CARD_PAD = "flex flex-1 flex-col p-4";
/** الذيل — يُدفع إلى الأسفل فتتحاذى الخطوط السفلية عبر الصفّ. */
export const CARD_FOOT =
  "mt-auto flex items-center justify-between gap-2 border-t border-ink/[0.06] pt-3";

/** ألوان المرساة — لونٌ لكل قسم فيُعرف بلمحة. */
export const TONES = {
  primary: "bg-primary-50 text-primary-400",
  gold: "bg-gold-50 text-gold-700",
  ink: "bg-cream text-ink/60",
} as const;

export type Tone = keyof typeof TONES;

/** كتلة الأيقونة — بديل الصورة في كيانٍ لا صورة له. */
export function CardIcon({
  Icon,
  tone = "primary",
}: {
  Icon: React.ComponentType<{ className?: string; weight?: "Bold" | "Linear" }>;
  tone?: Tone;
}) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}
    >
      <Icon weight="Bold" className="h-5 w-5" />
    </span>
  );
}

/**
 * سطر «العروض» في الذيل.
 *
 * ⚠️ **«٠ عرض» كان أبرز عنصرٍ في البطاقة** — رقمٌ بوزنٍ ثقيل يقول «لا أحد
 * اهتمّ»، مكرّراً على تسع بطاقات. الصفر ليس رقماً يُعرض بل **فرصة تُعرض**:
 * حين لا عرض، تصير الجملة دعوةً؛ وحين توجد عروض يظهر عددها لأنّه حينئذٍ
 * إشارة رواج لا خذلان.
 */
export function OffersLine({ count }: { count: number }) {
  return count > 0 ? (
    <span className="text-caption font-bold text-primary-400">
      {formatNumber(count)} عرض
    </span>
  ) : (
    <span className="text-caption font-semibold text-gold-700">
      كن أوّل من يقدّم عرضاً
    </span>
  );
}

/** شارة صغيرة — تصنيف أو نوع. */
export function Chip({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-caption font-bold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * هيكل البطاقة — من الملفّ نفسه كي لا يفترق عن الشكل الحقيقيّ.
 *
 * ⚠️ درسٌ من بطاقة العقار: هيكلٌ منسوخ في صفحة القائمة تباعد عن بطاقته حتى
 * صارا شكلين مختلفين تماماً، فيرى الزائر الشبكة تتغيّر تحت عينه.
 */
export function CardSkeleton() {
  return (
    <div className={`${CARD_SHELL} animate-pulse`} aria-hidden>
      <div className={CARD_PAD}>
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-ink/[0.07]" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-4/5 rounded bg-ink/[0.07]" />
            <div className="mt-2 h-3 w-2/5 rounded bg-ink/[0.05]" />
          </div>
        </div>
        <div className="mt-4 h-7 w-1/2 rounded bg-ink/[0.07]" />
        <div className="mt-2 h-3.5 w-3/5 rounded bg-ink/[0.05]" />
        <div className={CARD_FOOT}>
          <div className="h-3.5 w-24 rounded bg-ink/[0.05]" />
          <div className="h-3.5 w-16 rounded bg-ink/[0.05]" />
        </div>
      </div>
    </div>
  );
}
