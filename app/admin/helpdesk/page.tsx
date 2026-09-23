"use client";

// لوحة مركز المساعدة (الإدارة) — الجلسات + المحادثة + ردّ الموظّف/إغلاق.
// محرّك الفلو الشبكي: الرسائل envelopes موحّدة (bot/user/agent).
// الهيكل مشترك مع «المحادثات» عبر `components/admin/chat/ChatWorkspace`.
import { useCallback, useEffect, useState } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { HelpdeskMessageRow, type HdMessage as HdMsg } from "@/components/helpdesk/HelpdeskChat";
import {
  ChatWorkspace, ChatListCard, ChatListRow, ChatPanel, ChatPanelEmpty,
  ChatPanelHeader, ChatScroll, ChatScrollEmpty, ChatScrollSkeleton, ChatComposer,
} from "@/components/admin/chat/ChatWorkspace";
import { toast } from "sonner";
import { Routing, HeadphonesRound, CheckCircle } from "@solar-icons/react";

interface HdSession {
  id: string; status: string; user: number; user_name: string;
  current_node: string | null; created_at: string; updated_at: string;
}
interface HdMessage {
  id: number; sender: string; seq: number; payload: Record<string, unknown>; created_at: string;
}

const STATUSES = [
  { key: "awaiting_agent", label: "بانتظار موظّف" },
  { key: "active", label: "مع البوت" },
  { key: "closed", label: "مغلقة" },
];
const STATUS_BADGE: Record<string, string> = {
  awaiting_agent: "bg-gold/15 text-gold-700",
  active: "bg-info-100 text-info-700",
  closed: "bg-muted-100 text-muted-500",
};

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
      const { data } = await api.get(ep.admin.helpdeskSessions, { params: { status, limit: 100 } });
      setSessions(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openSession = async (s: HdSession) => {
    setSelected(s);
    setReply("");
    setLoadingMsgs(true);
    try {
      const { data } = await api.get<HdMessage[]>(ep.admin.helpdeskSessionMessages(s.id));
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoadingMsgs(false); }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await api.post(ep.admin.helpdeskReply(selected.id), { body: reply.trim() });
      setReply("");
      openSession(selected);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  const closeSession = async () => {
    if (!selected) return;
    try {
      await api.post(ep.admin.helpdeskClose(selected.id));
      toast.success("أُغلقت الجلسة");
      setSelected(null);
      fetchSessions();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const statusLabel = (key: string) => STATUSES.find((x) => x.key === key)?.label ?? key;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageHeader icon={<HeadphonesRound />} title="مركز المساعدة" subtitle="جلسات الدعم والمحادثات" />
        <Link href="/admin/helpdesk/flow"><Button variant="outline"><Routing className="h-4 w-4" /> محرّر الفلو</Button></Link>
      </div>

      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button key={s.key} onClick={() => { setStatus(s.key); setSelected(null); }}
            className={`px-3.5 py-1.5 rounded-full text-body font-medium transition-colors ${status === s.key ? "bg-primary text-white" : "bg-white text-muted-600 border border-muted-200"}`}>
            {s.label}
          </button>
        ))}
      </div>

      <ChatWorkspace>
        {/* القائمة */}
        <ChatListCard
          loading={loading}
          isEmpty={sessions.length === 0}
          emptyIcon={<HeadphonesRound />}
          emptyText="لا جلسات"
          skeletonRows={3}
        >
          {sessions.map((s) => (
            <ChatListRow key={s.id} active={selected?.id === s.id} onClick={() => openSession(s)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-body flex-1 truncate">
                  {s.user_name || `مستخدم #${s.user}`}
                </span>
                <span className={`text-micro px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] ?? ""}`}>
                  {statusLabel(s.status)}
                </span>
              </div>
              <p className="text-caption text-muted mt-1">
                {new Date(s.updated_at).toLocaleString(NUMERIC_LOCALE)}
              </p>
            </ChatListRow>
          ))}
        </ChatListCard>

        {/* المحادثة */}
        <ChatPanel>
          {!selected ? (
            <ChatPanelEmpty icon={<HeadphonesRound />} text="اختر جلسة لعرض المحادثة" />
          ) : (
            <>
              <ChatPanelHeader
                title={selected.user_name || `مستخدم #${selected.user}`}
                meta={
                  <span className={`text-micro px-2 py-0.5 rounded-full ${STATUS_BADGE[selected.status] ?? ""}`}>
                    {statusLabel(selected.status)}
                  </span>
                }
                actions={selected.status !== "closed" ? (
                  <Button size="sm" variant="outline" onClick={closeSession}>
                    <CheckCircle className="h-4 w-4" /> إغلاق
                  </Button>
                ) : undefined}
              />

              {/* نفس عناصر عرض محادثة التطبيق تمامًا (HelpdeskMessageRow) — عرض فقط */}
              <ChatScroll scrollKey={`${selected.id}:${messages.length}`}>
                {loadingMsgs ? (
                  <ChatScrollSkeleton />
                ) : messages.length === 0 ? (
                  <ChatScrollEmpty icon={<HeadphonesRound />} text="لا رسائل" />
                ) : (
                  <div className="space-y-1.5">
                    {messages.map((m, i) => (
                      <HelpdeskMessageRow key={m.id} m={m as unknown as HdMsg}
                        isLatest={i === messages.length - 1} readOnly />
                    ))}
                  </div>
                )}
              </ChatScroll>

              {selected.status !== "closed" && (
                <ChatComposer
                  value={reply}
                  onChange={setReply}
                  onSend={sendReply}
                  sending={sending}
                  placeholder="ردّ الموظّف… (Enter للإرسال، Shift+Enter لسطر جديد)"
                />
              )}
            </>
          )}
        </ChatPanel>
      </ChatWorkspace>
    </div>
  );
}
