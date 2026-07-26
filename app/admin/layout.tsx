"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Drawer } from "@/components/ui/Drawer";
import {
  GraphNewUp, UsersGroupRounded, ShieldWarning, MapPoint,
  Buildings2, Settings, Home2, ChatRound, ChatRoundDots, Widget,
  City, Logout2, HamburgerMenu, CloseCircle,
  ShieldCheck, DangerTriangle, Bell,
} from "@solar-icons/react";

const NAV = [
  { href: "/admin",                    label: "لوحة التحكم",     icon: GraphNewUp },
  { href: "/admin/users",              label: "المستخدمون",      icon: UsersGroupRounded },
  { href: "/admin/verification",       label: "طلبات التوثيق",   icon: ShieldCheck },
  { href: "/admin/listings",           label: "الإعلانات",       icon: Buildings2 },
  { href: "/admin/properties",         label: "أنواع العقارات",  icon: MapPoint },
  { href: "/admin/requests",           label: "طلبات العملاء",   icon: ChatRound },
  { href: "/admin/conversations",      label: "المحادثات",       icon: ChatRoundDots },
  { href: "/admin/broadcast",          label: "الإشعارات",       icon: Bell },
  { href: "/admin/reports",            label: "البلاغات",        icon: ShieldWarning },
  { href: "/admin/flags",              label: "بلاغات المستخدمين", icon: DangerTriangle },
  { href: "/admin/cities",             label: "المدن والدول",    icon: City },
  { href: "/admin/categories",         label: "أصناف الخدمات",   icon: Widget },
  { href: "/admin/services",           label: "مزودو الخدمة",    icon: Settings },
];

function isActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/auth/login");
  }, [user, loading, router]);

  // أغلق الدرج عند التنقّل بين الصفحات
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (loading || !user || user.role !== "admin") return null;

  const activeItem = [...NAV].sort((a, b) => b.href.length - a.href.length).find((n) => isActive(n.href, pathname));
  const pageTitle  = activeItem?.label ?? "لوحة الإدارة";

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  // ─── محتوى الشريط الجانبي (يُعاد استخدامه في الدرج على الجوال) ───────────────
  const SidebarInner = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* الشعار */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Home2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">مسكني</p>
          <p className="text-xs text-gray-400">لوحة الإدارة</p>
        </div>
      </div>

      {/* التنقّل */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
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

      {/* معلومات المشرف + تسجيل الخروج */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-400">مشرف</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Logout2 className="h-4 w-4 shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]" dir="rtl">
      {/* الشريط الجانبي الثابت — يظهر من lg فأكثر */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-white border-l border-gray-100 flex-col sticky top-0 h-screen">
        <SidebarInner />
      </aside>

      {/* درج الجوال — ينزلق من اليمين (RTL) */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="right" className="!bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-800">القائمة</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="إغلاق القائمة"
          >
            <CloseCircle className="h-5 w-5" />
          </button>
        </div>
        <SidebarInner onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      {/* العمود الرئيسي */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 lg:px-6 bg-white/85 glass border-b border-gray-100">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="فتح القائمة"
          >
            <HamburgerMenu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-bold text-gray-900 truncate">{pageTitle}</h1>
          {/* خانة يمينية للإجراءات المستقبلية */}
          <div className="ms-auto flex items-center gap-2" />
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
