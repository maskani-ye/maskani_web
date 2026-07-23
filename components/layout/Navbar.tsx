"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home2, Magnifer, Buildings2, ShieldWarning, PenNewSquare,
  Bell, User, HamburgerMenu, CloseCircle, AltArrowDown, Login, Settings, AddCircle,
} from "@solar-icons/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navLinks = [
  { href: "/listings", label: "الإعلانات", icon: Buildings2 },
  { href: "/services", label: "الخدمات", icon: Settings },
  { href: "/fraud-reports", label: "مجتمع الشكاوي", icon: ShieldWarning },
  { href: "/requests", label: "طلبات العملاء", icon: PenNewSquare },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج");
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Home2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-primary">مسكني</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Add Listing Button */}
                <Button size="sm" onClick={() => router.push("/listings/create")}>
                  <AddCircle className="h-4 w-4" />
                  إضافة إعلان
                </Button>

                {/* Notifications */}
                <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-800 max-w-24 truncate">{user.full_name}</span>
                    <AltArrowDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {profileOpen && (
                    <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700" onClick={() => setProfileOpen(false)}>
                        <User className="h-4 w-4 text-primary" /> ملفي الشخصي
                      </Link>
                      <Link href="/listings/my" className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700" onClick={() => setProfileOpen(false)}>
                        <Buildings2 className="h-4 w-4 text-primary" /> إعلاناتي
                      </Link>
                      <Link href="/requests/my" className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700" onClick={() => setProfileOpen(false)}>
                        <PenNewSquare className="h-4 w-4 text-primary" /> طلباتي
                      </Link>
                      <Link href="/favorites" className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700" onClick={() => setProfileOpen(false)}>
                        <Magnifer className="h-4 w-4 text-primary" /> المفضّلة
                      </Link>
                      {user.role === "admin" && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gold" onClick={() => setProfileOpen(false)}>
                          <Settings className="h-4 w-4 text-gold" /> لوحة الإدارة
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 w-full text-right">
                        <Login className="h-4 w-4" /> تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button size="sm">دخول</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <CloseCircle className="h-5 w-5" /> : <HamburgerMenu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {link.label}
                </Link>
              );
            })}
            {!user ? (
              <div className="flex gap-2 pt-2 px-4">
                <Link href="/auth/login" className="flex-1">
                  <Button fullWidth size="sm">دخول</Button>
                </Link>
              </div>
            ) : (
              <div className="pt-2 px-4 space-y-2">
                <Link href="/profile" className="block text-sm text-gray-700 py-2" onClick={() => setMobileOpen(false)}>ملفي الشخصي</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-sm text-red-600 py-2 text-right w-full">تسجيل الخروج</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
