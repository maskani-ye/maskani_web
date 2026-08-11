"use client";

// زر «تحسين النصّ» بالذكاء الاصطناعي — يُلمّع الوصف الذي كتبه المستخدم دون اختراع.
// يظهر بجانب حقول الوصف في نماذج الإنشاء. آمن: يحتاج نصّاً موجوداً (≥10 أحرف).
import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { toast } from "sonner";
import { Stars, Refresh } from "@solar-icons/react";

type Kind = "property" | "service" | "request" | "job";

export function ImproveTextButton({
  kind,
  text,
  onImprove,
  className,
}: {
  kind: Kind;
  text: string;
  onImprove: (improved: string) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const improve = async () => {
    if (!text || text.trim().length < 10) {
      toast.error("اكتب وصفاً أطول أولاً لنحسّنه");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ text: string }>(ep.aiImproveText, { kind, text: text.trim() });
      if (res.data.text) {
        onImprove(res.data.text);
        toast.success("تم تحسين النصّ — يمكنك تعديله");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={improve}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-60"
      }
    >
      {loading ? <Refresh className="h-3.5 w-3.5 animate-spin" /> : <Stars className="h-3.5 w-3.5" />}
      {loading ? "جارٍ التحسين…" : "تحسين النصّ"}
    </button>
  );
}
