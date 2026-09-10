import { readMarkdownFile, convertMarkdownToHtml } from '@/lib/markdownReader';
import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Refund Policy - Novakitz',
  description: 'Refund Policy for Novakitz premium subscriptions',
};

export default function RefundPage() {
  return (
    <LegalPage
      current="refund"
      html={convertMarkdownToHtml(readMarkdownFile('refund-policy.md'))}
    />
  );
}
