"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import { FloatingHelp } from "./FloatingHelp";
import { FloatingAssistant } from "./FloatingAssistant";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { LocationGate } from "@/components/city/LocationGate";
import { ProfileCompletionBanner } from "@/components/account/ProfileCompletionBanner";
import { CampaignSlot } from "@/components/campaigns/CampaignSlot";
import { CampaignSpotlight } from "@/components/campaigns/CampaignSpotlight";
import { splitMarket } from "@/lib/markets";
import { useCountry } from "@/context/CountryContext";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { country } = useCountry();
  // مسارات /auth و /admin لها هيكلها الخاص — لا نغلّفها بشريط التنقّل العام والتذييل
  const isBare = pathname.startsWith("/auth") || pathname.startsWith("/admin");
  // ⚠️ **الصفحة الأولى تُدير إطارها بنفسها**: تأليفها مِلء الشاشة بترويسة
  // زجاجية فوق الصورة، فإقحام الشريط العام والتذييل والشريط السفلي فوقها
  // يُنتج ترويستين وشريط تنقّل يقطع المشهد. وهي أيضاً **قبل** اختيار السوق،
  // فلا معنى لبوّابة الموقع فيها.
  const isLanding = pathname === "/";

  if (isLanding) return <>{children}</>;
  // محادثة مفتوحة = شاشة كاملة بلا شريط سفلي (مطابق للتطبيق)
  // ومساعد مسكني شاشة محادثة أيضاً: نافذته تملأ الشاشة ومؤلِّفه في أسفلها، فلا
  // تذييل يدفعه تحت الطيّة ولا شريط سفليّ يغطّيه.
  const isAssistant = pathname === "/assistant";
  const isChatConversation =
    (pathname.startsWith("/chat/") && pathname !== "/chat") || isAssistant;

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
      {/* إعلان «كل الصفحات» — فوق التذييل، لا في المحادثة ولا في بوّابة الموقع. */}
      {!isChatConversation && pathname !== "/location" && (
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 pb-8">
          <CampaignSlot placement="site_wide" siteWide country={splitMarket(pathname).market ?? country?.code} />
        </div>
      )}
      {/* النافذة المنبثقة — لا فوق محادثة ولا فوق بوّابة الموقع */}
      {!isChatConversation && pathname !== "/location" && (
        <CampaignSpotlight pathname={pathname} country={splitMarket(pathname).market ?? country?.code} />
      )}
      {!isAssistant && <Footer />}
      {/* زرّ عائم لمركز المساعدة */}
      <FloatingHelp />
      <FloatingAssistant />
      {/* شريط تنقّل سفلي app-like — جوّال فقط (يُخفى في المحادثة المفتوحة) */}
      {!isChatConversation && <BottomNav />}
    </div>
  );
}
