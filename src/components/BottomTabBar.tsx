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
 * Since 2026-11-27 the bar has two more things in it, neither a place: a raised
 * "+" in the middle (write a dream — the same form as the home's Dream button)
 * and Profile at the right end (opens the settings sheet, which the gear at the
 * top right also opens). Labels were dropped; every button still has an
 * aria-label for VoiceOver.
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
/** How far the raised "+" stands above the capsule. */
const PLUS_RISE = 18;
export const TAB_BAR_HEIGHT = CAPSULE_HEIGHT + CAPSULE_GAP + 10 + PLUS_RISE;
/** Height the floating switch takes when it is showing, including its gap. */
export const SUB_SWITCH_SPACE = 56;
/**
 * Journal's switch (Calendar | Entries) sits at the top of the screen, next to
 * the close/settings button, so it takes no room above the bar. Insights'
 * switch is still the floating one at the bottom.
 */
export const subSwitchSpace = (tab: TabId): number => (tab === 'insights' ? SUB_SWITCH_SPACE : 0);

interface BottomTabBarProps {
  language: 'en' | 'ko';
  active: TabId;
  sub: SubId | null;
  onSelectTab: (tab: TabId) => void;
  onSelectSub: (sub: SubId) => void;
  /** The raised "+": open the dream form. */
  onPlus: () => void;
  /** The last slot: open the settings sheet. */
  onProfile: () => void;
}

const LABELS = {
  en: { today: 'Today', journal: 'Journal', insights: 'Insights', plus: 'Write a dream', profile: 'Profile', history: 'Entries', calendar: 'Calendar', reflection: 'Reflection', monthly: 'Monthly' },
  ko: { today: '오늘', journal: '저널', insights: '인사이트', plus: '꿈 기록하기', profile: '프로필', history: '기록', calendar: '달력', reflection: '리플렉션', monthly: '월간 리뷰' },
} as const;

const INK = '#2E3C33';
// Darker than the app's usual sage: the labels sit on glass over a bright sky,
// and at 10.5px the lighter tone read as washed out.
const SAGE = '#6b7d71';

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

function ProfileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="10" r="2.6" />
      <path d="M6.8 17.4c1.2-2 3-2.8 5.2-2.8s4 .8 5.2 2.8" />
    </svg>
  );
}

export default function BottomTabBar({ language, active, sub, onSelectTab, onSelectSub, onPlus, onProfile }: BottomTabBarProps) {
  const t = LABELS[language];

  const switchAtTop = active === 'journal';

  // Only the two tabs that hold a pair of screens get the floating switch.
  const pair: Array<{ id: SubId; label: string }> | null =
    active === 'journal'
      ? [{ id: 'calendar', label: t.calendar }, { id: 'history', label: t.history }]
      : active === 'insights'
        ? [{ id: 'insights', label: t.reflection }, { id: 'monthly', label: t.monthly }]
        : null;

  const slot = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: `${(CAPSULE_HEIGHT - 12) / 2}px`,
    cursor: 'pointer',
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent',
    transition: 'background 0.25s, box-shadow 0.25s, color 0.2s',
  } as const;

  const renderTab = (tab: TabId) => {
    const on = active === tab;
    return (
      <button
        key={tab}
        type="button"
        onClick={() => onSelectTab(tab)}
        aria-label={t[tab]}
        aria-current={on ? 'page' : undefined}
        style={{
          ...slot,
          color: on ? INK : SAGE,
          border: on ? '1px solid rgba(255,255,255,0.9)' : '1px solid transparent',
          background: on ? 'rgba(255,255,255,0.96)' : 'transparent',
          boxShadow: on ? '0 3px 10px rgba(40, 60, 45, 0.14), inset 0 1px 0 rgba(255,255,255,1)' : 'none',
        }}
      >
        <Icon tab={tab} />
      </button>
    );
  };

  return (
    <>
      {/*
        The panels end above the bar, and whatever is behind them shows through
        the gap — on a phone that was the home screen's bright noisy sky, in a
        strip right behind the switch. A dock of the bar's own paper under both
        makes the bottom of the screen one surface.
      */}
      {/*
        A dock under the switch and the bar, painted with the same sky as the
        full-screen panels above it. The sky is a viewport-tall layer pinned to the
        dock's bottom edge, so it lines up with the panel's own and the bottom of
        the screen reads as one surface. (`background-attachment: fixed` did this
        on desktop but iOS ignores it, so the whole sky was squeezed into the dock
        and showed as a butter-yellow band — seen on a phone, 2026-11-05.) It stops the home
        screen (its Mood and Dream buttons) showing through the gap the panels
        leave above the bar.
      */}
      {pair && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: `calc(env(safe-area-inset-bottom, 0px) + ${TAB_BAR_HEIGHT + subSwitchSpace(active)}px)`,
            zIndex: 10002,
            backgroundColor: '#F4EEE5',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '100dvh',
              backgroundImage: 'var(--home-sky-day)',
            }}
          />
          {/* Reflection's panel has no grain of its own, so a grained dock showed as a band under it. */}
          {sub !== 'insights' && <div className="home-scene__grain home-scene__grain--flat" aria-hidden="true" />}
        </div>
      )}

      {pair && (
        <div
          role="tablist"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            ...(switchAtTop
              ? { top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }
              : { bottom: `calc(env(safe-area-inset-bottom, 0px) + ${TAB_BAR_HEIGHT + 4}px)` }),
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
                  padding: switchAtTop ? '0 18px' : '7px 16px',
                  height: switchAtTop ? 34 : undefined,
                  borderRadius: '999px',
                  fontSize: switchAtTop ? '13.5px' : '12.5px',
                  fontWeight: on ? 600 : 500,
                  letterSpacing: '0.01em',
                  color: on ? '#2E3C33' : SAGE,
                  background: on ? 'rgba(255,255,255,0.96)' : 'transparent',
                  boxShadow: on ? '0 2px 8px rgba(40,60,45,0.14)' : 'none',
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
            gap: '0px',
            width: '100%',
            maxWidth: '420px',
            height: `${CAPSULE_HEIGHT}px`,
            padding: '6px 4px',
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
          {(['today', 'journal'] as TabId[]).map(renderTab)}

          {/* The raised "+": a dream is gone within minutes, so the door to writing one stays in reach on every tab. */}
          <div style={{ flex: 'none', width: 66, display: 'flex', justifyContent: 'center', alignSelf: 'flex-start', marginTop: -(PLUS_RISE - 2) }}>
            <button
              type="button"
              onClick={onPlus}
              aria-label={t.plus}
              style={{
                width: 58,
                height: 58,
                padding: 0,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.85)',
                background: 'linear-gradient(160deg, #F4B7CB, #EDA3BC)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(205,120,152,0.45), inset 0 1px 0 rgba(255,255,255,0.6)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {renderTab('insights')}

          <button
            type="button"
            onClick={onProfile}
            aria-label={t.profile}
            style={{ ...slot, color: SAGE, border: '1px solid transparent', background: 'transparent' }}
          >
            <ProfileIcon />
          </button>
        </div>
      </nav>
    </>
  );
}
