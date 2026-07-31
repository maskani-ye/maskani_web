"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // مسارات /auth و /admin لها هيكلها الخاص — لا نغلّفها بشريط التنقّل العام والتذييل
  const isBare = pathname.startsWith("/auth") || pathname.startsWith("/admin");

  if (isBare) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* نافذة Google One Tap تلقائياً للزوّار غير المسجّلين */}
      <GoogleOneTap />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
