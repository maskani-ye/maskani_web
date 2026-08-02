"use client";

// زر «اقتراح وصف» بالذكاء الاصطناعي — يملأ حقل الوصف من العنوان والحقول.
// يُستخدم في نماذج إنشاء الإعلان/الخدمة/الطلب. آمن: يتطلّب العنوان فقط.
import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { toast } from "sonner";
import { MagicStick, Refresh } from "@solar-icons/react";

type Kind = "listing" | "service" | "request" | "job";

export function SuggestDescriptionButton({
  kind,
  title,
  fields,
  onSuggest,
  className,
}: {
  kind: Kind;
  title: string;
  fields?: Record<string, unknown>;
  onSuggest: (description: string) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const suggest = async () => {
    if (!title?.trim()) {
      toast.error("أدخل العنوان أولاً حتى نقترح وصفاً مناسباً");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ description: string }>(ep.aiSuggestDescription, {
        kind,
        title: title.trim(),
        fields: fields ?? {},
      });
      if (res.data.description) {
        onSuggest(res.data.description);
        toast.success("تم اقتراح وصف — يمكنك تعديله");
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
      onClick={suggest}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg bg-gold/10 text-gold-700 px-3 py-1.5 text-xs font-semibold hover:bg-gold/20 transition-colors disabled:opacity-60"
      }
    >
      {loading ? (
        <Refresh className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <MagicStick className="h-3.5 w-3.5" />
      )}
      {loading ? "جارٍ الاقتراح…" : "اقتراح وصف بالذكاء الاصطناعي"}
    </button>
  );
}
