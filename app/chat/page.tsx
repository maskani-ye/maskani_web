"use client";

import { useState, useEffect, useRef, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import type { Conversation, PaginatedResponse } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { ChatRoundDots, User as UserIcon } from "@solar-icons/react";

const LIMIT = 20;
const POLL_MS = 15000;
const asIcon = (I: ComponentType<{ className?: string }>) => I;

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchConversations = async () => {
      try {
        const res = await api.get<PaginatedResponse<Conversation>>("/chat/conversations/", {
          params: { offset: 0, limit: LIMIT },
        });
        setConversations(res.data.results);
      } catch (err) {
        if (firstLoad.current) toast.error(getErrorMessage(err));
      } finally {
        firstLoad.current = false;
        setLoading(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, POLL_MS);
    return () => clearInterval(interval);
  }, [authLoading, user]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <ChatRoundDots className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">المحادثات</h1>
          <p className="text-sm text-gray-500">رسائلك المباشرة</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={asIcon(ChatRoundDots)}
            title="لا توجد محادثات"
            message="ابدأ محادثة من صفحة إعلان أو ملف مستخدم"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map((c) => {
              const other = c.other_participant;
              return (
                <Link
                  key={c.id}
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {other?.avatar ? (
                        <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    {other?.is_online && (
                      <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" title="متصل الآن" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm text-gray-900 truncate ${c.unread_count > 0 ? "font-bold" : "font-semibold"}`}>
                        {other?.full_name ?? "مستخدم"}
                      </p>
                      {c.last_message?.created_at && (
                        <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(c.last_message.created_at)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-sm truncate ${c.unread_count > 0 ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                        {c.last_message?.body ?? "لا توجد رسائل بعد"}
                      </p>
                      {c.unread_count > 0 && (
                        <Badge variant="success" className="shrink-0">{c.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
