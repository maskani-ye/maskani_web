"use client";

// ودجت «اسأل عن العقار» — يجيب المستخدم من بيانات العقار عبر الذكاء الاصطناعي.
import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { toast } from "sonner";
import { Stars, Refresh } from "@solar-icons/react";

const SUGGESTED = ["كم عدد الغرف؟", "هل السعر قابل للتفاوض؟", "ما المرافق القريبة؟", "هل مفروش؟"];

export function AskPropertyBox({ propertyId }: { propertyId: number }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (q?: string) => {
    const query = (q ?? question).trim();
    if (query.length < 3) { toast.error("اكتب سؤالك"); return; }
    if (q) setQuestion(q);
    setLoading(true);
    setAnswer("");
    try {
      const res = await api.post<{ answer: string }>(ep.aiAskProperty, {
        property_id: propertyId, question: query,
      });
      setAnswer(res.data.answer || "لا توجد إجابة.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl card-shadow p-5">
      <h2 className="font-bold text-gray-800 flex items-center gap-1.5 mb-3">
        <Stars className="h-5 w-5 text-primary" /> اسأل عن هذا العقار
      </h2>
      <div className="flex items-stretch gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="اكتب سؤالك عن العقار…"
          className="flex-1 border border-gray-200 rounded-xl px-4 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="button"
          onClick={() => ask()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-4 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
        >
          {loading ? <Refresh className="h-4 w-4 animate-spin" /> : <Stars className="h-4 w-4" />}
          اسأل
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {SUGGESTED.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)} disabled={loading}
            className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors">
            {s}
          </button>
        ))}
      </div>
      {answer && (
        <div className="mt-3 rounded-xl bg-primary/5 border border-primary/15 p-3.5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
      <p className="text-[11px] text-gray-400 mt-2">
        إجابة تلقائية من بيانات العقار — للتأكّد، راسل المالك مباشرةً.
      </p>
    </div>
  );
}
