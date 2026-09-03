"use client";

// مساعد ذكي لمركز المساعدة — إجابة أوّلية فورية قبل فتح تذكرة (مستقلّ عن تدفّق الدعم).
import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { toast } from "sonner";
import { Stars, Refresh } from "@solar-icons/react";

export function HelpAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (question.trim().length < 3) { toast.error("اكتب سؤالك"); return; }
    setLoading(true);
    setAnswer("");
    try {
      const res = await api.post<{ answer: string }>(ep.aiHelpdeskAnswer, { question: question.trim() });
      setAnswer(res.data.answer || "لا توجد إجابة.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl card-shadow p-4 mb-4">
      <h2 className="font-bold text-ink flex items-center gap-1.5 mb-2 text-body">
        <Stars className="h-4 w-4 text-primary" /> مساعد ذكي — إجابة فورية
      </h2>
      <div className="flex items-stretch gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="اسأل عن استخدام المنصّة…"
          className="flex-1 border border-muted-200 rounded-xl px-3 text-body h-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="button"
          onClick={ask}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-4 text-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
        >
          {loading ? <Refresh className="h-4 w-4 animate-spin" /> : <Stars className="h-4 w-4" />}
          اسأل
        </button>
      </div>
      {answer && (
        <div className="mt-3 rounded-xl bg-primary/5 border border-primary/15 p-3 text-body text-muted-700 leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
      <p className="text-[11px] text-muted mt-2">
        إجابة تلقائية. إن لم تجد ما تريد، أكمل عبر مركز المساعدة أدناه.
      </p>
    </div>
  );
}
