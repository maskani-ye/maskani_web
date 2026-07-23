"use client";

// ─── ChartCard ──────────────────────────────────────────────────────────────
// غلاف موحّد للرسوم البيانية: عنوان (+ أيقونة) داخل Card مع ResponsiveContainer.
// يعرض EmptyState تلقائياً عند غياب البيانات. الرسم يُرسم LTR داخل صفحة RTL.
// usage:
//   <ChartCard title="أنواع العقارات" icon={Buildings2} height={200} empty={data.length === 0}>
//     <BarChart data={data}>…</BarChart>
//   </ChartCard>

import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";
import { ResponsiveContainer } from "recharts";
import { ComponentType, ReactElement, ReactNode } from "react";

// أيقونة يكفي أن تقبل className — متوافقة مع أيقونات Solar وغيرها.
type IconLike = ComponentType<{ className?: string }>;

interface ChartCardProps {
  title: string;
  icon?: IconLike;
  /** ارتفاع منطقة الرسم بالبكسل — العرض دائماً متجاوب 100% */
  height?: number;
  /** عنصر recharts واحد (BarChart / PieChart / LineChart …) */
  children: ReactElement;
  /** محتوى اختياري في يسار الترويسة (فلتر، وسم …) */
  action?: ReactNode;
  /** عند true يُعرض EmptyState بدل الرسم */
  empty?: boolean;
  emptyTitle?: string;
  emptyIcon?: IconLike;
  className?: string;
}

export function ChartCard({
  title,
  icon: Icon,
  height = 220,
  children,
  action,
  empty,
  emptyTitle = "لا توجد بيانات لعرضها بعد",
  emptyIcon,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 min-w-0">
          {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
          <span className="truncate">{title}</span>
        </h3>
        {action}
      </div>

      {empty ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} className="py-8" />
      ) : (
        // dir=ltr: recharts يرسم من اليسار لليمين — نعزله عن اتجاه الصفحة RTL
        <div dir="ltr" className="w-full">
          <ResponsiveContainer width="100%" height={height}>
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
