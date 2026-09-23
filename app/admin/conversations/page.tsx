"use client";

// لوحة المحادثات (الإدارة) — القائمة + الدردشة + ردّ الإدارة/حذف.
// الهيكل مشترك مع مركز المساعدة عبر `components/admin/chat/ChatWorkspace`.
import { useState, useEffect, useCallback } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { formatRelativeTime, NUMERIC_LOCALE } from "@/lib/utils";
import type {
  AdminConversation, AdminConversationMessage, ChatParticipant, PaginatedResponse,
} from "@/types";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ChatWorkspace, ChatListCard, ChatListRow, ChatPanel, ChatPanelEmpty,
  ChatPanelHeader, ChatScroll, ChatScrollEmpty, ChatScrollSkeleton, ChatComposer,
} from "@/components/admin/chat/ChatWorkspace";
import { toast } from "sonner";
import {
  ChatRoundDots, Magnifer, CloseCircle, User,
  AltArrowLeft, AltArrowRight, TrashBinTrash, ShieldCheck,
} from "@solar-icons/react";

const LIMIT = 20;
const MSG_LIMIT = 50;

//: البادئة التي يكتبها الخادم في نصّ رسالة الإدارة (`ADMIN_REPLY_PREFIX`).
// تُقتطع عند العرض هنا لأنّ الشارة تقول المعنى نفسه بلا تكرار.
const ADMIN_PREFIX = "إدارة مسكني:\n";

function Avatar({ p, small = false }: { p: ChatParticipant; small?: boolean }) {
  const cls = small ? "w-7 h-7" : "w-9 h-9";
  if (p.avatar) {
    return <img src={p.avatar} className={`${cls} rounded-full object-cover shrink-0`} alt="" />;
  }
  return (
    <div className={`${cls} rounded-full bg-primary/10 flex items-center justify-center shrink-0`}>
      <User className={small ? "h-3.5 w-3.5 text-primary" : "h-4 w-4 text-primary"} />
    </div>
  );
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<AdminConversationMessage[]>([]); // newest → oldest
  const [msgTotal, setMsgTotal] = useState(0);
  const [msgOffset, setMsgOffset] = useState(0);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const [deleteConvTarget, setDeleteConvTarget] = useState<AdminConversation | null>(null);
  const [deletingConv, setDeletingConv] = useState(false);
  const [deleteMsgTarget, setDeleteMsgTarget] = useState<AdminConversationMessage | null>(null);
  const [deletingMsg, setDeletingMsg] = useState(false);

  const fetchConversations = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(LIMIT), offset: String(off) };
      if (search) params.search = search;
      const res = await api.get<PaginatedResponse<AdminConversation>>(
        ep.admin.conversations, { params }
      );
      setConversations(res.data.results);
      setTotal(res.data.count);
      setOffset(off);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchConversations(0); }, [fetchConversations]);

  const loadMessages = useCallback(async (id: number, off: number, append: boolean) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get<PaginatedResponse<AdminConversationMessage>>(
        ep.admin.conversationMessages(id),
        { params: { limit: String(MSG_LIMIT), offset: String(off) } }
      );
      setMsgTotal(res.data.count);
      setMsgOffset(off);
      setMessages((prev) => append ? [...prev, ...res.data.results] : res.data.results);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const openConversation = (c: AdminConversation) => {
    setSelected(c);
    setMessages([]);
    setMsgTotal(0);
    setMsgOffset(0);
    setReply("");
    loadMessages(c.id, 0, false);
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!selected || !body) return;
    setSending(true);
    try {
      const res = await api.post<AdminConversationMessage>(
        ep.admin.conversationReply(selected.id), { body }
      );
      setReply("");
      // الإضافة في المقدّمة (المصفوفة الأحدث→الأقدم) بلا إعادة جلبٍ كامل.
      setMessages((prev) => [res.data, ...prev]);
      setMsgTotal((t) => t + 1);
      setSelected((c) => c ? { ...c, messages_count: c.messages_count + 1 } : c);
      setConversations((prev) => prev.map((c) => c.id === selected.id
        ? { ...c, last_message: c.last_message ? { ...c.last_message, body, is_deleted: false } : c.last_message }
        : c));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  const confirmDeleteConversation = async () => {
    if (!deleteConvTarget) return;
    setDeletingConv(true);
    try {
      await api.delete(ep.admin.conversation(deleteConvTarget.id));
      toast.success("تم حذف المحادثة");
      setConversations((prev) => prev.filter((c) => c.id !== deleteConvTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      if (selected?.id === deleteConvTarget.id) {
        setSelected(null);
        setMessages([]);
      }
      setDeleteConvTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeletingConv(false); }
  };

  const confirmDeleteMessage = async () => {
    if (!deleteMsgTarget || !selected) return;
    setDeletingMsg(true);
    try {
      await api.delete(ep.admin.conversationMessage(selected.id, deleteMsgTarget.id));
      toast.success("تم حذف الرسالة");
      setMessages((prev) => prev.filter((m) => m.id !== deleteMsgTarget.id));
      setMsgTotal((t) => Math.max(0, t - 1));
      setSelected((c) => c ? { ...c, messages_count: Math.max(0, c.messages_count - 1) } : c);
      setDeleteMsgTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeletingMsg(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;
  const hasOlder = messages.length < msgTotal;

  // Messages come newest→oldest from the API (matches the app); display oldest→newest.
  const displayMessages = [...messages].reverse();

  const pairName = (c: AdminConversation) =>
    `${c.participant_a.full_name} ↔ ${c.participant_b.full_name}`;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageHeader icon={<ChatRoundDots />} title="المحادثات"
          subtitle={`${total.toLocaleString(NUMERIC_LOCALE)} محادثة إجمالاً`} />
      </div>

      <div className="max-w-md">
        <Input
          placeholder="بحث باسم أحد الطرفين أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<Magnifer className="h-4 w-4" />}
          endIcon={search ? (
            <button onClick={() => setSearch("")}>
              <CloseCircle className="h-4 w-4 text-muted" />
            </button>
          ) : undefined}
        />
      </div>

      <ChatWorkspace>
        {/* ── القائمة ── */}
        <div className="space-y-4">
          <ChatListCard
            loading={loading}
            isEmpty={conversations.length === 0}
            emptyIcon={<ChatRoundDots />}
            emptyText="لا توجد محادثات"
          >
            {conversations.map((c) => (
              <ChatListRow key={c.id} active={selected?.id === c.id} onClick={() => openConversation(c)}>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 -space-x-reverse shrink-0">
                    <Avatar p={c.participant_a} />
                    <Avatar p={c.participant_b} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-body text-ink truncate">{pairName(c)}</span>
                      {c.unread_count > 0 && <Badge variant="green">{c.unread_count} غير مقروءة</Badge>}
                      {c.property && <Badge variant="blue">عقار #{c.property}</Badge>}
                    </div>
                    <p className="text-caption text-muted-500 mt-1 line-clamp-1">
                      {c.last_message
                        ? (c.last_message.is_deleted ? "تم حذف الرسالة" : c.last_message.body)
                        : "لا توجد رسائل"}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <p className="text-caption text-muted">{formatRelativeTime(c.updated_at)}</p>
                    <p className="text-caption text-muted mt-1 flex items-center gap-1 justify-end">
                      <ChatRoundDots className="h-3 w-3" /> {c.messages_count}
                    </p>
                  </div>
                </div>
              </ChatListRow>
            ))}
          </ChatListCard>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-body text-muted-500">صفحة {currentPage} من {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={offset === 0}
                  onClick={() => fetchConversations(offset - LIMIT)}>
                  <AltArrowRight className="h-4 w-4" /> السابق
                </Button>
                <Button variant="outline" disabled={offset + LIMIT >= total}
                  onClick={() => fetchConversations(offset + LIMIT)}>
                  التالي <AltArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── الدردشة ── */}
        <ChatPanel>
          {!selected ? (
            <ChatPanelEmpty icon={<ChatRoundDots />} text="اختر محادثة لعرض رسائلها" />
          ) : (
            <>
              <ChatPanelHeader
                title={pairName(selected)}
                meta={
                  <>
                    <Badge variant="gray">{selected.messages_count} رسالة</Badge>
                    {selected.unread_count > 0 && (
                      <Badge variant="green">{selected.unread_count} غير مقروءة</Badge>
                    )}
                    {selected.property && <Badge variant="blue">عقار #{selected.property}</Badge>}
                  </>
                }
                actions={
                  <>
                    <button
                      onClick={() => setDeleteConvTarget(selected)}
                      className="p-1.5 rounded-lg hover:bg-danger-50 text-muted hover:text-danger-600 transition-colors"
                      title="حذف المحادثة"
                    >
                      <TrashBinTrash className="h-4 w-4" />
                    </button>
                    <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted-100">
                      <CloseCircle className="h-4 w-4 text-muted" />
                    </button>
                  </>
                }
              />

              <ChatScroll scrollKey={`${selected.id}:${messages.length}`}>
                {hasOlder && (
                  <div className="text-center">
                    <Button variant="ghost" size="sm" loading={loadingMsgs}
                      onClick={() => loadMessages(selected.id, msgOffset + MSG_LIMIT, true)}>
                      تحميل رسائل أقدم
                    </Button>
                  </div>
                )}

                {loadingMsgs && messages.length === 0 ? (
                  <ChatScrollSkeleton />
                ) : displayMessages.length === 0 ? (
                  <ChatScrollEmpty icon={<ChatRoundDots />} text="لا توجد رسائل" />
                ) : (
                  displayMessages.map((m) => {
                    // ⚠️ المُرسِل قد يكون **ثالثاً**: مشرفاً ردّ من هنا. تمييزه
                    // إلزاميّ وإلّا ظهر ردّ الإدارة كأنّه من أحد الطرفين.
                    const fromAdmin =
                      m.sender.id !== selected.participant_a.id &&
                      m.sender.id !== selected.participant_b.id;
                    const mine = m.sender.id === selected.participant_a.id;
                    const body = m.is_deleted
                      ? "تم حذف الرسالة"
                      : (fromAdmin && m.body.startsWith(ADMIN_PREFIX)
                          ? m.body.slice(ADMIN_PREFIX.length)
                          : m.body);
                    const meta = (
                      <div className="flex items-center gap-1.5 mt-1 text-micro text-muted">
                        <span>{m.sender.full_name}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(m.created_at)}</span>
                        {m.is_edited && !m.is_deleted && <span>· مُعدّلة</span>}
                        {m.is_read && !fromAdmin && <span>· مقروءة</span>}
                        <button
                          onClick={() => setDeleteMsgTarget(m)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted hover:text-danger-600"
                          title="حذف الرسالة"
                        >
                          <TrashBinTrash className="h-3 w-3" />
                        </button>
                      </div>
                    );

                    if (fromAdmin) {
                      return (
                        <div key={m.id} className="group flex justify-center">
                          <div className="max-w-[85%] rounded-2xl border border-primary/25 bg-primary/5 px-3.5 py-2">
                            <div className="flex items-center gap-1.5 text-micro font-semibold text-primary mb-1">
                              <ShieldCheck className="h-3.5 w-3.5" /> إدارة مسكني
                            </div>
                            <p className={`text-body break-words whitespace-pre-wrap ${m.is_deleted ? "text-muted italic" : "text-ink"}`}>
                              {body}
                            </p>
                            {meta}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={m.id} className={`group flex gap-2 ${mine ? "flex-row" : "flex-row-reverse"}`}>
                        <Avatar p={m.sender} small />
                        <div className={`flex-1 min-w-0 ${mine ? "text-right" : "text-left"}`}>
                          <div
                            className={`inline-block max-w-full rounded-2xl px-3 py-2 text-body break-words whitespace-pre-wrap ${
                              m.is_deleted
                                ? "bg-muted-50 text-muted italic"
                                : mine
                                ? "bg-primary/10 text-ink"
                                : "bg-white border border-muted-100 text-ink"
                            }`}
                          >
                            {body}
                          </div>
                          {meta}
                        </div>
                      </div>
                    );
                  })
                )}
              </ChatScroll>

              <ChatComposer
                value={reply}
                onChange={setReply}
                onSend={sendReply}
                sending={sending}
                placeholder="ردّ الإدارة… (Enter للإرسال، Shift+Enter لسطر جديد)"
                hint="يصل الردّ الطرفين معاً باسم «إدارة مسكني»."
              />
            </>
          )}
        </ChatPanel>
      </ChatWorkspace>

      <ConfirmDialog
        open={!!deleteConvTarget}
        title="حذف المحادثة"
        message={
          deleteConvTarget
            ? <>هل أنت متأكد من حذف المحادثة بين <strong>{deleteConvTarget.participant_a.full_name}</strong> و<strong>{deleteConvTarget.participant_b.full_name}</strong>؟ سيتم حذف كل الرسائل نهائياً ولا يمكن التراجع.</>
            : ""
        }
        confirmLabel="حذف نهائي"
        variant="danger"
        loading={deletingConv}
        onConfirm={confirmDeleteConversation}
        onCancel={() => setDeleteConvTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteMsgTarget}
        title="حذف الرسالة"
        message="هل أنت متأكد من حذف هذه الرسالة نهائياً؟ لا يمكن التراجع."
        confirmLabel="حذف"
        variant="danger"
        loading={deletingMsg}
        onConfirm={confirmDeleteMessage}
        onCancel={() => setDeleteMsgTarget(null)}
      />
    </div>
  );
}
