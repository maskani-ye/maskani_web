"use client";

// لوحة مركز المساعدة (الإدارة) — الجلسات + المحادثة + ردّ الموظّف/إغلاق.
// محرّك الفلو الشبكي: الرسائل envelopes موحّدة (bot/user/agent).
import { useCallback, useEffect, useState } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { HelpdeskMessageRow, type HdMessage as HdMsg } from "@/components/helpdesk/HelpdeskChat";
import { toast } from "sonner";
import { Routing, HeadphonesRound, CheckCircle, Plain } from "@solar-icons/react";

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
        {/* القائمة */}
        <div className="bg-white rounded-2xl shadow-e2 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 bg-muted-50 animate-pulse rounded-xl" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center text-muted"><HeadphonesRound className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>لا جلسات</p></div>
          ) : (
            <div className="divide-y divide-muted-50">
              {sessions.map((s) => (
                <button key={s.id} onClick={() => openSession(s)}
                  className={`w-full text-right p-4 hover:bg-muted-50 transition-colors ${selected?.id === s.id ? "bg-primary/5" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-body flex-1 truncate">{s.user_name || `مستخدم #${s.user}`}</span>
                    <span className={`text-micro px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] ?? ""}`}>
                      {STATUSES.find((x) => x.key === s.status)?.label ?? s.status}
                    </span>
                  </div>
                  <p className="text-caption text-muted mt-1">{new Date(s.updated_at).toLocaleString(NUMERIC_LOCALE)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* المحادثة */}
        <div className="bg-white rounded-2xl shadow-e2 flex flex-col min-h-[400px]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted text-body">اختر جلسة لعرض المحادثة</div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-muted-100">
                <span className="font-bold text-ink">{selected.user_name || `مستخدم #${selected.user}`}</span>
                {selected.status !== "closed" && (
                  <Button size="sm" variant="outline" onClick={closeSession}><CheckCircle className="h-4 w-4" /> إغلاق</Button>
                )}
              </div>
              {/* نفس عناصر عرض محادثة التطبيق تمامًا (HelpdeskMessageRow) — عرض فقط */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[55vh] bg-cream">
                {loadingMsgs ? <p className="text-center text-muted text-body">جارٍ التحميل…</p> :
                  messages.map((m, i) => (
                    <HelpdeskMessageRow key={m.id} m={m as unknown as HdMsg}
                      isLatest={i === messages.length - 1} readOnly />
                  ))}
              </div>
              {selected.status !== "closed" && (
                <div className="p-3 border-t border-muted-100 flex items-end gap-2">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={1} placeholder="ردّ الموظّف…"
                    className="flex-1 border border-muted-200 rounded-xl px-3 py-2 text-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button size="icon" loading={sending} onClick={sendReply} disabled={!reply.trim()}><Plain className="h-5 w-5" /></Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
