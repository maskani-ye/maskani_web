"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import { FloatingHelp } from "./FloatingHelp";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { LocationGate } from "@/components/city/LocationGate";
import { ProfileCompletionBanner } from "@/components/account/ProfileCompletionBanner";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // مسارات /auth و /admin لها هيكلها الخاص — لا نغلّفها بشريط التنقّل العام والتذييل
  const isBare = pathname.startsWith("/auth") || pathname.startsWith("/admin");
  // محادثة مفتوحة = شاشة كاملة بلا شريط سفلي (مطابق للتطبيق)
  const isChatConversation = pathname.startsWith("/chat/") && pathname !== "/chat";

  if (isBare) return <>{children}</>;

  return (
    <div className={`flex flex-col min-h-screen ${isChatConversation ? "" : "pb-16 lg:pb-0"}`}>
      {/* نافذة Google One Tap تلقائياً للزوّار غير المسجّلين */}
      <GoogleOneTap />
      {/* بلا مدينة على شاشة تعتمد على السوق → تحويل إلى `/location` ثم عودة.
          حلّ محلّ المودال الذي كان يحجب الرئيسية بلا شرح ويُضيّع السياق: من
          يصل من جوجل إلى /properties يعود إليها لا إلى الرئيسية. */}
      <LocationGate />
      <Navbar />
      {/* ترغيب لطيف (لا إجبار) لإكمال الهاتف/المدينة للمستخدم المسجّل غير المكتمل */}
      <ProfileCompletionBanner />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* زرّ عائم لمركز المساعدة */}
      <FloatingHelp />
      {/* شريط تنقّل سفلي app-like — جوّال فقط (يُخفى في المحادثة المفتوحة) */}
      {!isChatConversation && <BottomNav />}
    </div>
  );
}
