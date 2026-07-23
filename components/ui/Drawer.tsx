"use client";

// ─── Drawer ─────────────────────────────────────────────────────────────────
// لوحة منزلقة من الجانب (RTL-aware) للتفاصيل/التنقّل على الجوال. Escape + قفل التمرير.
// usage: <Drawer open={o} onClose={close} side="right"><nav>…</nav></Drawer>

import { cn } from "@/lib/utils";
import { ReactNode, useEffect } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** الجانب الفيزيائي الذي تنزلق منه اللوحة. الافتراضي "right" (يبدأ منه في RTL). */
  side?: "right" | "left";
  className?: string;
}

export function Drawer({ open, onClose, children, side = "right", className }: DrawerProps) {
  // قفل تمرير الجسم أثناء الفتح
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Escape للإغلاق
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isRight = side === "right";

  return (
    <div className={cn("fixed inset-0 z-[70]", !open && "pointer-events-none")} aria-hidden={!open}>
      {/* الخلفية */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* اللوحة */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute top-0 bottom-0 w-[85vw] max-w-sm bg-cream card-shadow flex flex-col",
          "transition-transform duration-300 ease-out",
          isRight ? "right-0" : "left-0",
          open ? "translate-x-0" : isRight ? "translate-x-full" : "-translate-x-full",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
