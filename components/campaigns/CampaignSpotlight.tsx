"use client";

import { useEffect, useRef, useState } from "react";
import {
  campaignClickUrl, campaignImpressionUrl, detectPlatform, fetchCampaign, type Campaign,
} from "@/lib/campaigns";

// النافذة المنبثقة — موضع «spotlight» يختاره المشرف من /admin/campaigns.
//
// ⚠️ **لا تظهر في أوّل صفحةٍ يفتحها الزائر.** جوجل يخفض ترتيب صفحات الجوّال التي
// تغطّي محتواها نافذةٌ فور الوصول من نتائج البحث (intrusive interstitials)، والزائر
// القادم من البحث يرى أوّل صفحة. فتنتظر الصفحة الثانية من الجلسة، ثم ثوانيَ بعدها.
// ⚠️ **ولا تتكرّر على الزائر نفسه** قبل مرور `spotlight_every_hours` (يحدّدها المشرف).
// التخزين المحلّي هنا راحةٌ لا عقد: إن تعذّر، تظهر مرّة في الجلسة على الأكثر.

const VIEWS_KEY = "mk_spot_views";
const seenKey = (id: number) => `mk_spot_${id}`;
const DELAY_MS = 4000;

function bumpViews(): number {
  try {
    const n = Number(sessionStorage.getItem(VIEWS_KEY) || 0) + 1;
    sessionStorage.setItem(VIEWS_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

function seenRecently(id: number, hours: number): boolean {
  try {
    const at = Number(localStorage.getItem(seenKey(id)) || 0);
    return Date.now() - at < hours * 3600_000;
  } catch {
    return false;
  }
}

function markSeen(id: number) {
  try {
    localStorage.setItem(seenKey(id), String(Date.now()));
  } catch {
    /* تخزينٌ محجوب — يكفي أنّ الجلسة لن تُعيدها (shownThisSession) */
  }
}

let shownThisSession = false;

export function CampaignSpotlight({ pathname, country }: { pathname: string; country?: string | null }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const views = bumpViews();
    if (views < 2 || shownThisSession) return;
    let alive = true;
    const t = window.setTimeout(async () => {
      const c = await fetchCampaign("spotlight", { country, platform: detectPlatform() });
      if (!alive || !c || shownThisSession) return;
      if (seenRecently(c.id, c.spotlight_every_hours ?? 24)) return;
      shownThisSession = true;
      markSeen(c.id);
      setCampaign(c);
      // النافذة تغطّي الصفحة، فظهورها رؤيةٌ مؤكّدة — يُعدّ فوراً.
      fetch(campaignImpressionUrl(c.id), { method: "POST", keepalive: true }).catch(() => {});
    }, DELAY_MS);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [pathname, country]);

  useEffect(() => {
    if (!campaign) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCampaign(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [campaign]);

  if (!campaign) return null;
  const c = campaign;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setCampaign(null);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={c.headline}
        className="relative w-full max-w-sm rounded-3xl bg-ink text-white p-6 shadow-e3 text-center animate-[maskaniSheetUp_0.24s_ease-out]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setCampaign(null)}
          aria-label="إغلاق"
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-h3 leading-none flex items-center justify-center"
        >
          ×
        </button>
        <span className="block text-micro font-semibold text-white/60">{c.label || "إعلان"}</span>
        {c.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" width={96} height={96}
            className="mx-auto mt-4 w-24 h-24 rounded-2xl object-cover bg-white/10" />
        )}
        <p className="mt-4 font-extrabold text-h3 leading-snug text-balance">{c.headline}</p>
        {c.body && <p className="mt-2 text-white/75 text-body leading-relaxed">{c.body}</p>}
        <a
          href={campaignClickUrl(c.id)}
          target="_blank"
          rel="sponsored noopener"
          onClick={() => setCampaign(null)}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-gold text-ink font-bold px-5 py-3 hover:bg-gold/90 transition-colors"
        >
          {c.cta_label || "اعرف أكثر"} ↗
        </a>
      </div>
    </div>
  );
}
