"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraphNewUp, UsersGroupRounded, ShieldWarning, MapPoint,
  Buildings2, Settings, Home2,
} from "@solar-icons/react";

const NAV = [
  { href: "/admin",          label: "لوحة التحكم",    icon: GraphNewUp },
  { href: "/admin/users",    label: "المستخدمون",     icon: UsersGroupRounded },
  { href: "/admin/listings", label: "الإعلانات",      icon: Buildings2 },
  { href: "/admin/reports",  label: "البلاغات",       icon: ShieldWarning },
  { href: "/admin/cities",   label: "المدن والدول",   icon: MapPoint },
  { href: "/admin/services", label: "مزودو الخدمة",  icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-l border-gray-100 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Home2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">مسكني</p>
            <p className="text-xs text-gray-400">لوحة الإدارة</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const exact  = href === "/admin";
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400">مشرف</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
