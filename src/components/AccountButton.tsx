'use client';

/**
 * The top-right control: the person, not a menu.
 *
 * It was a hamburger — three bars, the convention of a desktop site — and the
 * reference apps put a face there instead. Almost nothing the drawer holds is
 * navigation any more now that the bottom tab bar carries the places (§0); what
 * is left is pricing, the archetype test, settings, language and signing in or
 * out, which are all about the account. So the button says whose it is.
 *
 *   signed in   their photo if they set one, otherwise the first letter of
 *               their name on a soft wash of the pebble colours
 *   guest       a plain person outline
 *   menu open   an X in the same circle, since this button stays above the
 *               drawer and is the way out of it
 *
 * Inline styles only: Tailwind is not imported here (§16).
 */

interface AccountButtonProps {
  language: 'en' | 'ko';
  open: boolean;
  signedIn: boolean;
  avatarUrl?: string | null;
  /** First letter shown when there is no photo. */
  initial?: string;
  onClick: () => void;
}

const INK = 'var(--matcha-dark, #4a6741)';
const SIZE = 46;

export default function AccountButton({ language, open, signedIn, avatarUrl, initial, onClick }: AccountButtonProps) {
  const label = open
    ? (language === 'ko' ? '메뉴 닫기' : 'Close menu')
    : (language === 'ko' ? '계정 메뉴' : 'Account menu');

  let face: React.ReactNode;
  if (open) {
    face = (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  } else if (signedIn && avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    face = <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
  } else if (signedIn && initial) {
    face = (
      <span
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 600,
          color: INK,
          // The pebbles' own tones, so the avatar belongs with what it opens.
          background:
            'radial-gradient(circle at 28% 24%, rgba(255,214,190,0.95) 0%, rgba(255,214,190,0) 58%), radial-gradient(circle at 78% 80%, rgba(190,178,255,0.85) 0%, rgba(190,178,255,0) 62%), linear-gradient(180deg, #F4F8EF 0%, #E2EEDF 100%)',
          textTransform: 'uppercase',
        }}
      >
        {initial}
      </span>
    );
  } else {
    face = (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.6" />
        <path d="M5 19.5c.9-3.6 3.6-5.4 7-5.4s6.1 1.8 7 5.4" />
      </svg>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        right: 'calc(env(safe-area-inset-right, 0px) + 18px)',
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        padding: signedIn && !open ? '3px' : 0,
        boxSizing: 'border-box',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 10000,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(246,243,234,0.66) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: '0 6px 18px rgba(40, 60, 45, 0.16), inset 0 1px 0 rgba(255,255,255,0.95)',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.2s',
      }}
    >
      {face}
    </button>
  );
}
