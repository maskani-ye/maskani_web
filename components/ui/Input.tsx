"use client";

import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { toEnglishDigits } from "@/lib/digits";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, startIcon, endIcon, id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, "-").toLowerCase();
    // كل حقل رقميّ يمرّ من هنا يحوّل «٥٠٠٠» إلى «5000» قبل أن تراه الحالة.
    // الحقن في المكوّن المشترك لا في كل استدعاء: نسيانه مرّة واحدة يعني حقلاً
    // يبتلع مدخل المستخدم بلا رسالة (المنظّفات تحذف الأرقام غير اللاتينية).
    const numeric = props.type === "number" || props.type === "tel" ||
      props.inputMode === "numeric" || props.inputMode === "decimal" || props.inputMode === "tel";
    const onChange = numeric && props.onChange
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          const converted = toEnglishDigits(e.target.value);
          if (converted !== e.target.value) e.target.value = converted;
          props.onChange!(e);
        }
      : props.onChange;
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-body font-semibold text-muted-700">
            {label}
            {props.required && <span className="text-danger-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <span className="absolute right-3 text-muted pointer-events-none">{startIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 border rounded-xl bg-white text-ink placeholder-muted",
              "transition-all duration-200 text-body",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              startIcon ? "pr-10 pl-4" : "px-4",
              endIcon ? "pl-10" : "",
              error ? "border-danger-500 focus:ring-danger-200 focus:border-danger-500" : "border-muted-200",
              className
            )}
            {...props}
            onChange={onChange}
          />
          {endIcon && (
            <span className="absolute left-3 text-muted">{endIcon}</span>
          )}
        </div>
        {error && <p className="text-caption text-danger-500 flex items-center gap-1">{error}</p>}
        {hint && !error && <p className="text-caption text-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
