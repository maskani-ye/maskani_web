import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * حاوية صفحة موحّدة — عرض أقصى متمركز + تباعد رأسي ثابت بين الأقسام.
 * تلغي تكرار `max-w-… mx-auto px-… py-… space-y-…` في كل صفحة.
 *
 * size: "md" (افتراضي، صفحات القوائم/التفاصيل) · "lg" (لوحات عريضة/رسوم) · "sm" (نماذج/محتوى نصّي).
 */
export function PageContainer({
  children,
  size = "md",
  className,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const maxW = size === "lg" ? "max-w-7xl" : size === "sm" ? "max-w-2xl" : "max-w-5xl";
  return (
    <div className={cn(maxW, "mx-auto px-4 sm:px-6 py-6 space-y-6", className)}>
      {children}
    </div>
  );
}
