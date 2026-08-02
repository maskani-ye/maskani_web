"use client";

// مركز المساعدة (العميل — ويب): محادثة دعم موجَّهة تعرض نفس أنواع رسائل التطبيق
// (welcome/options/text/handoff) مع أزرار الخيارات وشريط إدخال عند التحويل للموظف.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { HeadphonesRound, ChatRoundLine, Plain } from "@solar-icons/react";

interface HdChoice { id: string; label: string; description?: string }
interface HdSession { id: string; status: string }
interface HdMessage {
  id: string; seq: number; direction: string; content: string;
  payload: { type?: string; payload?: Record<string, unknown> };
}

function inner(m: HdMessage): Record<string, unknown> {
  return m.payload?.payload ?? {};
}
function msgText(m: HdMessage): string {
  const p = inner(m);
  return (p.text as string) || (p.message as string) || (p.question as string) || m.content || "";
}
function msgChoices(m: HdMessage): HdChoice[] {
  const raw = (inner(m).choices as Array<Record<string, unknown>>) ?? [];
  return raw.map((c) => ({ id: `${c.id ?? ""}`, label: `${c.label ?? ""}`, description: `${c.description ?? ""}` }));
}

export default function HelpPage() {
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<HdSession | null>(null);
  const [messages, setMessages] = useState<HdMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const awaitingAgent = session?.status === "awaiting_agent";

  const reload = useCallback(async (sid: string) => {
    const [{ data: msgs }, { data: s }] = await Promise.all([
      api.get(ep.helpdeskMessages(sid)),
      api.post(ep.helpdeskOpen, {}),
    ]);
    setMessages(msgs ?? []);
    setSession(s);
  }, []);

  const boot = useCallback(async () => {
    setLoading(true);
    try {
      const { data: s } = await api.post(ep.helpdeskOpen, {});
      setSession(s);
      const { data: msgs } = await api.get(ep.helpdeskMessages(s.id));
      setMessages(msgs ?? []);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) boot();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user, boot]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const choose = async (c: HdChoice) => {
    if (!session || sending) return;
    setSending(true);
    try {
      await api.post(ep.helpdeskSelectOption(session.id), { node_id: c.id, label: c.label });
      await reload(session.id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!session || !text || sending) return;
    setSending(true);
    setInput("");
    try {
      await api.post(ep.helpdeskSendMessage(session.id), { content: text });
      await reload(session.id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <HeadphonesRound className="h-12 w-12 text-primary mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">مركز المساعدة</h1>
        <p className="text-gray-500 mb-6">سجّل الدخول لبدء محادثة مع فريق الدعم.</p>
        <Link href="/auth/login" className="inline-block bg-primary text-white rounded-xl px-6 py-2.5 font-semibold">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <HeadphonesRound className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">مركز المساعدة</h1>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-4 min-h-[60vh] flex flex-col">
        <div className="flex-1 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 py-10">جارِ التحميل…</p>
          ) : (
            messages.map((m) => {
              const isUser = m.direction === "user";
              const isAgent = m.direction === "agent";
              const choices = msgChoices(m);
              return (
                <div key={m.id}>
                  <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isUser ? "bg-primary text-white"
                        : isAgent ? "bg-gold/15 text-gray-800"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {!isUser && (
                        <span className="flex items-center gap-1 text-[11px] opacity-70 mb-0.5">
                          <ChatRoundLine className="h-3 w-3" />
                          {isAgent ? "فريق الدعم" : "المساعد"}
                        </span>
                      )}
                      {msgText(m)}
                    </div>
                  </div>
                  {choices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 justify-start">
                      {choices.map((c) => (
                        <button
                          key={c.id}
                          disabled={sending}
                          onClick={() => choose(c)}
                          className="text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 rounded-full px-4 py-1.5"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {awaitingAgent && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="اكتب رسالتك لفريق الدعم…"
              className="flex-1 h-10 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50"
            >
              <Plain className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
