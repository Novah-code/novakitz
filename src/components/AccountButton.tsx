'use client';

/**
 * The top-right control: a gear.
 *
 * It was a hamburger, then for a day a face. What it opens is the settings menu
 * — profile, Pro, the archetype test, settings — now that the bottom tab bar
 * carries the places (§0), and a gear says that without needing to know whose
 * account it is. It is also the same for someone signed in and someone who is
 * not, which a face is not.
 *
 * It stays a gear while the menu is open: the menu is a small popover under it,
 * not a panel that covers it, so there is nothing to turn it into an X for.
 *
 * Inline styles only: Tailwind is not imported here (§16).
 */

import { GearIcon } from './menuIcons';

interface AccountButtonProps {
  language: 'en' | 'ko';
  open: boolean;
  onClick: () => void;
}

const INK = 'var(--matcha-dark, #4a6741)';
const SIZE = 46;

export default function AccountButton({ language, open, onClick }: AccountButtonProps) {
  const label = language === 'ko' ? '설정' : 'Settings';

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
      <GearIcon size={24} />
    </button>
  );
}
