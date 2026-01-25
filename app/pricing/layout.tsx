import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Pricing - Novakitz Premium Plans",
  description: "Choose your Novakitz plan: Free (7 AI interpretations/month), Premium ($5.99/month), or Lifetime ($129 one-time). Unlock unlimited dream analysis and Jungian insights.",
  keywords: [
    "Novakitz pricing", "dream journal subscription", "AI dream analysis pricing",
    "premium dream interpretation", "lifetime dream journal"
  ],
  openGraph: {
    title: "Novakitz Pricing - Premium Dream Journal Plans",
    description: "Unlock AI-powered dream analysis with Novakitz Premium. Start free or go lifetime!",
    url: "https://www.novakitz.shop/pricing",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Novakitz Pricing Plans",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Novakitz Pricing - Premium Dream Journal Plans",
    description: "Unlock AI-powered dream analysis with Novakitz Premium. Start free or go lifetime!",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://www.novakitz.shop/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
