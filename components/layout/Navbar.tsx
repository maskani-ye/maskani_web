"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/context/AuthGate";
import { useCity } from "@/context/CityContext";
import { useCountry } from "@/context/CountryContext";
import {
  Home2, Magnifer, Buildings2, ShieldWarning, ClipboardList, Case,
  Bell, ChatRound, User, HamburgerMenu, CloseCircle, AltArrowDown, Login, Settings, MapPoint,
  AddCircle,
} from "@solar-icons/react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { City } from "@/types";
import { toast } from "sonner";

const navLinks = [
  { href: "/properties", label: "العقارات", icon: Buildings2 },
  { href: "/services", label: "الخدمات", icon: Settings },
  { href: "/requests", label: "الطلبات", icon: ClipboardList },
  { href: "/reports", label: "مجتمع الشكاوي", icon: ShieldWarning },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { requireAuth } = useAuthGate();
  // المدن تأتي من `CityContext` — مُصفّاة بالدولة ومرتّبة بالعاصمة أولاً.
  // كان الشريط يجلبها بنفسه، فصار جلبان لنفس القائمة وفرصةٌ لتباعد الحالتين.
  const { cityId, cityName, cities, setCity } = useCity();
  const { code: countryCode, country, countries, setCountry } = useCountry();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  // الاسم المعروض: من السياق، أو من قائمة المدن (لدعم الصيغة القديمة)، وإلا "كل المدن"
  const selectedCityName =
    cityName || cities.find((c) => String(c.id) === cityId)?.name_ar || "";

  useEffect(() => {
    if (!user) { setChatUnread(0); return; }
    const fetchUnread = async () => {
      try {
        const res = await api.get("/chat/unread-count/");
        setChatUnread(res.data.unread_count ?? res.data.count ?? 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
            {/* دعوة النشر — أبرز إجراء في المنصّة وكان غائباً عن الشريط كلّياً:
                118 زائراً وصلوا صفحة العقارات في أسبوع مقابل زيارة واحدة لصفحة
                النشر. الزرّ هنا يراه كل زائر في كل صفحة. */}
            <Link
              href="/properties/create"
              className="flex items-center gap-1.5 rounded-xl bg-gold px-3.5 py-2 text-sm font-bold text-ink hover:bg-gold/90 transition-colors"
            >
              <AddCircle className="h-4 w-4" />
              أضف عقارك
            </Link>
            {/* مُحدِّد المدينة العام — مصدر واحد لكل الصفحات */}
            <div className="relative">
              <button
                onClick={() => setCityOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
                aria-label="اختر المدينة"
                aria-expanded={cityOpen}
              >
                <MapPoint className="h-4 w-4 text-primary" />
                <span className="max-w-28 truncate">{selectedCityName || "اختر مدينة"}</span>
                <AltArrowDown className="h-4 w-4 text-gray-400" />
              </button>
              {cityOpen && (
                <div className="absolute left-0 mt-2 w-52 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  {cities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCity(String(c.id), c.name_ar); setCityOpen(false); }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm w-full text-right",
                        String(c.id) === cityId ? "text-primary font-bold" : "text-gray-700"
                      )}
                    >
                      {c.name_ar}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* مُبدِّل الدولة — يظهر فقط حين نخدم أكثر من دولة؛ بدولة واحدة
                يكون خيارًا بلا معنى يزحم الشريط. */}
            {countries.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setCountryOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={countryOpen}
                  aria-label="تغيير الدولة"
                >
                  <span>{country?.flag_emoji || "🌍"}</span>
                  <span className="max-w-24 truncate">{country?.name_ar ?? "الدولة"}</span>
                  <AltArrowDown className="h-4 w-4 text-gray-400" />
                </button>
                {countryOpen && (
                  <div className="absolute left-0 mt-2 w-52 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    {countries.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setCountry(c); setCountryOpen(false); }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm w-full text-right",
                          c.code === countryCode ? "text-primary font-bold" : "text-gray-700",
                        )}
                      >
                        <span>{c.flag_emoji}</span>
                        {c.name_ar}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user ? (
              <>
                {/* Chat */}
                <Link href="/chat" aria-label="المحادثات" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChatRound className="h-5 w-5 text-gray-600" />
                  {chatUnread > 0 && (
                    <span className="absolute top-0.5 left-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {chatUnread > 99 ? "99+" : chatUnread}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link href="/notifications" aria-label="الإشعارات" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
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
                <Button size="sm" onClick={() => requireAuth()}>دخول</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="القائمة"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseCircle className="h-5 w-5" /> : <HamburgerMenu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {/* مُحدِّد المدينة العام — الجوّال */}
            <div className="px-4 pb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
                <MapPoint className="h-3.5 w-3.5 text-primary" /> المدينة
              </label>
              <select
                value={cityId}
                onChange={(e) => {
                  const id = e.target.value;
                  const name = cities.find((c) => String(c.id) === id)?.name_ar ?? "";
                  setCity(id, name);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
              >
                <option value="" disabled hidden>اختر مدينة</option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name_ar}</option>
                ))}
              </select>
            </div>
            {/* التنقّل الأساسي على الجوّال في الشريط السفلي — هنا نُبقي فقط ما ليس فيه */}
            {navLinks.filter((l) => l.href === "/reports").map((link) => {
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
            <Link
              href="/properties/create"
              className="flex items-center gap-2 mx-4 mt-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink"
              onClick={() => setMobileOpen(false)}
            >
              <AddCircle className="h-4 w-4" />
              أضف عقارك مجاناً
            </Link>
            {!user ? (
              <div className="flex gap-2 pt-2 px-4">
                <Button fullWidth size="sm" onClick={() => { setMobileOpen(false); requireAuth(); }}>دخول</Button>
              </div>
            ) : (
              <div className="pt-2 px-4 space-y-2">
                <Link href="/chat" className="flex items-center justify-between text-sm text-gray-700 py-2" onClick={() => setMobileOpen(false)}>
                  <span className="flex items-center gap-2"><ChatRound className="h-4 w-4 text-primary" /> المحادثات</span>
                  {chatUnread > 0 && (
                    <span className="min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {chatUnread > 99 ? "99+" : chatUnread}
                    </span>
                  )}
                </Link>
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
