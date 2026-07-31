"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "949638322663-9obmv221sp4upceq3b5gsmre70urnemi.apps.googleusercontent.com";

/** مفتاح sessionStorage لتمرير بيانات جوجل المعلّقة إلى صفحة الإكمال. */
export const PENDING_GOOGLE_KEY = "maskani_google_pending";

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
      existing.addEventListener("error", () => reject(new Error("gsi")));
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

/**
 * نافذة Google One Tap (تظهر تلقائياً أعلى الشاشة للزوّار غير المسجّلين) — من Google
 * نفسها. تُغني عن شاشة تسجيل دخول منفصلة: يتصفّح الزائر بحرّية، وتظهر النافذة للترغيب
 * بالدخول. عند النجاح يُعاد تحميل الصفحة؛ وإن كان الحساب جديداً يُوجَّه لإكمال الملف.
 */
export function GoogleOneTap() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const shown = useRef(false);

  useEffect(() => {
    if (loading || user || shown.current || !CLIENT_ID) return;
    shown.current = true;

    loadGsi()
      .then(() => {
        if (!window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) return;
            try {
              const result = await loginWithGoogle(response.credential);
              if (result.status === "success") {
                window.location.reload();
              } else {
                sessionStorage.setItem(
                  PENDING_GOOGLE_KEY,
                  JSON.stringify({
                    idToken: response.credential,
                    email: result.email,
                    full_name: result.full_name,
                  }),
                );
                router.push("/auth/login");
              }
            } catch {
              /* تجاهل — يبقى الزائر متصفّحاً */
            }
          },
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
        });
        window.google.accounts.id.prompt();
      })
      .catch(() => {});
  }, [user, loading, loginWithGoogle, router]);

  return null;
}
