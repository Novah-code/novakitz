import type { Metadata, Viewport } from "next";
import { Inter, Roboto, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import UpdateNotification from "../src/components/UpdateNotification";
import CapacitorBridge from "../src/components/CapacitorBridge";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: true,
});

/*
 * The morning screens' display face.
 *
 * Loaded through next/font rather than a <link> to fonts.googleapis.com
 * because the app runs from capacitor://localhost as a static export — a
 * remote stylesheet would leave the heading in the fallback face whenever the
 * phone is offline, which for a morning app is often. next/font copies the
 * file into the bundle at build time.
 */
const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.novakitz.com'),
  verification: {
    google: 'SvyOB5oGhTT8D7TUzeOLkpMP2s04Jg0DIkXb66GgHQo',
  },
  title: {
    default: "Novakitz",
    template: "%s | Novakitz"
  },
  description: "A one-minute morning ritual. Record how you woke up, write the dream while you still have it, and read it back — with a calendar, a monthly review and a daily affirmation drawn from what you actually recorded. 아침 1분, 오늘의 기분과 꿈을 기록하고 다시 읽어보세요.",
  keywords: [
    "morning ritual", "dream journal", "dream interpretation", "mood tracker",
    "dream diary", "self discovery", "personal growth", "reflection", "affirmations",
    "모닝루틴", "꿈 해석", "꿈 일기", "감정 기록", "자기 성장", "확언"
  ],
  authors: [{ name: "Novakitz" }],
  creator: "Novakitz",
  publisher: "Novakitz",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Open Graph - 카카오톡, 페이스북 공유 시 표시
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ko_KR",
    url: "https://www.novakitz.com",
    siteName: "Novakitz",
    title: "Novakitz - A Morning Ritual for Dreams and Moods",
    description: "Record how you woke up and the dream you still have, and read it back. One minute, every morning.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Novakitz - AI Inner Journal",
        type: "image/png",
      }
    ],
  },
  // Twitter Card - 트위터/X 공유 시 표시
  twitter: {
    card: "summary_large_image",
    title: "Novakitz - A Morning Ritual for Dreams and Moods",
    description: "Record how you woke up and the dream you still have, and read it back. One minute, every morning.",
    images: ["/og-image.png"],
    creator: "@novakitz",
  },
  // 검색 로봇 설정
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // 정식 URL (중복 콘텐츠 방지)
  alternates: {
    canonical: "https://www.novakitz.com",
    languages: {
      'en-US': 'https://www.novakitz.com',
      'ko-KR': 'https://www.novakitz.com',
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Novakitz"
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=6", sizes: "any" },
      { url: "/icons/icon-192x192.png?v=6", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png?v=6", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=6", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=6", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-192x192.png?v=6", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=6", sizes: "192x192", type: "image/png" }
    ],
    shortcut: "/icons/icon-192x192.png?v=6"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Novakitz",
    "application-name": "Novakitz",
    "msapplication-TileColor": "#F7F3E9",
    "msapplication-config": "none"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  themeColor: "#e5f4e6",
  colorScheme: "light",
  // Lets the page extend under the notch and home indicator, which the
  // full-bleed home screen needs. Without it iOS reports every
  // env(safe-area-inset-*) as 0, so the insets used below do nothing.
  viewportFit: "cover"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://wylrihmhfmgisgixnlrd.supabase.co" />
        <link rel="dns-prefetch" href="https://wylrihmhfmgisgixnlrd.supabase.co" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <link rel="icon" href="/favicon.ico?v=6" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=6" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png?v=6" />
      </head>
      <body className={`${inter.variable} ${roboto.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <div className="particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
        </div>
        <CapacitorBridge />
        <UpdateNotification />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
