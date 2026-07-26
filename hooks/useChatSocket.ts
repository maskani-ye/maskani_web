"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";

/**
 * useChatSocket — دردشة لحظية عبر WebSocket المتصفّح (نظير `MessagesCubit`/`SocketManager`
 * في عميل فلاتر/azbah — نفس البروتوكول والإجراءات).
 *
 * القناة: `wss://<host>/ws/conversations/<id>/chat/?token=<knox>` — المضيف يُشتقّ من
 * `NEXT_PUBLIC_API_URL` (https→wss وبإسقاط بادئة `/api/v1`). توكن knox في كوكي `token`
 * يُمرَّر عبر `?token=` لأن المتصفح لا يسمح بضبط ترويسات على اتصال WS.
 *
 * الغلاف (وارد وصادر): `{ action, data, user_id }`. `user_id` هو الفاعل — يُقارَن بمعرّف
 * المستخدم الحالي لمعرفة إن كان الحدث "مني".
 *
 * يشمل: إعادة اتصال تلقائية بتراجع أُسّي (مثل `enableReconnect`)، نبضة `ping` للإبقاء على
 * الاتصال حيّاً، وتفكيكاً نظيفاً عند إلغاء التركيب أو تغيّر المحادثة. محروس ضد الـSSR.
 */

// ─── اشتقاق قاعدة WebSocket من قاعدة الـAPI ────────────────────────────────
export function wsBaseFromApiUrl(apiUrl: string): string {
  // مثال: https://api.maskani.homes/api/v1 → wss://api.maskani.homes
  const noApiSuffix = apiUrl.replace(/\/api\/v1\/?$/, "");
  return noApiSuffix.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://");
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function conversationChatWsUrl(conversationId: number | string, token: string): string {
  const base = wsBaseFromApiUrl(API_URL);
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${base}/ws/conversations/${conversationId}/chat/${q}`;
}

// ─── أنواع البروتوكول ──────────────────────────────────────────────────────
export type ChatAction =
  | "send_message"
  | "reply_message"
  | "edit_message"
  | "delete_message"
  | "read_message"
  | "read_all"
  | "typing"
  | "ping";

interface Envelope {
  action: string;
  data?: Record<string, unknown>;
  user_id?: number;
}

export type SocketState = "connecting" | "connected" | "disconnected";

export interface UseChatSocketOptions {
  conversationId: number | string;
  /** معرّف المستخدم الحالي — لتحديد إن كان الحدث الوارد "مني". */
  userId: number | undefined;
  /** يُفعِّل الاتصال؛ اجعله false حتى يجهز userId/المصادقة. */
  enabled?: boolean;
  onNewMessage?: (data: Record<string, unknown>, isMe: boolean) => void;
  onEdited?: (data: Record<string, unknown>) => void;
  onDeleted?: (messageId: number) => void;
  onReadMessage?: (messageId: number) => void;
  onReadAll?: () => void;
  onTyping?: (isTyping: boolean, type: string | undefined, isMe: boolean) => void;
  /** يُستدعى عند أول فتح ناجح للقناة. */
  onOpen?: () => void;
  /** يُستدعى بعد نجاح إعادة الاتصال (لإعادة إرسال read_all مثلاً). */
  onReconnected?: () => void;
}

export interface ChatSocket {
  send: (action: ChatAction, data?: Record<string, unknown>) => boolean;
  state: SocketState;
  isConnected: boolean;
}

// إعدادات إعادة الاتصال — مطابِقة لـSocketManager في shared_utils.
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 120_000;
const PING_INTERVAL_MS = 25_000;

function parseId(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const n = Number.parseInt(String(value).trim(), 10);
  return Number.isNaN(n) ? null : n;
}

export function useChatSocket(options: UseChatSocketOptions): ChatSocket {
  const { conversationId, userId, enabled = true } = options;

  const [state, setState] = useState<SocketState>("disconnected");

  // نُبقي أحدث نسخة من الـcallbacks في ref حتى لا يُعاد الاتصال عند كل رندر.
  const optsRef = useRef(options);
  optsRef.current = options;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentionalCloseRef = useRef(false);
  // جيل الاتصال — يمنع تداخل callbacks من اتصال قديم مع اتصال جديد.
  const generationRef = useRef(0);

  const send = useCallback((action: ChatAction, data: Record<string, unknown> = {}): boolean => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify({ action, data }));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // حارس SSR — لا نتصل إلا في المتصفح، وبوجود userId ومحادثة صالحة.
    if (typeof window === "undefined") return;
    if (!enabled || userId == null || conversationId == null || conversationId === "") return;

    intentionalCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    const myGeneration = ++generationRef.current;

    const clearTimers = () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      reconnectTimerRef.current = null;
      pingTimerRef.current = null;
    };

    const startPing = () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      pingTimerRef.current = setInterval(() => {
        const ws = socketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ action: "ping", data: {} }));
          } catch {
            /* تجاهُل — ستتكفّل onclose بإعادة الاتصال */
          }
        }
      }, PING_INTERVAL_MS);
    };

    const scheduleReconnect = () => {
      if (intentionalCloseRef.current || myGeneration !== generationRef.current) return;
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;
      reconnectAttemptsRef.current += 1;
      const attempt = reconnectAttemptsRef.current;
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (intentionalCloseRef.current || myGeneration !== generationRef.current) return;
        connect(true);
      }, delay);
    };

    const handleEnvelope = (raw: string) => {
      let env: Envelope;
      try {
        env = JSON.parse(raw) as Envelope;
      } catch {
        return;
      }
      const action = env.action ?? "";
      const data = (env.data ?? {}) as Record<string, unknown>;
      const isMe = env.user_id === optsRef.current.userId;
      const cb = optsRef.current;

      switch (action) {
        case "send_message":
        case "reply_message":
          cb.onNewMessage?.(data, isMe);
          break;
        case "edit_message":
          cb.onEdited?.(data);
          break;
        case "delete_message": {
          const id = parseId(data.message_id);
          if (id != null) cb.onDeleted?.(id);
          break;
        }
        case "read_message": {
          if (isMe) break;
          const id = parseId(data.message_id);
          if (id != null) cb.onReadMessage?.(id);
          break;
        }
        case "read_all":
          if (!isMe) cb.onReadAll?.();
          break;
        case "typing":
          cb.onTyping?.(data.is_typing === true, data.type as string | undefined, isMe);
          break;
        case "pong":
        case "ping":
          break;
        default:
          break;
      }
    };

    const connect = (isReconnect: boolean) => {
      if (myGeneration !== generationRef.current) return;
      // أغلق أي اتصال سابق قبل فتح آخر.
      if (socketRef.current) {
        try {
          socketRef.current.close(1000);
        } catch {
          /* ignore */
        }
        socketRef.current = null;
      }

      const token = Cookies.get("token") ?? "";
      setState("connecting");

      let ws: WebSocket;
      try {
        ws = new WebSocket(conversationChatWsUrl(conversationId, token));
      } catch {
        scheduleReconnect();
        return;
      }
      socketRef.current = ws;

      ws.onopen = () => {
        if (myGeneration !== generationRef.current) {
          try {
            ws.close(1000);
          } catch {
            /* ignore */
          }
          return;
        }
        setState("connected");
        startPing();
        if (isReconnect) {
          reconnectAttemptsRef.current = 0;
          optsRef.current.onReconnected?.();
        } else {
          optsRef.current.onOpen?.();
        }
      };

      ws.onmessage = (ev: MessageEvent) => {
        if (myGeneration !== generationRef.current) return;
        if (typeof ev.data === "string") handleEnvelope(ev.data);
      };

      ws.onerror = () => {
        // onclose سيتبعها دائماً — نترك إعادة الاتصال لها.
      };

      ws.onclose = (ev: CloseEvent) => {
        if (myGeneration !== generationRef.current) return;
        socketRef.current = null;
        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        setState("disconnected");
        // 1000 = إغلاق طبيعي، 4xxx = إغلاق متعمّد على مستوى التطبيق (مثل رفض المصادقة).
        const permanent = ev.code === 1000 || ev.code >= 4000;
        if (!intentionalCloseRef.current && !permanent) scheduleReconnect();
      };
    };

    connect(false);

    // تفكيك نظيف عند إلغاء التركيب / تغيّر المحادثة.
    return () => {
      intentionalCloseRef.current = true;
      generationRef.current++;
      clearTimers();
      const ws = socketRef.current;
      socketRef.current = null;
      if (ws) {
        try {
          ws.close(1000);
        } catch {
          /* ignore */
        }
      }
      setState("disconnected");
    };
    // نُعيد الاتصال فقط عند تغيّر المحادثة/المستخدم/التفعيل — لا عند تغيّر الـcallbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId, enabled]);

  return { send, state, isConnected: state === "connected" };
}
