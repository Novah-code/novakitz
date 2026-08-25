import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Pricing - Novakitz Pro Plans",
  description: "Choose your Novakitz plan: Free gives 7 AI interpretations a month, Pro gives one every day. Morning mood check-ins, dream interpretation, and Jungian insight.",
  keywords: [
    "Novakitz pricing", "inner journal subscription", "AI dream analysis pricing",
    "premium dream interpretation", "lifetime inner journal"
  ],
  openGraph: {
    title: "Novakitz Pricing - Pro Inner Journal Plans",
    description: "Unlock AI-powered dream analysis with Novakitz Pro. Start free.",
    url: "https://www.novakitz.com/pricing",
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
    title: "Novakitz Pricing - Pro Inner Journal Plans",
    description: "Unlock AI-powered dream analysis with Novakitz Pro. Start free.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://www.novakitz.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
