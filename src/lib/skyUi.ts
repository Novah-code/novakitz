import type { CSSProperties } from 'react';

/*
 * The small windows on the home screen's sky.
 *
 * The sign-in panel, the confirm dialog, the badge, the reminder ask and the
 * toast were each a different white-and-green card. They share the look of the
 * streak window now: a frosted scrim, the home gradient in a rounded frame, ink
 * text, white pill buttons. One copy, so they cannot drift apart again.
 */
export const INK = '#2E3C33';
export const BASE = '#4A5D4E';
export const LIGHT = '#7d8f82';
export const PINK = '#EDA3BC';
export const ROSE = '#C27A8C';

export const scrim: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(60,50,70,0.32)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
};

export const skyCard: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundImage: 'var(--home-sky-day)',
  backgroundColor: '#F4EEE5',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: '0 24px 60px rgba(40,30,60,0.28), inset 0 1px 0 rgba(255,255,255,0.9)',
  boxSizing: 'border-box',
  color: INK,
};

export const displayFont = (ko: boolean): string =>
  ko ? "'KoDisplay', 'Pretendard', serif" : 'var(--font-display), Georgia, serif';

export const heading = (ko: boolean, en = 32, kr = 22): CSSProperties => ({
  fontFamily: displayFont(ko),
  fontSize: ko ? kr : en,
  fontWeight: ko ? 500 : 400,
  letterSpacing: ko ? '-0.5px' : 0,
  lineHeight: 1.2,
  color: INK,
  margin: 0,
});

/** White pill with the home buttons' soft shadow. */
export const pillWhite: CSSProperties = {
  width: '100%',
  padding: '15px 20px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.9)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,243,234,0.86) 100%)',
  boxShadow: '0 8px 20px rgba(40,60,45,0.14), inset 0 1px 0 rgba(255,255,255,0.95)',
  color: INK,
  fontSize: 15,
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

/** Translucent pill for the quieter choice. */
export const pillGlass: CSSProperties = {
  ...pillWhite,
  background: 'rgba(255,255,255,0.45)',
  boxShadow: 'none',
};

export const roundX: CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 14,
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
  zIndex: 3,
};
