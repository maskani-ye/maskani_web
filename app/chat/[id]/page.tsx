"use client";

import { useState, useEffect, useRef, useCallback, type ComponentType } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useChatSocket, type ChatAction } from "@/hooks/useChatSocket";
import { formatRelativeTime } from "@/lib/utils";
import {
  detectAttachmentType,
  normalizeAttachment,
  readImageDimensions,
  uploadAttachment,
  uploadToSocketAttachment,
} from "@/lib/chatAttachments";
import type { Attachment, AttachmentType, Conversation, Message, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageAttachments } from "@/components/chat/MessageAttachments";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { toast } from "sonner";
import { ChatRoundDots, User as UserIcon, AltArrowRight, Buildings2, Paperclip, Plain, CheckRead } from "@solar-icons/react";

const MESSAGES_LIMIT = 50;
// نستعمل REST كسقوط آمن فقط عندما لا يكون السوكِت متصلاً (بدلاً من الاستطلاع الدائم).
const FALLBACK_POLL_MS = 8000;
const TYPING_IDLE_MS = 3000;
const asIcon = (I: ComponentType<{ className?: string }>) => I;

// ─── تطبيع رسالة قادمة من السوكِت (sender_id/reply_to قد تصل بأشكال مختلفة) ──
function normalizeSocketMessage(
  data: Record<string, unknown>,
  conversationId: number,
): Message {
  const rawSender = data.sender_id ?? data.sender;
  const senderId =
    typeof rawSender === "object" && rawSender !== null
      ? Number((rawSender as { id?: number }).id ?? 0)
      : Number(rawSender ?? 0);

  const rawReply = data.reply_to ?? data.reply;
  const replyTo =
    typeof rawReply === "object" && rawReply !== null
      ? Number((rawReply as { id?: number }).id ?? 0)
      : rawReply != null
        ? Number(rawReply)
        : null;

  const rawAttachments = Array.isArray(data.attachments) ? (data.attachments as unknown[]) : [];
  const attachments: Attachment[] = rawAttachments
    .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
    .map(normalizeAttachment);

  return {
    id: Number(data.id),
    conversation: Number(data.conversation ?? conversationId),
    sender: senderId,
    body: String(data.body ?? ""),
    is_read: Boolean(data.is_read ?? false),
    created_at: String(data.created_at ?? new Date().toISOString()),
    reply_to: replyTo,
    is_edited: Boolean(data.is_edited ?? false),
    is_deleted: Boolean(data.is_deleted ?? false),
    attachments,
  };
}

export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const conversationId = Number(id);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // روابط blob محلية للمعاينة الفورية — تُبطَل عند إلغاء التركيب لتفادي التسريب.
  const objectUrlsRef = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentRef = useRef(false);
  const otherTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // مرجع لدالة الإرسال عبر السوكِت — يُملأ بعد استدعاء الخطّاف (يتجنّب الدائرية).
  const sendRef = useRef<((action: ChatAction, data?: Record<string, unknown>) => boolean) | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  // Load conversation header (from the list — no dedicated detail endpoint)
  useEffect(() => {
    if (authLoading || !user) return;
    api.get<PaginatedResponse<Conversation>>("/chat/conversations/", { params: { offset: 0, limit: 100 } })
      .then((r) => {
        const found = r.data.results.find((c) => c.id === conversationId);
        if (found) setConversation(found);
      })
      .catch(() => {});
  }, [conversationId, authLoading, user]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get<PaginatedResponse<Message>>(`/chat/conversations/${id}/messages/`, {
        params: { offset: 0, limit: MESSAGES_LIMIT },
      });
      // API returns newest-first — reverse to chronological (oldest top)
      const chronological = [...res.data.results].reverse();
      setMessages((prev) => {
        // لا تدُس رسائل متفائلة أو رسائل سوكِت أحدث لم تصل بعد لصفحة الـREST.
        const optimistic = prev.filter((m) => m.id < 0);
        const merged = [...chronological];
        for (const o of optimistic) {
          if (!merged.some((m) => m.body === o.body && m.sender === o.sender)) merged.push(o);
        }
        const changed =
          prev.length !== merged.length ||
          prev[prev.length - 1]?.id !== merged[merged.length - 1]?.id;
        return changed ? merged : prev;
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        router.push("/chat");
        return;
      }
      if (firstLoad.current) toast.error(getErrorMessage(err));
    } finally {
      firstLoad.current = false;
      setLoading(false);
    }
  }, [id, router]);

  // ─── مؤشّر الكتابة الوارد ─────────────────────────────────────────────────
  const showOtherTyping = useCallback((type: string | undefined) => {
    setOtherTyping(true);
    if (otherTypingTimerRef.current) clearTimeout(otherTypingTimerRef.current);
    otherTypingTimerRef.current = setTimeout(
      () => setOtherTyping(false),
      type === "voice" ? 120_000 : 30_000,
    );
  }, []);

  const hideOtherTyping = useCallback(() => {
    if (otherTypingTimerRef.current) clearTimeout(otherTypingTimerRef.current);
    setOtherTyping(false);
  }, []);

  // ─── السوكِت اللحظي ───────────────────────────────────────────────────────
  const socket = useChatSocket({
    conversationId,
    userId: user?.id,
    enabled: !authLoading && !!user && Number.isFinite(conversationId),
    onOpen: () => {
      // أعلِم الطرف الآخر أنّني قرأت كل رسائله (REST يعلّمها مقروءة خادمياً فقط).
      sendRef.current?.("read_all", {});
    },
    onReconnected: () => {
      sendRef.current?.("read_all", {});
      fetchMessages();
    },
    onNewMessage: (data, isMe) => {
      const msg = normalizeSocketMessage(data, conversationId);
      setMessages((prev) => {
        // توفيق الرسالة المتفائلة (صدى رسالتي): استبدلها في مكانها.
        if (isMe) {
          const msgHasAtt = (msg.attachments?.length ?? 0) > 0;
          // نفصل رسائل المرفقات عن الرسائل النصية حتى لا يتصادم توفيق أحدهما بالآخر.
          const optIdx = prev.findIndex(
            (m) =>
              m.id < 0 &&
              m.sender === msg.sender &&
              m.body === msg.body &&
              ((m.attachments?.length ?? 0) > 0) === msgHasAtt,
          );
          if (optIdx >= 0) {
            const copy = [...prev];
            copy[optIdx] = msg;
            return copy;
          }
        }
        const idx = prev.findIndex((m) => m.id === msg.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = msg;
          return copy;
        }
        return [...prev, msg];
      });
      if (!isMe) {
        hideOtherTyping();
        // رسالة واردة: أعلِم المُرسِل بأنّها قُرئت.
        sendRef.current?.("read_message", { message_id: msg.id });
      }
    },
    onEdited: (data) => {
      const msg = normalizeSocketMessage(data, conversationId);
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === msg.id);
        if (idx < 0) return prev;
        const copy = [...prev];
        copy[idx] = msg;
        return copy;
      });
    },
    onDeleted: (messageId) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, body: "" } : m)),
      );
    },
    onReadMessage: (messageId) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m)));
    },
    onReadAll: () => {
      setMessages((prev) =>
        prev.map((m) => (m.sender === user?.id && !m.is_read && !m.is_deleted ? { ...m, is_read: true } : m)),
      );
    },
    onTyping: (isTyping, type, isMe) => {
      if (isMe) return;
      if (isTyping) showOtherTyping(type);
      else hideOtherTyping();
    },
  });
  sendRef.current = socket.send;

  // Initial history + REST fallback polling (only while the socket is down).
  useEffect(() => {
    if (authLoading || !user) return;
    fetchMessages();
    const interval = setInterval(() => {
      if (!socket.isConnected) fetchMessages();
    }, FALLBACK_POLL_MS);
    const onFocus = () => {
      if (!socket.isConnected) fetchMessages();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [authLoading, user, fetchMessages, socket.isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherTyping, scrollToBottom]);

  useEffect(() => {
    // نلتقط مرجع المصفوفة (نفسه يتراكم عبر push) لتنظيفه عند إلغاء التركيب.
    const objectUrls = objectUrlsRef.current;
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (otherTypingTimerRef.current) clearTimeout(otherTypingTimerRef.current);
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // ─── إرسال إشارة الكتابة (typing) من حقل الإدخال ─────────────────────────
  const emitTyping = useCallback(() => {
    if (!socket.isConnected) return;
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      socket.send("typing", { is_typing: true, type: "text" });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingSentRef.current = false;
      socket.send("typing", { is_typing: false });
    }, TYPING_IDLE_MS);
  }, [socket]);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (typingSentRef.current) {
      typingSentRef.current = false;
      socket.send("typing", { is_typing: false });
    }
  }, [socket]);

  const sendMessage = async () => {
    const text = body.trim();
    if (!text || sending) return;
    stopTyping();

    // المسار اللحظي: إدراج متفائل + الإرسال عبر السوكِت ودَع الصدى يوفّق.
    if (socket.isConnected) {
      const optimistic: Message = {
        id: -Date.now(),
        conversation: conversationId,
        sender: user?.id ?? 0,
        body: text,
        is_read: false,
        created_at: new Date().toISOString(),
        reply_to: null,
        is_edited: false,
        is_deleted: false,
      };
      setMessages((prev) => [...prev, optimistic]);
      setBody("");
      const ok = socket.send("send_message", { body: text });
      if (ok) return;
      // فشل الإرسال عبر السوكِت — أزِل المتفائلة واسقُط لـREST.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }

    // سقوط آمن لـREST عندما لا يكون السوكِت متاحاً.
    setSending(true);
    try {
      const res = await api.post<Message>(`/chat/conversations/${id}/messages/`, { body: text });
      setMessages((prev) => [...prev, res.data]);
      setBody("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── إرسال مرفق: إدراج متفائل → رفع REST → إرسال عبر السوكِت (الصدى يوفّق) ──
  const markAttachmentFailed = useCallback((optimisticId: number) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === optimisticId && m.attachments?.length
          ? { ...m, attachments: m.attachments.map((a) => ({ ...a, status: "failed" as const })) }
          : m,
      ),
    );
  }, []);

  const sendAttachment = useCallback(
    async (file: File, type: AttachmentType, meta: { durationMs?: number; width?: number; height?: number } = {}) => {
      if (!socket.isConnected) {
        toast.error("تعذّر إرسال المرفق — لا يوجد اتصال");
        return;
      }
      const optimisticId = -Date.now();
      const localUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(localUrl);

      const optimistic: Message = {
        id: optimisticId,
        conversation: conversationId,
        sender: user?.id ?? 0,
        body: "",
        is_read: false,
        created_at: new Date().toISOString(),
        reply_to: null,
        is_edited: false,
        is_deleted: false,
        attachments: [
          {
            id: optimisticId,
            type,
            url: "",
            status: "uploading",
            local_url: localUrl,
            mime_type: file.type || null,
            size_bytes: file.size,
            duration_ms: meta.durationMs ?? null,
            width: meta.width ?? null,
            height: meta.height ?? null,
          },
        ],
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const upload = await uploadAttachment(id, file, type, meta);
        // حدّث المرفقة المتفائلة برابط الخادم (مع إبقاء المعاينة المحلية).
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId && m.attachments?.length
              ? { ...m, attachments: [{ ...m.attachments[0], status: "ready" as const, url: upload.url }] }
              : m,
          ),
        );
        const ok = socket.send("send_message", { attachments: [uploadToSocketAttachment(upload)] });
        if (!ok) {
          markAttachmentFailed(optimisticId);
          toast.error("تعذّر إرسال المرفق");
        }
      } catch (err) {
        markAttachmentFailed(optimisticId);
        toast.error(getErrorMessage(err));
      }
    },
    [socket, conversationId, user?.id, id, markAttachmentFailed],
  );

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // اسمح بإعادة اختيار نفس الملف
    if (!file) return;
    const type = detectAttachmentType(file);
    const dims = type === "image" ? await readImageDimensions(file) : null;
    await sendAttachment(file, type, dims ? { width: dims.width, height: dims.height } : {});
  };

  const handleVoiceSend = useCallback(
    (file: File, durationMs: number) => {
      void sendAttachment(file, "audio", { durationMs });
    },
    [sendAttachment],
  );

  const other = conversation?.other_participant;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-4 flex items-center gap-3 shrink-0">
        <Link href="/chat" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="رجوع">
          <AltArrowRight className="h-5 w-5 text-gray-500" />
        </Link>
        {other ? (
          <Link href={`/users/${other.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {other.avatar ? (
                <img src={other.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{other.full_name}</p>
              {otherTyping ? (
                <span className="text-xs text-primary animate-pulse">يكتب الآن…</span>
              ) : conversation?.listing != null ? (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Buildings2 className="h-3.5 w-3.5" /> بخصوص إعلان
                </span>
              ) : null}
            </div>
          </Link>
        ) : (
          <div className="flex-1">
            <Skeleton className="h-4 w-28" />
          </div>
        )}
        {conversation?.listing != null && (
          <Link href={`/listings/${conversation.listing}`}>
            <Button variant="outline" size="sm">
              <Buildings2 className="h-4 w-4" /> الإعلان
            </Button>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl card-shadow p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={`h-10 ${i % 2 === 0 ? "w-1/2 mr-auto" : "w-2/3 ml-auto"} rounded-2xl`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState icon={asIcon(ChatRoundDots)} title="لا توجد رسائل بعد" message="اكتب أول رسالة أدناه" />
        ) : (
          messages.map((m) => {
            const mine = m.sender === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    mine ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.is_deleted ? (
                    <p className={`text-sm italic ${mine ? "text-white/60" : "text-gray-400"}`}>
                      تم حذف هذه الرسالة
                    </p>
                  ) : (
                    <>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className={m.body ? "mb-1.5" : ""}>
                          <MessageAttachments attachments={m.attachments} mine={mine} />
                        </div>
                      )}
                      {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                    </>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${mine ? "text-white/70" : "text-gray-400"}`}>
                    <span className="text-[10px]">{formatRelativeTime(m.created_at)}</span>
                    {m.is_edited && !m.is_deleted && <span className="text-[10px]">· معدّلة</span>}
                    {mine && !m.is_deleted && m.id > 0 && (
                      <CheckRead className={`h-3.5 w-3.5 ${m.is_read ? "text-white" : "text-white/50"}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {otherTyping && (
          <div className="flex justify-end">
            <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-2.5 text-sm animate-pulse">يكتب الآن…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send box */}
      <div className="mt-4 bg-white rounded-2xl card-shadow p-3 flex items-end gap-2 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,*/*"
          onChange={handleFilePicked}
          className="hidden"
        />
        {!isRecording && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="إرفاق ملف"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary-50"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                emitTyping();
              }}
              onKeyDown={handleKeyDown}
              onBlur={stopTyping}
              rows={1}
              placeholder="اكتب رسالة..."
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm max-h-32 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </>
        )}
        <VoiceRecorder onSend={handleVoiceSend} onRecordingChange={setIsRecording} />
        {!isRecording && (
          <Button size="icon" onClick={sendMessage} loading={sending} disabled={!body.trim()} aria-label="إرسال">
            {!sending && <Plain className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
