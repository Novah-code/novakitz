import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support - Novakitz',
  description:
    'Help with Novakitz: how to record a dream or a mood, what Free and Pro include, cancelling or restoring a subscription, and deleting your account.',
  alternates: {
    canonical: 'https://www.novakitz.com/support',
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
