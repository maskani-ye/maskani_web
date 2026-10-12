"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stars } from "@solar-icons/react";

/**
 * زرّ «مساعد مسكني» العائم — المدخل الأقصر إلى البحث بالكلام من أيّ صفحة.
 *
 * في الطرف المقابل لزرّ المساعدة (يمين الشاشة)، ويختفي حيث يزاحم ما هو أهمّ:
 * صفحة المساعد نفسها (مؤلِّفها في الموضع ذاته)، والمحادثة المفتوحة، والإدارة.
 */
export function FloatingAssistant() {
  const pathname = usePathname() || "/";
  if (pathname === "/assistant" || pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;
  if (pathname.startsWith("/chat/") && pathname !== "/chat") return null;

  return (
    <Link
      href="/assistant"
      aria-label="مساعد مسكني — ابحث بكلامك"
      title="مساعد مسكني"
      className="fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 flex items-center gap-2 rounded-full bg-ink text-white shadow-lg shadow-ink/30 px-4 h-12 hover:bg-ink/90 transition-colors"
    >
      <Stars className="h-5 w-5 text-gold" />
      <span className="text-body font-semibold">اسأل المساعد</span>
    </Link>
  );
}
