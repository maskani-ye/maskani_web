"use client";

// زر مشاركة موحّد — يستخدم واجهة المشاركة الأصلية (Web Share API) على الجوّال
// (ورقة المشاركة الأصلية)، ويعود لنسخ الرابط + إشعار على أجهزة لا تدعمها.
import { Share } from "@solar-icons/react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text?: string;
  className?: string;
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const onShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: text ?? title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ الرابط");
      }
    } catch {
      // ألغى المستخدم المشاركة — نتجاهل بصمت.
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="مشاركة"
      className={
        className ??
        "w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors"
      }
    >
      <Share className="h-5 w-5 text-gray-400" />
    </button>
  );
}
