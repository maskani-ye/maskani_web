"use client";

// ─── StatCard ───────────────────────────────────────────────────────────────
// بطاقة مؤشر أداء (KPI) بأيقونة وقيمة ودلتا اتجاه اختيارية (أخضر لأعلى/أحمر لأسفل).
// usage: <StatCard label="المستخدمون" value={1240} icon={Users} trend={{value:"12%",direction:"up"}} sub="هذا الشهر" />

import { Card } from "./Card";
import { cn } from "@/lib/utils";
import { AltArrowUp, AltArrowDown } from "@solar-icons/react";
import { ComponentType, ReactNode } from "react";

interface SolarIconProps {
  className?: string;
  size?: string | number;
  weight?: string;
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ComponentType<SolarIconProps>;
  trend?: { value: ReactNode; direction: "up" | "down" };
  sub?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, sub, className }: StatCardProps) {
  const up = trend?.direction === "up";
  return (
    <Card className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-gray-900 truncate">{value}</p>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-bold",
                up ? "text-success-600" : "text-danger-600"
              )}
            >
              {up ? <AltArrowUp className="h-3.5 w-3.5" /> : <AltArrowDown className="h-3.5 w-3.5" />}
              {trend.value}
            </span>
          )}
          {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </div>
      </div>

      {Icon && (
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </span>
      )}
    </Card>
  );
}
