import { readMarkdownFile, convertMarkdownToHtml } from '@/lib/markdownReader';
import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms of Service - Novakitz',
  description: 'Terms of Service for Novakitz inner journaling platform',
};

export default function TermsPage() {
  return (
    <LegalPage
      current="terms"
      html={convertMarkdownToHtml(readMarkdownFile('terms-of-service.md'))}
    />
  );
}
