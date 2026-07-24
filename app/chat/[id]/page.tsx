"use client";

import { useState, useEffect, useRef, useCallback, type ComponentType } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import type { Conversation, Message, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";
import { ChatRoundDots, User as UserIcon, AltArrowRight, Buildings2, Plain } from "@solar-icons/react";

const MESSAGES_LIMIT = 50;
const POLL_MS = 8000;
const asIcon = (I: ComponentType<{ className?: string }>) => I;

export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);

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
        const found = r.data.results.find((c) => c.id === Number(id));
        if (found) setConversation(found);
      })
      .catch(() => {});
  }, [id, authLoading, user]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get<PaginatedResponse<Message>>(`/chat/conversations/${id}/messages/`, {
        params: { offset: 0, limit: MESSAGES_LIMIT },
      });
      // API returns newest-first — reverse to chronological (oldest top)
      const chronological = [...res.data.results].reverse();
      setMessages((prev) => {
        const changed = prev.length !== chronological.length || prev[prev.length - 1]?.id !== chronological[chronological.length - 1]?.id;
        return changed ? chronological : prev;
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

  useEffect(() => {
    if (authLoading || !user) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_MS);
    const onFocus = () => fetchMessages();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [authLoading, user, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const text = body.trim();
    if (!text || sending) return;
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
              {conversation?.listing != null && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Buildings2 className="h-3.5 w-3.5" /> بخصوص إعلان
                </span>
              )}
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
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-gray-400"}`}>
                    {formatRelativeTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send box */}
      <div className="mt-4 bg-white rounded-2xl card-shadow p-3 flex items-end gap-2 shrink-0">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="اكتب رسالة..."
          className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm max-h-32 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <Button size="icon" onClick={sendMessage} loading={sending} disabled={!body.trim()} aria-label="إرسال">
          {!sending && <Plain className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
