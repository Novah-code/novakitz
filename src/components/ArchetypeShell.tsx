'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import '../styles/home-scene.css';
import { goTo } from '../lib/platform';
import { INK, BASE, LIGHT, PINK, ROSE, displayFont, pillWhite } from '../lib/skyUi';

/*
 * The archetype test, on the home screen's sky.
 *
 * It used to be five pages of white cards on a grey gradient with a hamburger
 * menu pinned at the top right — which sat on the status bar on a notched phone,
 * and whose drawer listed the app's own tabs back to the app. The app now has a
 * tab bar and a settings sheet, so the menu is gone: one round back control at
 * the top left, and the language switch where the page needs it.
 */

interface ShellProps {
  language: 'ko' | 'en';
  onLanguageChange?: (lang: 'ko' | 'en') => void;
  /** What the round control does. Defaults to going back one page. */
  onBack?: () => void;
  /** Leave the test and return to the app's home instead of one page back. */
  backHome?: boolean;
  children: ReactNode;
}

const round: CSSProperties = {
  position: 'fixed',
  top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
  width: 40,
  height: 40,
  padding: 0,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 2px 10px rgba(40,60,45,0.16)',
  color: INK,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
};

export default function ArchetypeShell({ language, onLanguageChange, onBack, backHome, children }: ShellProps) {
  const router = useRouter();
  const ko = language === 'ko';

  const back = () => {
    if (onBack) return onBack();
    if (backHome) return goTo('/');
    router.back();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        color: INK,
        fontFamily: ko ? "'Pretendard', sans-serif" : "'Roboto', sans-serif",
      }}
    >
      {/* The sky is its own fixed layer: `background-attachment: fixed` is ignored on iOS. */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'var(--home-sky-day)', backgroundColor: '#F4EEE5', pointerEvents: 'none' }} />
      <div className="home-scene__grain" aria-hidden="true" style={{ position: 'fixed', zIndex: 0 }} />

      <button onClick={back} aria-label={ko ? '뒤로' : 'Back'} style={{ ...round, left: 16 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>

      {onLanguageChange && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            right: 16,
            zIndex: 10,
            display: 'flex',
            gap: 2,
            padding: 3,
            height: 40,
            boxSizing: 'border-box',
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 2px 10px rgba(40,60,45,0.12)',
          }}
        >
          {(['ko', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              style={{
                border: 'none',
                borderRadius: 17,
                padding: '0 14px',
                fontSize: 13,
                fontFamily: 'inherit',
                fontWeight: language === l ? 700 : 500,
                color: language === l ? INK : LIGHT,
                background: language === l ? 'rgba(255,255,255,0.96)' : 'transparent',
                boxShadow: language === l ? '0 2px 8px rgba(40,60,45,0.14)' : 'none',
                cursor: 'pointer',
              }}
            >
              {l === 'ko' ? '한국어' : 'EN'}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          boxSizing: 'border-box',
          padding: 'calc(env(safe-area-inset-top, 0px) + 68px) 22px calc(env(safe-area-inset-bottom, 0px) + 40px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Shared pieces ─────────────────────────────────────────────────────── */

export const glass: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
  backdropFilter: 'blur(22px) saturate(180%)',
  WebkitBackdropFilter: 'blur(22px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: '0 8px 24px rgba(40,60,45,0.12), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.08)',
};

export function Heading({ ko, children, size = 40, koSize = 26, style }: { ko: boolean; children: ReactNode; size?: number; koSize?: number; style?: CSSProperties }) {
  return (
    <h1
      style={{
        margin: 0,
        textAlign: 'center',
        lineHeight: 1.15,
        color: INK,
        fontFamily: displayFont(ko),
        fontSize: ko ? koSize : size,
        fontWeight: ko ? 500 : 400,
        letterSpacing: ko ? '-0.5px' : 0,
        textWrap: 'balance' as CSSProperties['textWrap'],
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function Subline({ ko, children }: { ko: boolean; children: ReactNode }) {
  return (
    <p style={{ margin: '14px 0 0', textAlign: 'center', fontFamily: displayFont(ko), fontStyle: ko ? 'normal' : 'italic', fontSize: ko ? 17 : 24, color: ROSE, lineHeight: 1.3 }}>
      {children}
    </p>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 15, lineHeight: 1.7, color: BASE, ...style }}>{children}</p>;
}

/** White pill with the round arrow, the same button the morning steps use. */
export function PillButton({ children, onClick, disabled, arrow = true, quiet, submit }: { children: ReactNode; onClick: () => void; disabled?: boolean; arrow?: boolean; quiet?: boolean; submit?: boolean }) {
  return (
    <button
      type={submit ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...pillWhite,
        position: 'relative',
        height: 58,
        padding: arrow ? '0 8px 0 26px' : '0 26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: arrow ? 'space-between' : 'center',
        gap: 20,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'default' : 'pointer',
        ...(quiet ? { background: 'rgba(255,255,255,0.45)', boxShadow: 'none' } : {}),
      }}
    >
      <span>{children}</span>
      {arrow && (
        <span
          aria-hidden="true"
          style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.96)', boxShadow: '0 2px 8px rgba(40,60,45,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </span>
      )}
    </button>
  );
}

/** A progress bar in the colours the morning steps use. */
export function Progress({ pct }: { pct: number }) {
  return (
    <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.55)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: PINK, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  );
}
