'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AuraOrb from './AuraOrb';

/*
 * The dream reading, one card at a time.
 *
 * It was four text blocks in one long scroll, then Save. Now each block is its
 * own card: nothing to choose, only to read and move on. The picture on each
 * card is the app's own aura (the one 윤아님 picked for the mood picker) until
 * there are drawings to replace it.
 *
 * Moving on: swipe sideways, tap the arrows, or tap a bar at the top. The card
 * body scrolls on its own, so a long reading never fights the swipe — only a
 * mostly-horizontal drag changes the card.
 */

export interface AnalysisItem {
  /** Small label above the title, e.g. "Dream symbols". Missing for plain paragraphs. */
  title?: string;
  body: string;
}

/** An aura per card, in the order the sections arrive; extra cards reuse them. */
const AURAS = ['peaceful', 'hopeful', 'joyful', 'lonely'];

export default function DreamAnalysisCards({
  items,
  language,
  footer,
}: {
  items: AnalysisItem[];
  language: 'ko' | 'en';
  /** Shown under the last card (Save, the Pro nudge). */
  footer?: ReactNode;
}) {
  const [i, setI] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const ko = language === 'ko';
  const last = items.length - 1;

  if (items.length === 0) return null;

  const go = (n: number) => setI(Math.min(last, Math.max(0, n)));
  const item = items[i];

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? i + 1 : i - 1);
  };

  const round = (disabled: boolean) => ({
    width: 44,
    height: 44,
    padding: 0,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.9)',
    background: 'rgba(255,255,255,0.92)',
    boxShadow: '0 2px 10px rgba(40,60,45,0.14)',
    color: '#2E3C33',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }) as const;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Progress: a bar per card, each one a way to jump. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }} role="tablist" aria-label={ko ? '분석 카드' : 'Reading cards'}>
        {items.map((_, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={`${n + 1} / ${items.length}`}
            onClick={() => go(n)}
            style={{ width: 28, height: 22, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ display: 'block', width: '100%', height: 4, borderRadius: 2, background: n === i ? '#EDA3BC' : 'rgba(255,255,255,0.6)', transition: 'background 0.25s ease' }} />
          </button>
        ))}
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          width: '100%',
          touchAction: 'pan-y',
          borderRadius: 28,
          padding: '22px 22px 24px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(246,243,234,0.76) 100%)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 14px 34px rgba(40,60,45,0.14)',
          boxSizing: 'border-box',
        }}
      >
        <div key={i} style={{ animation: 'dream-card-in 0.28s ease both' }}>
          <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }} aria-hidden="true">
            <AuraOrb emotionKey={AURAS[i % AURAS.length]} size={110} />
          </div>
          {item.title && (
            <div style={{ fontSize: 12.5, letterSpacing: ko ? 0.6 : 1.6, color: '#7d8f82', fontWeight: 700, textTransform: ko ? 'none' : 'uppercase', textAlign: 'center' }}>
              {i + 1} · {item.title}
            </div>
          )}
          <div style={{ marginTop: 14, maxHeight: '34vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', fontSize: 15, lineHeight: 1.85, color: '#4A5D4E', whiteSpace: 'pre-line', textAlign: 'left' }}>
            {item.body}
          </div>
        </div>
        <style>{`@keyframes dream-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`}</style>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 20 }}>
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label={ko ? '이전' : 'Previous'} style={round(i === 0)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontSize: 13, color: '#7d8f82', minWidth: 44, textAlign: 'center' }}>{i + 1} / {items.length}</span>
        <button type="button" onClick={() => go(i + 1)} disabled={i === last} aria-label={ko ? '다음' : 'Next'} style={round(i === last)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {i === last && footer}
    </div>
  );
}
