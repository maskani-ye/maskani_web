"use client";

// WebSocket لمركز المساعدة — تفاعل حيّ (نظير useChatSocket، بروتوكول envelopes خام).
import { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { wsBaseFromApiUrl } from "./useChatSocket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function helpdeskWsUrl(sessionId: string, token: string): string {
  const base = wsBaseFromApiUrl(API_URL);
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${base}/ws/helpdesk/${sessionId}/${q}`;
}

export interface HdWsMessage { id: number; sender: string; payload: Record<string, unknown> }

export function useHelpdeskSocket({
  sessionId,
  enabled,
  onMessage,
}: {
  sessionId: string | null;
  enabled: boolean;
  onMessage: (m: HdWsMessage) => void;
}) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;
  const attempts = useRef(0);
  const closedByUs = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!sessionId || !enabled || typeof window === "undefined") return;
    const token = Cookies.get("token") || "";
    let ws: WebSocket;
    try { ws = new WebSocket(helpdeskWsUrl(sessionId, token)); }
    catch { return; }
    wsRef.current = ws;
    ws.onopen = () => { setConnected(true); attempts.current = 0; };
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data) as HdWsMessage;
        if (m && m.payload) cbRef.current(m);
      } catch { /* تجاهل */ }
    };
    ws.onclose = () => {
      setConnected(false);
      if (closedByUs.current) return;
      const delay = Math.min(30_000, 1000 * 2 ** attempts.current++);
      timer.current = setTimeout(connect, delay);
    };
    ws.onerror = () => ws.close();
  }, [sessionId, enabled]);

  useEffect(() => {
    closedByUs.current = false;
    connect();
    return () => {
      closedByUs.current = true;
      if (timer.current) clearTimeout(timer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((event: Record<string, unknown>): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(event)); return true; }
    return false;
  }, []);

  return { connected, send };
}
