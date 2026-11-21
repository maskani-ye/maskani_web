"use client";

import { FloatingHelp } from "./FloatingHelp";
import { FloatingAssistant } from "./FloatingAssistant";

/**
 * الأزرار العائمة مكدّسةً في طرفٍ واحد (يسار الشاشة = نهاية السطر في RTL) —
 * قرار المالك 2026-11-21. كانا على طرفين متقابلين.
 *
 * المساعد في الأسفل (الفعل الأهمّ، الأقرب للإبهام) والمساعدة فوقه. كل زرّ يقرّر
 * ظهوره بنفسه؛ الحاوية تملك الموضع وحدها. `pointer-events-none` على الحاوية كي
 * لا تحجب الفجوة بين الزرّين النقرَ على ما تحتها.
 */
export function FloatingActions() {
  return (
    <div className="fixed z-40 bottom-20 md:bottom-6 left-4 md:left-6 flex flex-col items-end gap-3 pointer-events-none">
      <FloatingHelp />
      <FloatingAssistant />
    </div>
  );
}
