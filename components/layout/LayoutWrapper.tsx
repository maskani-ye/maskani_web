"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { CityFirstVisitModal } from "@/components/city/CityFirstVisitModal";
import { ProfileCompletionBanner } from "@/components/account/ProfileCompletionBanner";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // مسارات /auth و /admin لها هيكلها الخاص — لا نغلّفها بشريط التنقّل العام والتذييل
  const isBare = pathname.startsWith("/auth") || pathname.startsWith("/admin");

  if (isBare) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* نافذة Google One Tap تلقائياً للزوّار غير المسجّلين */}
      <GoogleOneTap />
      {/* أول زيارة بلا مدينة → مودال اختيار المدينة (للزائر أيضاً، مرّة واحدة) */}
      <CityFirstVisitModal />
      <Navbar />
      {/* ترغيب لطيف (لا إجبار) لإكمال الهاتف/المدينة للمستخدم المسجّل غير المكتمل */}
      <ProfileCompletionBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
