"use client";

// ─── VoiceRecorder ───────────────────────────────────────────────────────────
// تسجيل رسالة صوتية عبر MediaRecorder (getUserMedia). حالتان: زر مايك خامل، أو
// شريط تسجيل ممتد (مؤقّت + أعمدة مستوى صوت حيّة + إلغاء + إرسال). عند الإرسال:
// يبني File بصيغة webm ويستدعي onSend(file, durationMs). يعالج رفض إذن المايك
// بلطف عبر toast. الأعمدة تُحسب من AnalyserNode.

import { useCallback, useEffect, useRef, useState } from "react";
import { Microphone, Plain, TrashBinMinimalistic } from "@solar-icons/react";
import { toast } from "sonner";
import { formatClock } from "@/lib/chatAttachments";

interface VoiceRecorderProps {
  onSend: (file: File, durationMs: number) => void;
  onRecordingChange?: (recording: boolean) => void;
  disabled?: boolean;
}

const BAR_COUNT = 24;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function VoiceRecorder({ onSend, onRecordingChange, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0.08));
  const [supported, setSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setSupported(
      typeof MediaRecorder !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const tickLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) sum += data[i];
    const avg = sum / data.length / 255; // 0..1
    const level = Math.max(0.08, Math.min(1, avg * 2.2));
    setLevels((prev) => [...prev.slice(1), level]);
    rafRef.current = requestAnimationFrame(tickLevels);
  }, []);

  const start = useCallback(async () => {
    if (disabled || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const wasCancelled = cancelledRef.current;
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        cleanup();
        setRecording(false);
        onRecordingChange?.(false);
        setElapsed(0);
        setLevels(new Array(BAR_COUNT).fill(0.08));
        if (!wasCancelled && blob.size > 0 && durationMs >= 500) {
          const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `voice.${ext}`, { type });
          onSend(file, durationMs);
        }
      };

      // مؤشّر المستوى الحيّ.
      try {
        const AudioCtx =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        rafRef.current = requestAnimationFrame(tickLevels);
      } catch {
        /* المؤشّر البصري اختياري */
      }

      startTimeRef.current = Date.now();
      recorder.start();
      setRecording(true);
      onRecordingChange?.(true);
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 200);
    } catch (err) {
      cleanup();
      const denied =
        err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      toast.error(denied ? "تم رفض إذن الميكروفون" : "تعذّر بدء التسجيل");
    }
  }, [disabled, recording, cleanup, onRecordingChange, onSend, tickLevels]);

  const stopAndSend = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    cancelledRef.current = false;
    recorder.stop();
  }, []);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanup();
      setRecording(false);
      onRecordingChange?.(false);
      setElapsed(0);
      return;
    }
    cancelledRef.current = true;
    recorder.stop();
  }, [cleanup, onRecordingChange]);

  if (!supported) return null;

  if (!recording) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        aria-label="تسجيل رسالة صوتية"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary-50 disabled:opacity-50"
      >
        <Microphone className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-2 rounded-xl border border-primary/20 bg-primary-50 px-3 py-2" dir="rtl">
      <button
        type="button"
        onClick={cancel}
        aria-label="إلغاء التسجيل"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
      >
        <TrashBinMinimalistic className="h-5 w-5" />
      </button>
      <span className="shrink-0 text-caption font-medium tabular-nums text-primary">{formatClock(elapsed / 1000)}</span>
      <div className="flex h-8 flex-1 items-center gap-[2px] overflow-hidden">
        {levels.map((lvl, i) => (
          <span
            key={i}
            className="w-[3px] shrink-0 rounded-full bg-primary/70"
            style={{ height: `${Math.round(lvl * 100)}%` }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={stopAndSend}
        aria-label="إرسال التسجيل"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-600"
      >
        <Plain className="h-4 w-4" />
      </button>
    </div>
  );
}
