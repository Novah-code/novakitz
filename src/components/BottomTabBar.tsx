'use client';

/**
 * The three places the app is for: today, what you have written, what it adds
 * up to. POST_LAUNCH §0.
 *
 * These used to be seven rows in a drawer behind a hamburger. The two screens
 * that make a month feel like it accumulated — the calendar and the journal —
 * sat two taps away from the screen people open every morning, and the screens
 * Pro sells (monthly review, patterns) were split across two more rows, so
 * nobody could see what they would be buying. Three tabs always on screen
 * answer both: the places are visible, and the Pro ones live under one name.
 *
 *   Today     the circle. The face of the app.
 *   Journal   Inner Journal + Calendar — both are "what I wrote", one a list
 *             and one a month.
 *   Insights  Reflection + Monthly Review — both are "what it means".
 *
 * Each of the last two holds two existing screens. They are not merged into one
 * component — each is a long file with its own state — so a small switch floats
 * above the bar to move between the pair. Merging them properly can follow once
 * the navigation has been on a phone for a while.
 *
 * Inline styles only: Tailwind is installed but not imported here (§16).
 */

export type TabId = 'today' | 'journal' | 'insights';
export type SubId = 'history' | 'calendar' | 'insights' | 'monthly';

/** Height of the capsule itself. */
const CAPSULE_HEIGHT = 64;
/** Gap between the capsule and the home indicator. */
const CAPSULE_GAP = 10;
/**
 * Space the bar reserves above the home indicator: the capsule, the gap under
 * it, and a little air on top. The panels shrink by this.
 */
export const TAB_BAR_HEIGHT = CAPSULE_HEIGHT + CAPSULE_GAP + 10;
/** Height the floating switch takes when it is showing, including its gap. */
export const SUB_SWITCH_SPACE = 56;

interface BottomTabBarProps {
  language: 'en' | 'ko';
  active: TabId;
  sub: SubId | null;
  onSelectTab: (tab: TabId) => void;
  onSelectSub: (sub: SubId) => void;
}

const LABELS = {
  en: { today: 'Today', journal: 'Journal', insights: 'Insights', history: 'Entries', calendar: 'Calendar', reflection: 'Reflection', monthly: 'Monthly' },
  ko: { today: '오늘', journal: '저널', insights: '인사이트', history: '기록', calendar: '달력', reflection: '리플렉션', monthly: '월간 리뷰' },
} as const;

const INK = 'var(--matcha-dark, #4a6741)';
// Darker than the app's usual sage: the labels sit on glass over a bright sky,
// and at 10.5px the lighter tone read as washed out.
const SAGE = '#566b5b';

function Icon({ tab }: { tab: TabId }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (tab === 'today') {
    // The pebble: a circle with the small dot the home circle carries.
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (tab === 'journal') {
    return (
      <svg {...common}>
        <path d="M6 4.5h10.5a1.5 1.5 0 0 1 1.5 1.5v13.5H7.5A1.5 1.5 0 0 1 6 18V4.5Z" />
        <path d="M6 18a1.5 1.5 0 0 1 1.5-1.5H18" />
        <path d="M9.5 8.5h5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 4v3.2M12 16.8V20M4 12h3.2M16.8 12H20" />
      <path d="M12 8.2c.5 2.2 1.6 3.3 3.8 3.8-2.2.5-3.3 1.6-3.8 3.8-.5-2.2-1.6-3.3-3.8-3.8 2.2-.5 3.3-1.6 3.8-3.8Z" />
    </svg>
  );
}

export default function BottomTabBar({ language, active, sub, onSelectTab, onSelectSub }: BottomTabBarProps) {
  const t = LABELS[language];

  const tabs: TabId[] = ['today', 'journal', 'insights'];

  // Only the two tabs that hold a pair of screens get the floating switch.
  const pair: Array<{ id: SubId; label: string }> | null =
    active === 'journal'
      ? [{ id: 'history', label: t.history }, { id: 'calendar', label: t.calendar }]
      : active === 'insights'
        ? [{ id: 'insights', label: t.reflection }, { id: 'monthly', label: t.monthly }]
        : null;

  return (
    <>
      {/*
        The panels end above the bar, and whatever is behind them shows through
        the gap — on a phone that was the home screen's bright noisy sky, in a
        strip right behind the switch. A dock of the bar's own paper under both
        makes the bottom of the screen one surface.
      */}
      {pair && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: `calc(env(safe-area-inset-bottom, 0px) + ${TAB_BAR_HEIGHT + SUB_SWITCH_SPACE}px)`,
            zIndex: 10002,
            background: 'rgb(246, 243, 234)',
          }}
        />
      )}

      {pair && (
        <div
          role="tablist"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: `calc(env(safe-area-inset-bottom, 0px) + ${TAB_BAR_HEIGHT + 4}px)`,
            zIndex: 10003,
            display: 'flex',
            gap: '2px',
            padding: '3px',
            borderRadius: '999px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(244,241,231,0.78) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 6px 18px rgba(40, 60, 45, 0.14), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        >
          {pair.map((p) => {
            const on = sub === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onSelectSub(p.id)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontSize: '12.5px',
                  fontWeight: on ? 600 : 500,
                  letterSpacing: '0.01em',
                  color: on ? '#fff' : SAGE,
                  background: on ? INK : 'transparent',
                  transition: 'background 0.2s, color 0.2s',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/*
        A capsule that floats above the content rather than a strip fixed to the
        edge — the shape in the reference (Opal). It is glass, so what scrolls
        under it stays faintly visible, and the active tab is a raised pill that
        fills its slot, not just a tinted icon.
      */}
      <nav
        aria-label={language === 'ko' ? '주요 메뉴' : 'Main'}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${CAPSULE_GAP}px)`,
          zIndex: 10002,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 18px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            gap: '4px',
            width: '100%',
            maxWidth: '420px',
            height: `${CAPSULE_HEIGHT}px`,
            padding: '6px',
            boxSizing: 'border-box',
            borderRadius: `${CAPSULE_HEIGHT / 2}px`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.74) 0%, rgba(244,241,231,0.62) 100%)',
            backdropFilter: 'blur(26px) saturate(190%)',
            WebkitBackdropFilter: 'blur(26px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.75)',
            boxShadow:
              '0 12px 32px rgba(40, 60, 45, 0.20), 0 2px 6px rgba(40, 60, 45, 0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.10)',
          }}
        >
          {tabs.map((tab) => {
            const on = active === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onSelectTab(tab)}
                aria-current={on ? 'page' : undefined}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  border: on ? '1px solid rgba(255,255,255,0.9)' : '1px solid transparent',
                  borderRadius: `${(CAPSULE_HEIGHT - 12) / 2}px`,
                  cursor: 'pointer',
                  color: on ? INK : SAGE,
                  background: on
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(232,241,232,0.92) 100%)'
                    : 'transparent',
                  boxShadow: on
                    ? '0 3px 10px rgba(40, 60, 45, 0.14), inset 0 1px 0 rgba(255,255,255,1)'
                    : 'none',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.25s, box-shadow 0.25s, color 0.2s',
                }}
              >
                <Icon tab={tab} />
                <span style={{ fontSize: '10.5px', fontWeight: on ? 600 : 500, letterSpacing: '0.04em', opacity: on ? 1 : 0.85 }}>
                  {t[tab]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
