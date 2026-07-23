"use client";

// ─── ConfirmDialog ──────────────────────────────────────────────────────────
// نافذة تأكيد جاهزة تحلّ محل confirm() الأصلي، مبنية على Dialog.
// usage: <ConfirmDialog open={o} title="حذف؟" message="لا يمكن التراجع" variant="danger" onConfirm={del} onCancel={close} />

import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { ReactNode } from "react";

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
}

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
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      hideClose
      dismissable={!loading}
      className="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="text-sm text-gray-600 leading-relaxed">{message}</p>}
    </Dialog>
  );
}
