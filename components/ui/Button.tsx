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
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  success: "bg-success-600 text-white hover:bg-success-700 active:bg-success-700 shadow-sm hover:shadow-md",
};

const sizes = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-5 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
  icon: "h-10 w-10 p-0 text-sm rounded-xl", // square icon-only button
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
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
