"use client";

import { useState } from "react";
import { Link as LinkIcon, CheckCircle } from "@solar-icons/react";

/** شريط مشاركة المقال — واتساب/تويتر/فيسبوك/تيليجرام + نسخ الرابط (للانتشار الفيروسي). */
export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { label: "واتساب", href: `https://wa.me/?text=${t}%20${u}`, cls: "bg-[#25D366] text-white" },
    { label: "تويتر (X)", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, cls: "bg-black text-white" },
    { label: "فيسبوك", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, cls: "bg-[#1877F2] text-white" },
    { label: "تيليجرام", href: `https://t.me/share/url?url=${u}&text=${t}`, cls: "bg-[#229ED9] text-white" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-body font-semibold text-muted-500 ml-1">شارك:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
          className={`text-caption font-bold px-3 py-1.5 rounded-full transition-opacity hover:opacity-90 ${l.cls}`}>
          {l.label}
        </a>
      ))}
      <button onClick={copy}
        className="text-caption font-bold px-3 py-1.5 rounded-full bg-muted-100 text-muted-700 hover:bg-muted-200 transition-colors flex items-center gap-1">
        {copied ? <><CheckCircle weight="Bold" className="h-3.5 w-3.5 text-green-600" /> تم النسخ</> : <><LinkIcon className="h-3.5 w-3.5" /> نسخ الرابط</>}
      </button>
    </div>
  );
}
