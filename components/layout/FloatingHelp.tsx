"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeadphonesRound } from "@solar-icons/react";

/** زرّ عائم لمركز المساعدة — موضعه تملكه `FloatingActions` (فوق زرّ المساعد). */
export function FloatingHelp() {
  const pathname = usePathname();
  // نُخفيه في /help نفسه، والإدارة/الدخول، والمحادثة المفتوحة
  if (pathname === "/help" || pathname === "/assistant" || pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;
  if (pathname.startsWith("/chat/") && pathname !== "/chat") return null;

  return (
    <Link
      href="/help"
      aria-label="مركز المساعدة"
      title="مركز المساعدة"
      className="pointer-events-auto flex items-center justify-center gap-2 rounded-full bg-primary text-white shadow-lg shadow-primary/30 px-3.5 sm:px-4 h-12 hover:bg-primary/90 transition-colors"
    >
      <HeadphonesRound className="h-5 w-5" />
      <span className="text-body font-semibold hidden sm:inline">المساعدة</span>
    </Link>
  );
}
