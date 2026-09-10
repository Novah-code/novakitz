import { readMarkdownFile, convertMarkdownToHtml } from '@/lib/markdownReader';
import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy - Novakitz',
  description: 'Privacy Policy for Novakitz inner journaling platform',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      current="privacy"
      html={convertMarkdownToHtml(readMarkdownFile('privacy-policy.md'))}
    />
  );
}
