import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

/**
 * **IBM Plex Sans Arabic** — خطّ الواجهة.
 *
 * ⚠️ **مستضافٌ ذاتياً بملفّات WOFF2 لا من مزوّدٍ خارجيّ**: الملفّات الأصلية
 * TTF بلغت 1.15 م.ب للأوزان الخمسة، وبعد التحويل **351 ك.ب** — وهذا يهمّ على
 * الشبكات التي نخدمها. و`display: swap` يمنع حجب النصّ ريثما يُحمَّل.
 *
 * ⚠️ **الترخيص**: IBM Plex تحت SIL OFL ويسمح بالتضمين صراحةً. وفي المجلّد
 * المصدر كان `HelveticaNeue.ttc` — **خطٌّ ملكيّ تجاريّ** يحتاج ترخيص ويب
 * مدفوعاً، فلم يُضمَّن.
 */
const plex = localFont({
  src: [
    { path: "./fonts/IBMPlexSansArabic-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-plex",
});
import { AuthProvider } from "@/context/AuthContext";
import { CityProvider } from "@/context/CityContext";
import { CountryProvider } from "@/context/CountryContext";
import { AuthGateProvider } from "@/context/AuthGate";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { Analytics } from "@/components/Analytics";
import { VisitTracker } from "@/components/VisitTracker";
import { AdSenseScript } from "@/components/ads/AdSenseScript";

export const metadata: Metadata = {
  metadataBase: new URL("https://maskani.homes"),
  title: {
    // العلامة أولاً ثم المنفعة: «مسكني» وحدها تُظهرنا بترتيب 4.6 وننال نقرة
    // واحدة من 61 ظهوراً — لأن العنوان لم يقل للباحث ماذا يجد بالداخل.
    // ⚠️ **كان يقول «عقارات اليمن» وهو عنوان الموقع كلّه.**
    // المنصّة تغطّي ستّة أسواق (٤٬٤٢٦ عقاراً، اليمن أصغرها بـ١٨٠)، وهذا
    // العنوان الافتراضيّ يظهر على كل صفحة بلا عنوان خاصّ — وعلى الجذر الذي
    // هو بوّابة الأسواق الستّة. ادّعاءُ سوقٍ واحد يضيّق الصلة ويناقض المحتوى.
    default: "مسكني — عقارات ستّة أسواق عربية: تواصل مع صاحب العقار مباشرة",
    template: "%s | مسكني",
  },
  description: "شقق وأراضٍ وفلل للبيع والإيجار في السعودية والأردن ومصر والعراق وعُمان واليمن، ومقاولون وفنيّون بتقييمات حقيقية، وبلاغات احتيال تحميك قبل أن تدفع — كل ذلك مجّاناً وبلا عمولة.",
  keywords: [
    "عقارات", "عقارات السعودية", "عقارات الأردن", "عقارات مصر",
    "عقارات العراق", "عقارات عُمان", "عقارات اليمن",
    "عقارات الرياض", "عقارات عمّان", "عقارات بغداد", "عقارات صنعاء",
    "بيع", "إيجار", "شقق للإيجار", "شقق للبيع",
    "فلل", "أراضي", "محلات تجارية", "خدمات عقارية", "مقاول", "سبّاك", "كهربائي",
    "طلبات عقارية", "بلاغات احتيال عقاري", "مسكني", "maskani",
  ],
  authors: [{ name: "مسكني" }],
  applicationName: "مسكني",
  // ⚠️ `ar-YE` وحدها كانت تربط الموقع بلغة/منطقة اليمن — والموقع يخدم ستّة
  // أسواق. `ar` العامّة تكفي، وكل سوقٍ له مساره الخاصّ المفهرس.
  alternates: { canonical: "/", languages: { ar: "/" } },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // إثبات ملكية Search Console (طريقة «علامة HTML») — رمز عام يُكشف في الصفحة
    // أصلاً، لذا يُثبَّت افتراضياً ويمكن تجاوزه عبر NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ??
      "_xfGOzb9mTyeNOwTepXCULBYLUmMu49lyf792BCnT-8",
  },
  openGraph: {
    title: "مسكني | عقارات ستّة أسواق عربية — بيع وإيجار شقق وأراضٍ وخدمات",
    description: "شقق وأراضٍ وفلل في السعودية والأردن ومصر والعراق وعُمان واليمن، وخدمات عقارية موثوقة.",
    siteName: "مسكني",
    locale: "ar_AR",
    type: "website",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني — المنصة العقارية الاجتماعية" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "مسكني | عقارات ستّة أسواق عربية — بيع وإيجار شقق وأراضٍ وخدمات",
    description: "شقق وأراضٍ وفلل في السعودية والأردن ومصر والعراق وعُمان واليمن، وخدمات عقارية موثوقة.",
    images: ["/og.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#171539",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className="font-arabic antialiased bg-cream min-h-screen">
        <Analytics />
        <VisitTracker />
        <AdSenseScript />
        {/* بيانات التطبيق المنظّمة: رابطا التنزيل (المباشر و AppGallery) في
            مكان واحد — يجعل جوجل يعرض مسكني تطبيقاً لا صفحة وحسب. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MobileApplication",
              name: "مسكني",
              operatingSystem: "Android",
              applicationCategory: "LifestyleApplication",
              inLanguage: "ar",
              isAccessibleForFree: true,
              downloadUrl: [
                "https://pub-c0a05c2cecc548aaa3a943b5751cf25f.r2.dev/download/maskani.apk",
                "https://appgallery.huawei.com/app/C118696899",
              ],
              publisher: { "@type": "Organization", name: "مسكني", url: "https://maskani.homes" },
            }),
          }}
        />
        {/* بيانات منظّمة للموقع (Organization + WebSite مع مربّع بحث) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "مسكني",
                url: "https://maskani.homes",
                logo: "https://maskani.homes/icon.png",
                description: "منصة عقارية اجتماعية في ستّة أسواق عربية — بيع، إيجار، خدمات، ومكافحة الاحتيال العقاري",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "مسكني",
                url: "https://maskani.homes",
                inLanguage: "ar",
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: "https://maskani.homes/properties?search={query}" },
                  "query-input": "required name=query",
                },
              },
            ]),
          }}
        />
        <AuthProvider>
          <AuthGateProvider>
            <CountryProvider>
              <CityProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
              </CityProvider>
            </CountryProvider>
          </AuthGateProvider>
          <Toaster
            position="top-center"
            richColors
            dir="rtl"
            toastOptions={{ className: "font-arabic" }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
