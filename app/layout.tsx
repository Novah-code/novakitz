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
  title: "novakitz - What's brewing in your dreams?",
  description: "Discover the hidden messages in your dreams with novakitz - your AI-powered dream interpretation companion with modern design.",
  keywords: "dream interpretation, AI dreams, dream analysis, novakitz, subconscious, personal growth",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "novakitz"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png?v=4", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=4", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-192x192.png?v=4", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=4", sizes: "192x192", type: "image/png" }
    ],
    shortcut: "/icons/icon-192x192.png?v=4"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "novakitz",
    "application-name": "novakitz",
    "msapplication-TileColor": "#7fb069",
    "msapplication-config": "none"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  themeColor: "#7fb069",
  colorScheme: "dark light"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
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
