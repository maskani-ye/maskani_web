"use client";

import ActivityPanel from "@/components/admin/ActivityPanel";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { Drawer } from "@/components/ui/Drawer";
import {
  GraphNewUp, UsersGroupRounded, ShieldWarning, MapPoint,
  Buildings2, Settings, Home2, ChatRound, ChatRoundDots, Widget,
  City, Logout2, HamburgerMenu, CloseCircle,
  ShieldCheck, DangerTriangle, Bell,
  Case, ChartSquare, HeadphonesRound, MagniferBug, NotebookBookmark, HashtagSquare, Stars,
  ServerSquare,
  DocumentAdd,
} from "@solar-icons/react";

// عناصر التنقّل مجمّعة حسب التخصّص/الوظيفة. الترتيب ثابت ومطابق لتطبيق الإدارة.
const NAV_GROUPS = [
  {
    title: "نظرة عامة",
    items: [
      { href: "/admin",           label: "لوحة التحكم", icon: GraphNewUp },
      { href: "/admin/analytics", label: "التحليلات",   icon: ChartSquare },
      { href: "/admin/seo",       label: "الفهرسة وSEO", icon: MagniferBug },
    ],
  },
  {
    title: "المستخدمون",
    items: [
      { href: "/admin/users",        label: "المستخدمون",    icon: UsersGroupRounded },
      { href: "/admin/verification", label: "طلبات التوثيق", icon: ShieldCheck },
    ],
  },
  {
    title: "العقارات",
    items: [
      { href: "/admin/properties", label: "العقارات",    icon: Buildings2 },
      { href: "/admin/properties/import", label: "استيراد جماعي", icon: DocumentAdd },
      { href: "/admin/requests", label: "طلبات عقارية", icon: ChatRound },
    ],
  },
  {
    title: "الخدمات",
    items: [
      { href: "/admin/services", label: "مزودو الخدمة", icon: Settings },
      { href: "/admin/jobs",     label: "طلبات الخدمة", icon: Case },
    ],
  },
  {
    title: "التواصل",
    items: [
      { href: "/admin/conversations", label: "المحادثات",     icon: ChatRoundDots },
      { href: "/admin/helpdesk",      label: "مركز المساعدة", icon: HeadphonesRound },
      { href: "/admin/broadcast",     label: "الإشعارات",     icon: Bell },
      { href: "/admin/notification-templates", label: "قوالب الإشعارات", icon: Bell },
    ],
  },
  {
    title: "الرقابة والسلامة",
    items: [
      { href: "/admin/reports", label: "البلاغات",         icon: ShieldWarning },
      { href: "/admin/flags",   label: "بلاغات المستخدمين", icon: DangerTriangle },
    ],
  },
  {
    title: "الإعدادات والبيانات",
    items: [
      { href: "/admin/property-types", label: "أنواع العقارات", icon: MapPoint },
      { href: "/admin/categories", label: "أصناف الخدمات",  icon: Widget },
      { href: "/admin/cities",     label: "المدن والدول",   icon: City },
    ],
  },
  {
    title: "البنية والخدمات",
    items: [
      { href: "/admin/infrastructure", label: "الخدمات",          icon: ServerSquare },
      { href: "/admin/ai",             label: "الذكاء الاصطناعي", icon: Stars },
    ],
  },
  {
    // قسم ثانوي — في آخر القائمة (ليس أساسياً)
    title: "المدونة",
    items: [
      { href: "/admin/blog",            label: "المقالات",   icon: NotebookBookmark },
      { href: "/admin/blog/categories", label: "التصنيفات", icon: HashtagSquare },
    ],
  },
];

// قائمة مسطّحة مشتقّة — تُستخدم لتحديد العنصر النشط وعنوان الصفحة.
const NAV = NAV_GROUPS.flatMap((g) => g.items);

function isActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

/** `useLayoutEffect` يحذّر أثناء التصيير على الخادم — نسقط إلى `useEffect` هناك. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { requireAuth } = useAuthGate();
  const router   = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);


  useEffect(() => {
    if (loading) return;
    // زائر → نافذة الدخول المنبثقة (لا شاشة دخول)؛ مستخدم غير مشرف → الرئيسية.
    if (!user) { requireAuth(undefined, () => router.push("/")); return; }
    if (user.role !== "admin") router.push("/");
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
    router.push("/");
  };

  // ─── محتوى الشريط الجانبي (يُعاد استخدامه في الدرج على الجوال) ───────────────
  const SidebarInner = ({ onNavigate }: { onNavigate?: () => void }) => {
    /**
     * كل نسخة من الشريط تُمرِّر نفسها إلى زرّ الصفحة الحالية.
     *
     * ⚠️ الشريط يُرسَم **مرّتين**: الثابت على الشاشات الكبيرة، ودرج الجوال الذي
     * يبقى في الشجرة دائماً (يُخفى بالإزاحة لا بالإزالة). مراجع مشتركة على
     * مستوى التخطيط كانت تُكتب بعناصر الدرج المخفيّ، فتُمرَّر قائمةٌ لا يراها
     * أحد ويبقى الشريط الحقيقيّ في أعلاه. لذلك تعيش المراجع داخل كل نسخة.
     */
    const navRef = useRef<HTMLElement | null>(null);
    const activeRef = useRef<HTMLAnchorElement | null>(null);

    useIsomorphicLayoutEffect(() => {
      const nav = navRef.current;
      const item = activeRef.current;
      // الدرج المخفيّ ارتفاعه صفر — لا نلمسه، وإلا حسبنا موضعاً بلا معنى.
      if (!nav || !item || nav.clientHeight === 0) return;
      const top = item.offsetTop - nav.clientHeight / 2 + item.clientHeight / 2;
      nav.scrollTop = Math.max(0, top);
    }, [pathname]);

    return (
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

      {/* التنقّل — مجمّع حسب الوظيفة */}
      <nav ref={navRef} className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.title} className={gi === 0 ? "" : "mt-5"}>
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                // الأطول تطابقاً فقط يُبرَز (وإلا أُبرِزت /admin/blog مع /admin/blog/categories معاً)
                const active = href === activeItem?.href;
                return (
                  <Link
                    key={href}
                    href={href}
                    ref={active ? activeRef : undefined}
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
            </div>
          </div>
        ))}
      </nav>

      {/* معلومات المشرف + تسجيل الخروج */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {(user.full_name ?? "؟").charAt(0)}
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
  };

  return (
    <div className="flex min-h-screen bg-cream" dir="rtl">
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

      <ActivityPanel />
    </div>
  );
}
