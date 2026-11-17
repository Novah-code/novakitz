'use client';

import AuraOrb from './AuraOrb';
import { emotionByKey, emotionShownLabel, PEBBLE_GLOW } from '../lib/emotions';

/**
 * Today's mood, as one card at the top of the Today tab. POST_LAUNCH §7-0 (the Ready
 * reference).
 *
 * Until now the home screen gave no sign that the morning had been recorded:
 * the Mood button looked the same at 6am as at 6pm, and the only proof the
 * pebble had been saved was the calendar two taps away. This puts the answer
 * where the question was asked — the pebble you chose, in its own shape and
 * colour, with its name in the display serif.
 *
 * The reference needs a glyph for each feeling. Novakitz already has one: the
 * eight pebble silhouettes, which the calendar draws a day in. So the card shows
 * the actual pebble rather than an icon of it.
 *
 * Tapping it reopens the picker, since recording again is a correction and the
 * later choice wins (see handleEmotionSelect).
 *
 * Inline styles only: Tailwind is not imported here (§16).
 */

interface TodayMoodCardProps {
  language: 'en' | 'ko';
  emotionKey: string;
  onChange: () => void;
}

const INK = '#2E3C33';
const MONO = "ui-monospace, 'SF Mono', Menlo, Monaco, monospace";

export default function TodayMoodCard({ language, emotionKey, onChange }: TodayMoodCardProps) {
  const emotion = emotionByKey(emotionKey);
  const glow = PEBBLE_GLOW[emotionKey];
  // A row written before the emotion was stored has no pebble to show.
  if (!emotion || !glow) return null;

  const ko = language === 'ko';
  const name = emotionShownLabel(emotion);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        // Under the top row: the settings gear on the right is 46px tall at 12px,
        // and the streak pill sits centred at 14px, so the card starts below both.
        top: 'calc(env(safe-area-inset-top, 0px) + 12px + 46px + 12px)',
        zIndex: 900,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 18px',
        pointerEvents: 'none',
      }}
    >
      <button
        type="button"
        onClick={onChange}
        aria-label={ko ? `오늘의 기분: ${name}. 눌러서 바꾸기` : `Today's mood: ${name}. Tap to change`}
        style={{
          pointerEvents: 'auto',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '420px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 14px 0 18px',
          borderRadius: '30px',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          color: INK,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 8px 24px rgba(40, 60, 45, 0.16), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.08)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* The glow bleeding in from the corner, in the pebble's own light. */}
        {/* The glow is clipped by its own layer: on iOS a blurred child escapes the rounded
            corners of a parent that only has overflow: hidden, so the colour spilled out of the frame. */}
        <span
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', isolation: 'isolate', WebkitMaskImage: '-webkit-radial-gradient(white, black)', pointerEvents: 'none' }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '-26px',
              top: '-40px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${glow.light}88 0%, ${glow.light}00 70%)`,
            }}
          />
          </span>

        {/*
          The pebble as the picker draws it — the pale fill, white rim and soft
          raised shadow — so the card shows the thing that was tapped, not a new
          version of it.
        */}
        <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
          <AuraOrb emotionKey={emotionKey} size={52} />
        </span>

        <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontFamily: ko ? "'Pretendard', sans-serif" : MONO,
              fontSize: ko ? '12px' : '10.5px',
              letterSpacing: ko ? '0' : '0.16em',
              textTransform: ko ? 'none' : 'uppercase',
              opacity: 0.62,
            }}
          >
            {ko ? '오늘의 기분' : "Today's mood"}
          </span>
          {/* Instrument Serif has no Hangul, so Korean keeps the UI face (globals.css). */}
          <span
            style={{
              marginTop: '2px',
              fontFamily: ko ? "'KoDisplay', 'Pretendard', serif" : 'var(--font-display), Georgia, serif',
              fontSize: ko ? '21px' : '32px',
              fontWeight: ko ? 500 : 400,
              lineHeight: 1.1,
              letterSpacing: ko ? '-0.3px' : '-0.01em',
            }}
          >
            {name}
          </span>
        </span>

        {/* The small round control: change it. */}
        <span
          aria-hidden="true"
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            boxShadow: '0 2px 8px rgba(40,60,45,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: INK,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h4L19 9a2.100 2.100 0 0 0-4-4L4 16v4Z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
