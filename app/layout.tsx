import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// خطّ Cairo ذاتيّ الاستضافة عبر next/font — غير حاجب للعرض (يحسّن LCP وCore Web
// Vitals) بدل رابط Google Fonts. يُعرَّف كمتغيّر CSS يستهلكه Tailwind (font-arabic).
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-cairo",
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
    default: "مسكني — عقارات اليمن: تواصل مع صاحب العقار مباشرة",
    template: "%s | مسكني",
  },
  description: "شقق وأراضٍ وفلل للبيع والإيجار في صنعاء وعدن وتعز وكل المحافظات، ومقاولون وفنيّون بتقييمات حقيقية، وبلاغات احتيال تحميك قبل أن تدفع — كل ذلك مجّاناً وبلا عمولة.",
  keywords: [
    "عقارات", "عقارات اليمن", "مسكني اليمن", "عقارات صنعاء", "عقارات عدن",
    "عقارات تعز", "بيع", "إيجار", "شقق للإيجار", "شقق للبيع",
    "فلل", "أراضي", "محلات تجارية", "خدمات عقارية", "مقاول", "سبّاك", "كهربائي",
    "طلبات عقارية", "بلاغات احتيال عقاري", "مسكني", "maskani",
  ],
  authors: [{ name: "مسكني" }],
  applicationName: "مسكني",
  alternates: { canonical: "/", languages: { "ar-YE": "/", ar: "/" } },
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
    title: "مسكني | عقارات اليمن — بيع وإيجار شقق وأراضٍ وخدمات",
    description: "شقق وأراضٍ وفلل في صنعاء وعدن وتعز وكل المحافظات، وخدمات عقارية موثوقة.",
    siteName: "مسكني",
    locale: "ar_AR",
    type: "website",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: "مسكني — المنصة العقارية الاجتماعية في اليمن" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "مسكني | عقارات اليمن — بيع وإيجار شقق وأراضٍ وخدمات",
    description: "شقق وأراضٍ وفلل في صنعاء وعدن وتعز وكل المحافظات، وخدمات عقارية موثوقة.",
    images: ["/og.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4F2396",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-arabic antialiased bg-cream min-h-screen">
        <Analytics />
        <VisitTracker />
        <AdSenseScript />
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
                description: "منصة عقارية اجتماعية في اليمن — بيع، إيجار، خدمات، ومكافحة الاحتيال العقاري",
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
