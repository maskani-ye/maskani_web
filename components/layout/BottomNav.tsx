"use client";

// شريط تنقّل سفلي app-like — يظهر على الجوّال فقط (md:hidden). مطابق لتطبيق Flutter:
// الرئيسية / الإعلانات / الخدمات / طلبات عقارية / طلبات خدمات / حسابي.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { cn } from "@/lib/utils";
import { Home2, Buildings2, Settings, ClipboardList, Case, User } from "@solar-icons/react";

const TABS = [
  { href: "/", label: "الرئيسية", icon: Home2, exact: true },
  { href: "/listings", label: "الإعلانات", icon: Buildings2 },
  { href: "/services", label: "الخدمات", icon: Settings },
  { href: "/requests", label: "طلبات عقارية", icon: ClipboardList },
  { href: "/jobs", label: "طلبات خدمات", icon: Case },
  { href: "/profile", label: "حسابي", icon: User, auth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-100 pb-[env(safe-area-inset-bottom)]"
      aria-label="التنقّل السفلي"
    >
      <div className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const handleClick = (e: React.MouseEvent) => {
            if (tab.auth && !user) {
              e.preventDefault();
              requireAuth(() => router.push(tab.href));
            }
          };
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={handleClick}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[3.5rem] transition-colors",
                active ? "text-primary" : "text-gray-400"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon weight={active ? "Bold" : "Linear"} className="h-6 w-6" />
              <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
