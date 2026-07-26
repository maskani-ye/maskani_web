"use client";

import { useState, useEffect, useCallback } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type {
  AdminConversation, AdminConversationMessage, ChatParticipant, PaginatedResponse,
} from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import {
  ChatRoundDots, Magnifer, CloseCircle, User,
  AltArrowLeft, AltArrowRight, Buildings2,
} from "@solar-icons/react";

const LIMIT = 20;
const MSG_LIMIT = 50;

// ─── Avatar ─────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // ── Fetch conversations ─────────────────────────────────────────────────────
  const fetchConversations = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(LIMIT), offset: String(off) };
      if (search) params.search = search;
      const res = await api.get<PaginatedResponse<AdminConversation>>(
        "/admin/conversations/", { params }
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

  // ── Fetch messages of the selected conversation ─────────────────────────────
  const loadMessages = useCallback(async (id: number, off: number, append: boolean) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get<PaginatedResponse<AdminConversationMessage>>(
        `/admin/conversations/${id}/messages/`,
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
    loadMessages(c.id, 0, false);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;
  const hasOlder = messages.length < msgTotal;

  // Messages come newest→oldest from the API (matches the app); display oldest→newest.
  const displayMessages = [...messages].reverse();

  const pairName = (c: AdminConversation) =>
    `${c.participant_a.full_name} ↔ ${c.participant_b.full_name}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChatRoundDots className="h-6 w-6 text-primary" />
            المحادثات
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString("ar-YE")} محادثة إجمالاً</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="بحث باسم أحد الطرفين أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Magnifer className="h-4 w-4" />}
            endIcon={search ? (
              <button onClick={() => setSearch("")}>
                <CloseCircle className="h-4 w-4 text-gray-400" />
              </button>
            ) : undefined}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── List Panel ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <ChatRoundDots className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد محادثات</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openConversation(c)}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selected?.id === c.id ? "bg-primary/5 border-r-2 border-primary" : ""
                    }`}
                  >
                    {/* Paired avatars */}
                    <div className="flex -space-x-2 -space-x-reverse shrink-0">
                      <Avatar p={c.participant_a} />
                      <Avatar p={c.participant_b} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {pairName(c)}
                        </span>
                        {c.unread_count > 0 && (
                          <Badge variant="green">{c.unread_count} غير مقروءة</Badge>
                        )}
                        {c.listing && <Badge variant="blue">إعلان #{c.listing}</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {c.last_message
                          ? (c.last_message.is_deleted ? "تم حذف الرسالة" : c.last_message.body)
                          : "لا توجد رسائل"}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="text-left shrink-0">
                      <p className="text-xs text-gray-400">{formatRelativeTime(c.updated_at)}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                        <ChatRoundDots className="h-3 w-3" /> {c.messages_count}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-gray-500">صفحة {currentPage} من {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => fetchConversations(offset - LIMIT)}
                >
                  <AltArrowRight className="h-4 w-4" /> السابق
                </Button>
                <Button
                  variant="outline"
                  disabled={offset + LIMIT >= total}
                  onClick={() => fetchConversations(offset + LIMIT)}
                >
                  التالي <AltArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Detail Panel (messages, read-only) ── */}
        {selected && (
          <div className="w-96 shrink-0">
            <div className="bg-white rounded-2xl card-shadow p-5 sticky top-6 flex flex-col max-h-[calc(100vh-120px)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">{pairName(selected)}</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <CloseCircle className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Meta */}
              <div className="flex gap-2 flex-wrap mb-4">
                <Badge variant="gray">{selected.messages_count} رسالة</Badge>
                {selected.unread_count > 0 && (
                  <Badge variant="green">{selected.unread_count} غير مقروءة</Badge>
                )}
                {selected.listing && <Badge variant="blue">إعلان #{selected.listing}</Badge>}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-3">
                {hasOlder && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={loadingMsgs}
                      onClick={() => loadMessages(selected.id, msgOffset + MSG_LIMIT, true)}
                    >
                      تحميل رسائل أقدم
                    </Button>
                  </div>
                )}

                {loadingMsgs && messages.length === 0 ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <ChatRoundDots className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد رسائل</p>
                  </div>
                ) : (
                  displayMessages.map((m) => {
                    const mine = m.sender.id === selected.participant_a.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 ${mine ? "flex-row" : "flex-row-reverse"}`}
                      >
                        <Avatar p={m.sender} small />
                        <div className={`flex-1 min-w-0 ${mine ? "text-right" : "text-left"}`}>
                          <div
                            className={`inline-block max-w-full rounded-2xl px-3 py-2 text-sm break-words ${
                              m.is_deleted
                                ? "bg-gray-50 text-gray-400 italic"
                                : mine
                                ? "bg-primary/10 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {m.is_deleted ? "تم حذف الرسالة" : m.body}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                            <span>{m.sender.full_name}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(m.created_at)}</span>
                            {m.is_edited && !m.is_deleted && <span>· مُعدّلة</span>}
                            {m.is_read && <span>· مقروءة</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty detail hint (desktop) */}
        {!selected && (
          <div className="w-96 shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl card-shadow p-8 text-center text-gray-400">
              <Buildings2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">اختر محادثة لعرض رسائلها</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
