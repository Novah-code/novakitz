'use client';

import { TAB_BAR_HEIGHT } from './BottomTabBar';

/**
 * The two ways into the morning, as two buttons you can see. POST_LAUNCH §0-4.
 *
 * Until now the circle was the only door to both. A tap opened the pebbles, and
 * a long press — nothing on screen says so beyond a screen-reader label — skipped
 * them and opened the dream form. App Review could not find the second door and
 * the answer to their question had to be written out by hand. Anyone who wanted
 * to write a dream before it faded had to start by choosing a mood, and anyone
 * who only wanted the mood was asked about a dream they did not have.
 *
 * So both are on the screen, side by side, the same size:
 *
 *   Mood    the five-second path. Same as tapping the circle. Still the
 *           cheapest thing in the app, and still all it takes to count a morning.
 *   Dream   straight to the form. Same as long-pressing the circle, which is
 *           kept for anyone who already does it.
 *
 * They are equal on purpose. Pushing the dream to a small corner icon would
 * repeat the mistake the long press was invented to avoid — dreams are gone
 * within minutes, and the person who has one is the person with the least time.
 *
 * They float above the tab bar rather than inside it: the bar is for places to
 * go, these are things to do.
 *
 * Inline styles only: Tailwind is not imported here (§16).
 */

interface HomeActionsProps {
  language: 'en' | 'ko';
  onMood: () => void;
  onDream: () => void;
}

const LABELS = {
  en: { mood: 'Mood', moodSub: 'How you woke', dream: 'Dream', dreamSub: 'Write it down' },
  ko: { mood: '무드', moodSub: '오늘 아침은?', dream: '꿈', dreamSub: '적어두기' },
} as const;

const INK = 'var(--matcha-dark, #4a6741)';

function MoodIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DreamIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2Z" />
      <path d="M17 4.2v2.6M15.7 5.5h2.6" />
    </svg>
  );
}

export default function HomeActions({ language, onMood, onDream }: HomeActionsProps) {
  const t = LABELS[language];

  const button = (kind: 'mood' | 'dream') => (
    <button
      type="button"
      onClick={kind === 'mood' ? onMood : onDream}
      style={{
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 10px 0 16px',
        height: '60px',
        borderRadius: '30px',
        cursor: 'pointer',
        textAlign: 'left',
        color: INK,
        fontFamily: 'inherit',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.76) 0%, rgba(246,243,234,0.62) 100%)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: '0 8px 24px rgba(40, 60, 45, 0.16), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.08)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/*
        A blob of colour bleeding in from the corner, the way the reference's
        cards glow. Each door has its own: warm for the mood, which is about how
        the body woke, and cool for the dream. They are the pebbles' own tones,
        so the two buttons read as part of the same family as what they open.
      */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-18px',
          bottom: '-34px',
          width: '104px',
          height: '104px',
          borderRadius: '50%',
          background: kind === 'mood'
            ? 'radial-gradient(circle, rgba(255,184,150,0.85) 0%, rgba(255,176,196,0.45) 45%, rgba(255,176,196,0) 72%)'
            : 'radial-gradient(circle, rgba(184,166,255,0.80) 0%, rgba(160,200,255,0.42) 45%, rgba(160,200,255,0) 72%)',
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>{kind === 'mood' ? <MoodIcon /> : <DreamIcon />}</span>
      <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>{kind === 'mood' ? t.mood : t.dream}</span>
        <span style={{ fontSize: '11.5px', fontWeight: 500, opacity: 0.72, whiteSpace: 'nowrap' }}>
          {kind === 'mood' ? t.moodSub : t.dreamSub}
        </span>
      </span>
      {/* The white round "+" — the reference's small control on each card. */}
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.96)',
          boxShadow: '0 2px 8px rgba(40,60,45,0.14)',
          color: INK,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </button>
  );

  return (
    <div
      className="home-actions"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${TAB_BAR_HEIGHT + 6}px)`,
        // Under the panels (10001) and the tab bar (10002), above the scene.
        zIndex: 900,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 18px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: '10px', width: '100%', maxWidth: '420px' }}>
        {button('mood')}
        {button('dream')}
      </div>
    </div>
  );
}
