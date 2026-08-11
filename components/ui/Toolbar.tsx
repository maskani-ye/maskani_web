import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * شريط أدوات موحّد (بحث + فلاتر) داخل بطاقة بيضاء — يلغي تكرار حاوية التولبار في كل صفحة.
 * <Toolbar><Input .../><Select .../></Toolbar>
 */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-card p-4 flex flex-col sm:flex-row gap-3", className)}>
      {children}
    </div>
  );
}
