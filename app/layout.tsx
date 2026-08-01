import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CityProvider } from "@/context/CityContext";
import { AuthGateProvider } from "@/context/AuthGate";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

export const metadata: Metadata = {
  metadataBase: new URL("https://maskani.homes"),
  title: {
    default: "مسكني — المنصة العقارية الاجتماعية",
    template: "%s | مسكني",
  },
  description: "منصة عقارية اجتماعية تربط بين صاحب العقار والعميل — بيع، إيجار، خدمات، ومجتمع لمكافحة الاحتيال العقاري",
  keywords: [
    "عقارات", "عقارات اليمن", "بيع", "إيجار", "شقق للإيجار", "شقق للبيع",
    "فلل", "أراضي", "محلات تجارية", "خدمات عقارية", "مقاول", "سبّاك", "كهربائي",
    "طلبات عقارية", "بلاغات احتيال عقاري", "مسكني", "maskani",
  ],
  authors: [{ name: "مسكني" }],
  applicationName: "مسكني",
  alternates: { canonical: "/" },
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
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    title: "مسكني — المنصة العقارية الاجتماعية",
    description: "ابحث عن عقارك المثالي",
    siteName: "مسكني",
    locale: "ar_AR",
    type: "website",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "مسكني" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "مسكني — المنصة العقارية الاجتماعية",
    description: "ابحث عن عقارك المثالي",
    images: ["/icon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-arabic antialiased bg-cream min-h-screen">
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
                  target: { "@type": "EntryPoint", urlTemplate: "https://maskani.homes/listings?search={query}" },
                  "query-input": "required name=query",
                },
              },
            ]),
          }}
        />
        <AuthProvider>
          <AuthGateProvider>
            <CityProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </CityProvider>
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
