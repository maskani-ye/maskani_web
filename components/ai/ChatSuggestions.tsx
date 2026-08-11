"use client";

// اقتراح ردود للشات — يعرض زرّاً يجلب 3 ردود مقترحة (قابلة للنقر تملأ حقل الرسالة).
import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { toast } from "sonner";
import { Stars, Refresh, CloseCircle } from "@solar-icons/react";

interface ChatMsg { body: string; sender: number; is_deleted?: boolean }

export function ChatSuggestions({
  messages,
  userId,
  topic,
  onPick,
}: {
  messages: ChatMsg[];
  userId: number | undefined;
  topic?: string;
  onPick: (text: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    const payload = messages
      .filter((m) => m.body && !m.is_deleted)
      .slice(-8)
      .map((m) => ({ role: m.sender === userId ? "me" : "them", body: m.body }));
    if (!payload.length) {
      toast.error("لا توجد رسائل لاقتراح ردّ عليها");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ suggestions: string[] }>(ep.aiChatSuggestions, { messages: payload, topic });
      const s = res.data.suggestions || [];
      if (!s.length) toast.info("تعذّر اقتراح ردود مناسبة");
      setSuggestions(s);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-2">
      {suggestions.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onPick(s); setSuggestions([]); }}
              className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors text-right"
            >
              {s}
            </button>
          ))}
          <button type="button" onClick={() => setSuggestions([])} aria-label="إغلاق" className="text-gray-400 hover:text-gray-600">
            <CloseCircle className="h-4 w-4" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={fetchSuggestions}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gold/10 text-gold-700 px-3 py-1 text-xs font-semibold hover:bg-gold/20 transition-colors disabled:opacity-60"
      >
        {loading ? <Refresh className="h-3.5 w-3.5 animate-spin" /> : <Stars className="h-3.5 w-3.5" />}
        {loading ? "جارٍ الاقتراح…" : "اقتراح ردّ"}
      </button>
    </div>
  );
}
