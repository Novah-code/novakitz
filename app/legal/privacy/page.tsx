import { readMarkdownFile } from '@/lib/markdownReader';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Novakitz',
  description: 'Privacy Policy for Novakitz dream journaling platform',
};

export default function PrivacyPage() {
  const content = readMarkdownFile('privacy-policy.md');

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
          <div
            className="prose prose-sm md:prose-base max-w-none
              prose-headings:text-[#7CB892]
              prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4
              prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-4 prose-li:text-gray-700
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {content}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <Link href="/legal/terms" className="text-[#7CB892] hover:underline mx-2">
            Terms of Service
          </Link>
          |
          <Link href="/legal/refund" className="text-[#7CB892] hover:underline mx-2">
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
