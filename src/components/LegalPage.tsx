import Link from 'next/link';

/*
 * The frame the three legal pages share.
 *
 * They each carried their own copy of it, written in Tailwind: a gradient
 * background, a centred column, a white card. None of it rendered — Tailwind
 * is in package.json and wired into PostCSS, but nothing imports it, so it
 * emits an empty stylesheet. What a reviewer opening "Terms of Use" from the
 * paywall actually got was unstyled text running edge to edge on a white page.
 *
 * So it is inline styles now, like the rest of the app, and in one place
 * instead of three.
 */

const LINKS: Record<string, { href: string; label: string }> = {
  terms: { href: '/legal/terms/', label: 'Terms of Service' },
  privacy: { href: '/legal/privacy/', label: 'Privacy Policy' },
  refund: { href: '/legal/refund/', label: 'Refund Policy' },
};

export default function LegalPage({
  html,
  current,
}: {
  html: string;
  /* Which of the three this is, so it does not link to itself. */
  current: 'terms' | 'privacy' | 'refund';
}) {
  const others = (Object.keys(LINKS) as Array<keyof typeof LINKS>).filter((k) => k !== current);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5E8 0%, #F5E8E8 100%)',
        padding: '32px 16px calc(env(safe-area-inset-bottom, 0px) + 48px)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: 20,
            color: '#4a7a5f',
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          ← Back to Home
        </Link>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '28px 24px',
            boxShadow: '0 8px 28px rgba(47, 59, 51, 0.10)',
            /* Long URLs and email addresses in these documents were pushing the
               card wider than the phone. */
            overflowWrap: 'anywhere',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          {others.map((key, i) => (
            <span key={key}>
              {i > 0 && <span style={{ margin: '0 6px' }}>|</span>}
              <Link href={LINKS[key].href} style={{ color: '#4a7a5f', textDecoration: 'none' }}>
                {LINKS[key].label}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
