"use client";

/**
 * ودجت «اسأل عن العقار» — يجيب من بيانات العقار عبر الذكاء الاصطناعي.
 *
 * ⚠️ **شرائح الأسئلة كانت تبدو معطّلة**: نصٌّ رماديّ (`muted-600`) على سطحٍ
 * رماديّ (`muted-50`) بحدٍّ رماديّ — ثلاث درجات رمادية متجاورة تُقرأ «زرٌّ لا
 * يعمل»، فلا يلمسها أحد. وهي **الفعل الأسهل** في الودجت كلّه: سؤالٌ جاهز
 * بنقرةٍ واحدة. صارت تحمل لون العلامة على سطحه الفاتح، فتُقرأ قابلة للنقر.
 */
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
    <div className="rounded-2xl bg-white p-5 shadow-e1 ring-1 ring-ink/[0.06]">
      <h2 className="mb-3 flex items-center gap-1.5 text-h3 text-ink">
        <Stars weight="Bold" className="h-5 w-5 text-primary-400" /> اسأل عن هذا العقار
      </h2>
      <div className="flex items-stretch gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="اكتب سؤالك عن العقار…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-ink/10 px-4 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => ask()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-body font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {loading ? <Refresh className="h-4 w-4 animate-spin" /> : <Stars className="h-4 w-4" />}
          اسأل
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)} disabled={loading}
            className="rounded-full bg-primary-50 px-3 py-1.5 text-caption font-semibold text-primary-400 transition-colors hover:bg-primary hover:text-white disabled:opacity-60">
            {s}
          </button>
        ))}
      </div>
      {answer && (
        <div className="mt-3 whitespace-pre-wrap rounded-xl bg-primary-50 p-3.5 text-body leading-relaxed text-ink/85 ring-1 ring-primary/15">
          {answer}
        </div>
      )}
      <p className="mt-2 text-caption text-muted">
        إجابة تلقائية من بيانات العقار — للتأكّد، راسل المالك مباشرةً.
      </p>
    </div>
  );
}
