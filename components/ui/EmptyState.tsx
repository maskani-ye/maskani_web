"use client";

// ─── EmptyState ─────────────────────────────────────────────────────────────
// حالة فارغة بأيقونة Solar وعنوان ورسالة وزر إجراء اختياري.
// usage: <EmptyState icon={Box} title="لا توجد بيانات" message="ابدأ بإضافة عنصر" actionLabel="إضافة" onAction={add} />

import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { ComponentType } from "react";

interface SolarIconProps {
  className?: string;
  size?: string | number;
  weight?: string;
}

interface EmptyStateProps {
  icon?: ComponentType<SolarIconProps>;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      {Icon && (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
          <Icon className="h-7 w-7" />
        </span>
      )}
      <h3 className="font-bold text-gray-900 text-base">{title}</h3>
      {message && <p className="text-sm text-gray-500 mt-1.5 max-w-sm">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
