/*
 * The palette and the panel the marketing-side pages are built from.
 *
 * These lived as a private `const G` inside app/pricing/page.tsx. The support
 * page needs the same surface — it is the page someone lands on from the App
 * Store, and it sitting one shade off from the paywall would read as a
 * different product. Two copies of a design system is how a screen ends up
 * looking like nobody decided anything, so there is one copy now.
 */
export const G = {
  bgMain: '#E8F3EA',
  glass: 'rgba(255,255,255,0.5)',
  glassHover: 'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(255,255,255,0.8)',
  textDark: '#3A4A3E',
  textBase: '#5C7061',
  textLight: '#8BA390',
  green: '#7AB382',
  gold: '#D4A33B',
  pink: '#D67A6B',
} as const;

export const panel: React.CSSProperties = {
  background: G.glass,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: `1px solid ${G.glassBorder}`,
  borderRadius: 32,
  boxShadow: '0 10px 40px rgba(0,0,0,0.03), inset 2px 2px 10px rgba(255,255,255,0.5)',
};
