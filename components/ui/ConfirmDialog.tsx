"use client";

// ─── ConfirmDialog ──────────────────────────────────────────────────────────
// نافذة تأكيد بنفس تصميم AppAlert في تطبيقات فلاتر (ورقة سفلية: مقبض سحب، عنوان
// وسط، زر تأكيد بعرض كامل، وزر إلغاء نصّي أسفله).
// usage: <ConfirmDialog open={o} title="حذف؟" message="لا يمكن التراجع" variant="danger" onConfirm={del} onCancel={close} />

import { Button } from "./Button";
import { ReactNode, useCallback, useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** أيقونة اختيارية أعلى العنوان */
  icon?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "primary",
  onConfirm,
  onCancel,
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(() => {
    if (!loading) onCancel();
  }, [loading, onCancel]);

  // قفل تمرير الجسم أثناء الفتح
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // التركيز داخل النافذة عند الفتح، وإعادته عند الإغلاق
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => previouslyFocused.current?.focus?.();
  }, [open]);

  // Escape + حبس التركيز (Tab)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null
      );
      if (nodes.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/45 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className="w-full max-w-md bg-cream rounded-t-3xl sm:rounded-3xl sm:mb-0 px-5 pb-8 pt-3 flex flex-col items-center outline-none animate-[maskaniSheetUp_0.24s_ease-out]"
      >
        {/* مقبض السحب */}
        <span className="h-[5px] w-[75px] rounded-full bg-gray-300" />

        {icon && <div className="mt-6 text-primary">{icon}</div>}

        <h2 className="mt-9 text-lg font-semibold text-gray-900 text-center text-balance">
          {title}
        </h2>

        {message && (
          <p className="mt-5 text-sm text-gray-500 leading-relaxed text-center">{message}</p>
        )}

        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
          fullWidth
          className="mt-11"
        >
          {confirmLabel}
        </Button>

        <Button variant="ghost" onClick={onCancel} disabled={loading} fullWidth className="mt-1.5">
          {cancelLabel}
        </Button>
      </div>

      <style jsx global>{`
        @keyframes maskaniSheetUp {
          from {
            transform: translateY(24px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
