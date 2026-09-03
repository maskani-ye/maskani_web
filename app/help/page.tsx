"use client";

// مركز المساعدة (العميل) — يستعمل عناصر عرض المحادثة المشتركة (HelpdeskChat)
// فيبقى التصميم متطابقًا 100% مع تطبيق الجوال ومع لوحة الإدارة. يقرأ مغلّفات
// محرّك الفلو الجديد مباشرةً، ويتفاعل عبر WebSocket (بديل REST).
import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useHelpdeskSocket } from "@/hooks/useHelpdeskSocket";
import { HelpAssistant } from "@/components/ai/HelpAssistant";
import { HelpdeskMessageRow, TypingDots, type HdMessage, type HdBtn, type Envelope } from "@/components/helpdesk/HelpdeskChat";
import { HeadphonesRound, Refresh, Plain } from "@solar-icons/react";
import { toast } from "sonner";

export default function HelpPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HdMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.post<{ session: { id: string }; messages: HdMessage[] }>(ep.helpdeskStart, {});
      setSessionId(data.session.id);
      setMessages(data.messages ?? []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  // جلسة واحدة تُبنى/تُستأنف عند **فتح الصفحة فقط** (get-or-create): جديدة إن كانت
  // السابقة مقفلة، وإلا تُستأنف. لا إنشاء تلقائي بعد الإنهاء (تفاديًا لتكاثر الجلسات).
  useEffect(() => { start(); }, [start]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const append = useCallback((m: HdMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id && x.id > 0) ? prev : [...prev, m]));
  }, []);

  const socket = useHelpdeskSocket({
    sessionId,
    enabled: !!sessionId,
    onMessage: (m) => { append(m as unknown as HdMessage); setBusy(false); },
  });

  // أحداث المستخدم (نقر زرّ/تأكيد/نص) عبر REST دائمًا — طلب/استجابة موثوق يعيد
  // مغلّفات الردّ. الـWebSocket مخصّص لدفع ردود الموظّف الحيّة فقط (عبر onMessage).
  const send = async (event: Record<string, unknown>, optimistic?: string) => {
    if (!sessionId || busy) return;
    setBusy(true);
    if (optimistic) {
      setMessages((m) => [...m, { id: -Date.now(), sender: "user", payload: { type: "user_text", body: optimistic } }]);
    }
    try {
      const { data } = await api.post<{ messages: Envelope[] }>(ep.helpdeskEvent(sessionId), event);
      const wrapped: HdMessage[] = (data.messages ?? []).map((e) => ({ id: e.seq ?? -Date.now(), sender: "bot", payload: e }));
      setMessages((m) => [...m, ...wrapped]);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const clickButton = (b: HdBtn, itemId?: string) =>
    send({ type: "button_click", button_id: b.id, item_id: itemId }, b.label);
  const confirm = (yes: boolean) =>
    yes ? send({ type: "confirm" }, "نعم، تابع") : send({ type: "cancel" }, "لا");
  const sendText = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    send({ type: "message", body: t }, t);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
            <HeadphonesRound weight="Bold" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-h3 font-bold text-ink">مركز المساعدة</h1>
            <p className="text-caption text-muted">{socket.connected ? "متصل" : "…"} · فريق مسكني</p>
          </div>
        </div>
        <button onClick={() => send({ type: "restart" })} title="إعادة البدء"
          className="text-muted hover:text-primary p-2 rounded-lg hover:bg-primary/5">
          <Refresh className="h-5 w-5" />
        </button>
      </div>

      <HelpAssistant />

      <div className="bg-cream rounded-3xl card-shadow p-3 sm:p-4 min-h-[58vh] flex flex-col">
        <div className="flex-1 space-y-1.5 overflow-y-auto pb-2">
          {loading ? (
            <p className="text-center text-muted py-16">جارٍ التحميل…</p>
          ) : (
            <>
              {messages.map((m, i) => (
                <HelpdeskMessageRow key={`${m.id}-${m.payload.seq ?? ""}`} m={m}
                  onButton={clickButton} onConfirm={confirm} busy={busy} isLatest={i === messages.length - 1} />
              ))}
              {busy && <TypingDots />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 bg-white rounded-full border border-muted-100 px-2 py-1.5 shadow-sm">
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendText(); }}
            placeholder="اكتب رسالتك…"
            className="flex-1 bg-transparent outline-none text-body px-3 text-ink placeholder:text-muted" />
          <button onClick={sendText} disabled={busy || !text.trim()}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90">
            <Plain className="h-4 w-4 -scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
