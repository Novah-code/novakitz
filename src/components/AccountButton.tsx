'use client';

/**
 * The top-right control: a gear.
 *
 * It was a hamburger, then for a day a face. What the drawer behind it holds is
 * pricing, the archetype test, the profile, language and signing in or out — a
 * settings drawer, now that the bottom tab bar carries the places (§0) — and a
 * gear says that without needing to know whose account it is. It is also the
 * same for someone signed in and someone who is not, which a face is not.
 *
 * While the drawer is open the button turns into an X in the same circle, since
 * it stays above the drawer and is the way out.
 *
 * The person's photo or first letter still appears, as the circle at the top of
 * the drawer, which is where the profile is opened from.
 *
 * Inline styles only: Tailwind is not imported here (§16).
 */

interface AccountButtonProps {
  language: 'en' | 'ko';
  open: boolean;
  onClick: () => void;
}

const INK = 'var(--matcha-dark, #4a6741)';
const SIZE = 46;

// Eight teeth on a ring, drawn once as a single outline. The hub is a separate
// circle so the stroke stays one weight everywhere.
const GEAR_PATH =
  'M10.13 5.25 L10.45 2.73 L13.55 2.73 L13.87 5.25 A7.00 7.00 0 0 1 15.45 5.91 L17.46 4.35 L19.65 6.54 L18.09 8.55 A7.00 7.00 0 0 1 18.75 10.13 L21.27 10.45 L21.27 13.55 L18.75 13.87 A7.00 7.00 0 0 1 18.09 15.45 L19.65 17.46 L17.46 19.65 L15.45 18.09 A7.00 7.00 0 0 1 13.87 18.75 L13.55 21.27 L10.45 21.27 L10.13 18.75 A7.00 7.00 0 0 1 8.55 18.09 L6.54 19.65 L4.35 17.46 L5.91 15.45 A7.00 7.00 0 0 1 5.25 13.87 L2.73 13.55 L2.73 10.45 L5.25 10.13 A7.00 7.00 0 0 1 5.91 8.55 L4.35 6.54 L6.54 4.35 L8.55 5.91 A7.00 7.00 0 0 1 10.13 5.25 Z';

export default function AccountButton({ language, open, onClick }: AccountButtonProps) {
  const label = open
    ? (language === 'ko' ? '메뉴 닫기' : 'Close menu')
    : (language === 'ko' ? '설정' : 'Settings');

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
        padding: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 10000,
        color: INK,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(246,243,234,0.66) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: '0 6px 18px rgba(40, 60, 45, 0.16), inset 0 1px 0 rgba(255,255,255,0.95)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {open ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d={GEAR_PATH} />
          <circle cx="12" cy="12" r="2.9" />
        </svg>
      )}
    </button>
  );
}
