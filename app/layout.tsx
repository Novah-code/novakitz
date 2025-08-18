import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstall from "./pwa-install";
import UpdateNotification from "../src/components/UpdateNotification";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nova Kitz - What's brewing in your dreams?",
  description: "Discover the hidden messages in your dreams with Nova Kitz - your AI-powered dream interpretation companion with modern design.",
  keywords: "dream interpretation, AI dreams, dream analysis, Nova Kitz, subconscious, personal growth",
  manifest: "/manifest.json",
  themeColor: "#7fb069",
  colorScheme: "dark light",
  viewport: "width=device-width, initial-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nova Kitz"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icons/icon-152x152.svg", sizes: "152x152", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" }
    ]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Nova Kitz",
    "application-name": "Nova Kitz",
    "msapplication-TileColor": "#7fb069",
    "msapplication-config": "none"
  }
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
        <UpdateNotification onUpdate={() => console.log('App updated!')} />
        {children}
      </body>
    </html>
  );
}
