"use client";

import { cn } from "@/lib/utils";
import { Restart } from "@solar-icons/react";
import { ButtonHTMLAttributes, forwardRef } from "react";

// ─── Button ─────────────────────────────────────────────────────────────────
// زر متعدد الأنماط مع حالة تحميل. variant=success أخضر مصمت، size=icon مربّع.
// usage: <Button variant="success" loading={saving}>حفظ</Button> | <Button size="icon"><Icon/></Button>

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-md",
  secondary: "bg-gold text-white hover:bg-gold-500 active:bg-gold-600 shadow-sm hover:shadow-md",
  outline: "border-2 border-primary text-primary hover:bg-primary-50 active:bg-primary-100",
  ghost: "text-primary hover:bg-primary-50 active:bg-primary-100",
  danger: "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 shadow-sm",
  success: "bg-success-600 text-white hover:bg-success-700 active:bg-success-700 shadow-sm hover:shadow-md",
};

const sizes = {
  sm: "h-8 px-3 text-body rounded-lg",
  md: "h-10 px-5 text-body rounded-xl",
  lg: "h-12 px-6 text-body-lg rounded-xl",
  icon: "h-10 w-10 p-0 text-body rounded-xl", // square icon-only button
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // ⚠️ **`shrink-0 whitespace-nowrap`: زرٌّ لا ينكسر نصّه أبداً.**
          // الأزرار تقع كثيراً في صفوف `justify-between` مع تسميةٍ نصّية،
          // فتأخذ التسمية عرضها الطبيعيّ ويُضغط الزرّ حتى ينكسر سطره — زرٌّ
          // مشوّه بين عناصر سليمة، ويظهر عند العروض الضيّقة وحدها فيمرّ في
          // المراجعة. المنع في المكوّن لا في كل موضع استعمال.
          "inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && <Restart className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
