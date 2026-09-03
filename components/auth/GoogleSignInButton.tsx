"use client";

import { useEffect, useRef, useState } from "react";

const GSI_SRC = "https://accounts.google.com/gsi/client";
// مفتاح الويب عام (يُضمَّن في كل تطبيق ويب) — قيمة احتياطية تضمن عمل الزر دائماً
const CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "949638322663-9obmv221sp4upceq3b5gsmre70urnemi.apps.googleusercontent.com";

// نُحمّل سكربت GIS مرة واحدة فقط عبر promise مشترك على مستوى الوحدة
let gsiPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gsi-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gsi-load-failed"));
    document.head.appendChild(script);
  });

  return gsiPromise;
}

interface GoogleSignInButtonProps {
  /** يُستدعى مع الـ id_token (JWT) عند نجاح تسجيل الدخول عبر جوجل */
  onCredential: (idToken: string) => void;
  /** تعطيل التفاعل أثناء المعالجة */
  disabled?: boolean;
}

export function GoogleSignInButton({ onCredential, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!CLIENT_ID) {
      setError("لم يتم ضبط معرّف جوجل (Google Client ID)");
      return;
    }

    loadGsi()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response?.credential) callbackRef.current(response.credential);
          },
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          width: 320,
          locale: "ar",
        });

        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر تحميل خدمة جوجل، تحقّق من اتصالك بالإنترنت");
      });

    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel();
    };
  }, []);

  if (error) {
    return <p className="text-caption text-danger-500 text-center">{error}</p>;
  }

  return (
    <div className="relative flex justify-center">
      {!ready && (
        <div className="h-11 w-full max-w-[320px] rounded-full bg-muted-100 animate-pulse" />
      )}
      <div
        ref={containerRef}
        className={disabled ? "pointer-events-none opacity-60" : undefined}
      />
    </div>
  );
}
