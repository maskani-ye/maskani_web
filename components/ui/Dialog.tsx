"use client";

// ─── Dialog ─────────────────────────────────────────────────────────────────
// نافذة منبثقة (modal) متاحة: role=dialog/aria-modal، حبس التركيز، Escape للإغلاق،
// نقر الخلفية للإغلاق، وقفل تمرير الجسم. usage: <Dialog open={o} onClose={close} title="عنوان">...</Dialog>

import { cn } from "@/lib/utils";
import { CloseCircle } from "@solar-icons/react";
import { ReactNode, useCallback, useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** إخفاء زر الإغلاق (×) في الرأس */
  hideClose?: boolean;
  /** تعطيل الإغلاق بنقر الخلفية أو Escape (مثلاً أثناء الحفظ) */
  dismissable?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  hideClose,
  dismissable = true,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(() => {
    if (dismissable) onClose();
  }, [dismissable, onClose]);

  // قفل تمرير الجسم أثناء الفتح
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // إعادة التركيز إلى العنصر السابق عند الإغلاق + التركيز داخل النافذة عند الفتح
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={cn(
          "bg-cream rounded-2xl card-shadow w-full max-w-lg p-5 relative max-h-[90vh] flex flex-col outline-none",
          className
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between mb-4 gap-4">
            {title ? <h2 className="font-bold text-gray-900 text-lg">{title}</h2> : <span />}
            {!hideClose && (
              <button
                type="button"
                onClick={requestClose}
                aria-label="إغلاق"
                className="text-gray-400 hover:text-gray-600 shrink-0"
              >
                <CloseCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto -mx-1 px-1 grow">{children}</div>

        {footer && <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
