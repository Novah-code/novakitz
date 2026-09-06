import { readMarkdownFile, convertMarkdownToHtml } from '@/lib/markdownReader';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Novakitz',
  description: 'Terms of Service for Novakitz inner journaling platform',
};

export default function TermsPage() {
  const html = convertMarkdownToHtml(readMarkdownFile('terms-of-service.md'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E8] to-[#F5E8E8]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-block mb-6 text-[#7CB892] hover:text-[#5a9370] transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* The markdown is converted in markdownReader; the classes it emits do
              the styling, because the Tailwind typography plugin the old
              `prose-*` classes needed was never installed. */}
          <div
            className="max-w-none text-[15px]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <Link href="/legal/privacy/" className="text-[#7CB892] hover:underline mx-2">
            Privacy Policy
          </Link>
          |
          <Link href="/legal/refund/" className="text-[#7CB892] hover:underline mx-2">
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
