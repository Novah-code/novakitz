import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstall from "./pwa-install";
import UpdateNotification from "../src/components/UpdateNotification";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.novakitz.shop'),
  title: {
    default: "Novakitz - AI Dream Journal & Jungian Analysis | 꿈 해석 다이어리",
    template: "%s | Novakitz"
  },
  description: "Discover the hidden messages in your dreams with AI-powered Jungian analysis. Track your dreams, uncover archetypes, and receive personalized daily affirmations. 무의식 탐험과 AI 꿈 분석으로 자기 성장을 경험하세요.",
  keywords: [
    "dream journal", "dream interpretation", "AI dream analysis", "Jungian psychology",
    "archetypes", "subconscious mind", "dream diary", "self discovery", "personal growth",
    "꿈 해석", "꿈 분석", "꿈 일기", "무의식", "융 심리학", "아키타입", "자기 성장"
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
    url: "https://www.novakitz.shop",
    siteName: "Novakitz",
    title: "Novakitz - AI Dream Journal & Jungian Analysis",
    description: "Discover the hidden messages in your dreams with AI-powered Jungian analysis. Track dreams, uncover archetypes, and grow.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Novakitz - AI Dream Journal",
        type: "image/png",
      }
    ],
  },
  // Twitter Card - 트위터/X 공유 시 표시
  twitter: {
    card: "summary_large_image",
    title: "Novakitz - AI Dream Journal & Jungian Analysis",
    description: "Discover the hidden messages in your dreams with AI-powered Jungian analysis.",
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
    canonical: "https://www.novakitz.shop",
    languages: {
      'en-US': 'https://www.novakitz.shop',
      'ko-KR': 'https://www.novakitz.shop',
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
      { url: "/favicon.ico?v=5", sizes: "any" },
      { url: "/icons/icon-192x192.png?v=5", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png?v=5", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=5", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=5", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-192x192.png?v=5", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=5", sizes: "192x192", type: "image/png" }
    ],
    shortcut: "/icons/icon-192x192.png?v=5"
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
  colorScheme: "light"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=5" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=5" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png?v=5" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
        </div>
        <PWAInstall />
        <UpdateNotification />
        {children}
      </body>
    </html>
  );
}
