"use client";

// لوحة مركز المساعدة (الإدارة) — قائمة الجلسات + المحادثة + ردّ الموظف/حلّ/إغلاق.
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { toast } from "sonner";
import {
  HeadphonesRound,
  ChatRoundDots,
  CheckCircle,
  CloseCircle,
  Plain,
  User as UserIcon,
} from "@solar-icons/react";

interface HdUser { id: number; full_name: string; phone: string; avatar: string | null }
interface HdLast { content: string; direction: string; created_at: string }
interface HdSession {
  id: string; status: string; summary: string; channel: string;
  created_at: string; updated_at: string; closed_at: string | null;
  user: HdUser; message_count: number; last_message: HdLast | null;
}
interface HdMessage {
  id: string; seq: number; direction: string; content: string;
  payload: Record<string, unknown>; is_internal: boolean; created_at: string;
}

const STATUSES = [
  { key: "awaiting_agent", label: "بانتظار موظف" },
  { key: "open", label: "مع البوت" },
  { key: "resolved", label: "مُحلّة" },
  { key: "closed", label: "مغلقة" },
];

const STATUS_BADGE: Record<string, string> = {
  awaiting_agent: "bg-gold/15 text-gold",
  open: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

function payloadText(m: HdMessage): string {
  const inner = (m.payload?.payload as Record<string, unknown>) ?? {};
  return (
    (inner.text as string) ||
    (inner.message as string) ||
    (inner.question as string) ||
    m.content ||
    ""
  );
}

export default function AdminHelpdeskPage() {
  const [status, setStatus] = useState("awaiting_agent");
  const [sessions, setSessions] = useState<HdSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HdSession | null>(null);
  const [messages, setMessages] = useState<HdMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(ep.admin.helpdeskSessions, { params: { status } });
      setSessions(data.results ?? data ?? []);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openSession = useCallback(async (s: HdSession) => {
    setSelected(s);
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(ep.admin.helpdeskSessionMessages(s.id));
      setMessages(data.results ?? data ?? []);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await api.post(ep.admin.helpdeskReply(selected.id), { content: reply.trim() });
      setReply("");
      await openSession(selected);
      fetchSessions();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const doAction = async (kind: "resolve" | "close") => {
    if (!selected) return;
    try {
      const url = kind === "resolve" ? ep.admin.helpdeskResolve(selected.id) : ep.admin.helpdeskClose(selected.id);
      await api.post(url, {});
      toast.success(kind === "resolve" ? "تم وضع الجلسة كمُحلّة" : "تم إغلاق الجلسة");
      setSelected(null);
      fetchSessions();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <HeadphonesRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">مركز المساعدة</h1>
          <p className="text-sm text-gray-500">إدارة تذاكر الدعم والردّ على المستخدمين</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-white p-1 mb-5 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => { setStatus(s.key); setSelected(null); }}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              status === s.key ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="lg:col-span-1 bg-white rounded-2xl card-shadow p-3 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">لا توجد جلسات</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s)}
                className={`w-full text-right p-3 rounded-xl mb-1 transition-colors ${
                  selected?.id === s.id ? "bg-primary/10" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800 truncate">{s.user.full_name}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] ?? ""}`}>
                    {STATUSES.find((x) => x.key === s.status)?.label ?? s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {s.last_message?.content || "—"}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">{s.message_count} رسالة</p>
              </button>
            ))
          )}
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2 bg-white rounded-2xl card-shadow flex flex-col max-h-[70vh]">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20">
              <ChatRoundDots className="h-10 w-10 mb-2" />
              <p className="text-sm">اختر جلسة لعرض المحادثة</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {selected.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{selected.user.full_name}</p>
                    <p className="text-xs text-gray-400" dir="ltr">{selected.user.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => doAction("resolve")}
                    className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="h-4 w-4" /> حلّ
                  </button>
                  <button onClick={() => doAction("close")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
                    <CloseCircle className="h-4 w-4" /> إغلاق
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <p className="text-sm text-gray-400 text-center py-8">جارِ التحميل…</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.direction === "agent";
                    const isUser = m.direction === "user";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-start" : isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine ? "bg-gold/15 text-gray-800"
                            : isUser ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700"
                        } ${m.is_internal ? "border border-dashed border-gray-400" : ""}`}>
                          <span className="block text-[10px] opacity-70 mb-0.5">
                            {mine ? "موظف الدعم" : isUser ? "المستخدم" : "المساعد"}
                            {m.is_internal ? " • داخلية" : ""}
                          </span>
                          {payloadText(m)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-gray-100 flex items-center gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
                  placeholder="اكتب ردّك…"
                  className="flex-1 h-10 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50"
                >
                  <Plain className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
