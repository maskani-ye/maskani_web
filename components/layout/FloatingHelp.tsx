"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeadphonesRound } from "@solar-icons/react";

/** زرّ عائم لمركز المساعدة — يظهر في صفحات المستخدم (فوق الشريط السفلي في الجوّال). */
export function FloatingHelp() {
  const pathname = usePathname();
  // نُخفيه في /help نفسه، والإدارة/الدخول، والمحادثة المفتوحة
  if (pathname === "/help" || pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;
  if (pathname.startsWith("/chat/") && pathname !== "/chat") return null;

  return (
    <Link
      href="/help"
      aria-label="مركز المساعدة"
      title="مركز المساعدة"
      className="fixed z-40 bottom-20 md:bottom-6 left-4 md:left-6 flex items-center gap-2 rounded-full bg-primary text-white shadow-lg shadow-primary/30 px-4 h-12 hover:bg-primary/90 transition-colors"
    >
      <HeadphonesRound className="h-5 w-5" />
      <span className="text-sm font-semibold hidden sm:inline">المساعدة</span>
    </Link>
  );
}
